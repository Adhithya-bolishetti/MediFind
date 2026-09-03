import { useCallback, useEffect, useRef, useState } from 'react';
import videoService, { buildSignalingUrl } from '../services/videoService';

/**
 * Call lifecycle, in the order a healthy call moves through them.
 * `waiting` means we are in the room alone; `ended` means the other side hung
 * up or the window closed.
 */
export const CALL_STATUS = {
  LOADING: 'loading',
  WAITING: 'waiting',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ENDED: 'ended',
  ERROR: 'error',
};

/**
 * Drives one peer-to-peer consultation: authorises the room over REST, opens
 * the signaling socket, and negotiates a single RTCPeerConnection.
 *
 * Exactly one side offers — the server tells the second participant to arrive
 * that it should initiate — so there is no glare to resolve.
 */
export default function useVideoCall(appointmentId) {
  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState(CALL_STATUS.LOADING);
  const [error, setError] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [peerMedia, setPeerMedia] = useState({ audio: true, video: true });

  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceServersRef = useRef([]);
  // ICE candidates can arrive before the answer/offer they belong to.
  const pendingCandidatesRef = useRef([]);
  const hangingUpRef = useRef(false);
  // Whether the other side is currently in the room. Relay messages sent while
  // alone have nowhere to go, so they are skipped rather than sent.
  const peerPresentRef = useRef(false);
  // Mirrors of the toggle state, so the long-lived signaling handlers always
  // report the current mute state rather than the values from first render.
  const micOnRef = useRef(true);
  const camOnRef = useRef(true);

  const send = useCallback((payload) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }, []);

  /** Sends only when somebody is there to receive it. */
  const sendToPeer = useCallback((payload) => {
    if (peerPresentRef.current) send(payload);
  }, [send]);

  const closePeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingCandidatesRef.current = [];
    setRemoteStream(null);
  }, []);

  /**
   * Builds a fresh peer connection wired to the current local tracks. Called
   * again after a peer drops so a rejoin renegotiates from a clean state
   * instead of reusing a half-torn-down connection.
   */
  const createPeerConnection = useCallback(() => {
    closePeerConnection();

    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
    const inbound = new MediaStream();

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        send({ type: 'ice-candidate', candidate: event.candidate.toJSON() });
      }
    };

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        if (!inbound.getTracks().includes(track)) inbound.addTrack(track);
      });
      setRemoteStream(inbound);
    };

    pc.onconnectionstatechange = () => {
      if (pc !== pcRef.current) return;
      if (pc.connectionState === 'connected') {
        setStatus(CALL_STATUS.CONNECTED);
      } else if (pc.connectionState === 'failed') {
        setError('The connection dropped. This usually means a firewall is blocking direct video — a TURN server is needed on this network.');
        setStatus(CALL_STATUS.ERROR);
      }
    };

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    pcRef.current = pc;
    return pc;
  }, [closePeerConnection, send]);

  const drainPendingCandidates = useCallback(async (pc) => {
    const queued = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        // A candidate that no longer applies is safe to drop.
      }
    }
  }, []);

  useEffect(() => {
    let disposed = false;

    const stop = () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      closePeerConnection();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    };

    const fail = (message) => {
      if (disposed) return;
      setError(message);
      setStatus(CALL_STATUS.ERROR);
    };

    const handleSignal = async (message) => {
      if (disposed) return;

      switch (message.type) {
        case 'joined': {
          peerPresentRef.current = Boolean(message.shouldInitiate);
          if (message.shouldInitiate) {
            // The peer is already here, so we drive the negotiation.
            setStatus(CALL_STATUS.CONNECTING);
            const pc = createPeerConnection();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            send({ type: 'offer', sdp: pc.localDescription.sdp });
          } else {
            setStatus(CALL_STATUS.WAITING);
          }
          break;
        }

        case 'peer-joined': {
          // The newcomer sends the offer; we just wait for it.
          peerPresentRef.current = true;
          setStatus(CALL_STATUS.CONNECTING);
          setPeerMedia({ audio: true, video: true });
          break;
        }

        case 'offer': {
          setStatus(CALL_STATUS.CONNECTING);
          const pc = createPeerConnection();
          await pc.setRemoteDescription({ type: 'offer', sdp: message.sdp });
          await drainPendingCandidates(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          send({ type: 'answer', sdp: pc.localDescription.sdp });
          // Let the caller render our current mute state immediately.
          send({ type: 'media-state', audio: micOnRef.current, video: camOnRef.current });
          break;
        }

        case 'answer': {
          const pc = pcRef.current;
          if (!pc || pc.signalingState === 'stable') break;
          await pc.setRemoteDescription({ type: 'answer', sdp: message.sdp });
          await drainPendingCandidates(pc);
          send({ type: 'media-state', audio: micOnRef.current, video: camOnRef.current });
          break;
        }

        case 'ice-candidate': {
          const pc = pcRef.current;
          if (!message.candidate) break;
          if (!pc || !pc.remoteDescription) {
            pendingCandidatesRef.current.push(message.candidate);
            break;
          }
          try {
            await pc.addIceCandidate(message.candidate);
          } catch {
            // Ignore candidates the connection has moved past.
          }
          break;
        }

        case 'media-state': {
          setPeerMedia({ audio: message.audio !== false, video: message.video !== false });
          break;
        }

        case 'peer-left':
        case 'hangup': {
          peerPresentRef.current = false;
          closePeerConnection();
          setPeerMedia({ audio: true, video: true });
          setStatus(message.type === 'hangup' ? CALL_STATUS.ENDED : CALL_STATUS.WAITING);
          break;
        }

        case 'error': {
          fail(message.message || 'The consultation server rejected this call.');
          break;
        }

        default:
          break;
      }
    };

    const start = async () => {
      let roomInfo;
      try {
        roomInfo = await videoService.getRoom(appointmentId);
      } catch (err) {
        fail(err.response?.data?.message || 'This consultation is not available.');
        return;
      }
      if (disposed) return;
      setRoom(roomInfo);
      iceServersRef.current = roomInfo.iceServers || [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
      } catch (err) {
        fail(err.name === 'NotAllowedError'
          ? 'Camera and microphone access was blocked. Allow it in your browser, then reload.'
          : 'No camera or microphone was found on this device.');
        return;
      }

      const ws = new WebSocket(buildSignalingUrl(roomInfo.signalingPath, roomInfo.roomId));
      wsRef.current = ws;

      ws.onmessage = (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }
        handleSignal(message).catch(() => fail('The call could not be negotiated. Please rejoin.'));
      };

      ws.onerror = () => fail('Could not reach the consultation server.');

      ws.onclose = () => {
        if (disposed || hangingUpRef.current) return;
        setStatus((current) => (current === CALL_STATUS.ERROR ? current : CALL_STATUS.ENDED));
      };
    };

    start();

    return () => {
      disposed = true;
      stop();
    };
    // The call is set up once per appointment; mute state is read through refs
    // inside the handlers rather than restarting negotiation on every toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    micOnRef.current = track.enabled;
    setMicOn(track.enabled);
    sendToPeer({ type: 'media-state', audio: track.enabled, video: camOnRef.current });
  }, [sendToPeer]);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    camOnRef.current = track.enabled;
    setCamOn(track.enabled);
    sendToPeer({ type: 'media-state', audio: micOnRef.current, video: track.enabled });
  }, [sendToPeer]);

  const hangUp = useCallback(() => {
    hangingUpRef.current = true;
    sendToPeer({ type: 'hangup' });
    wsRef.current?.close();
    closePeerConnection();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setStatus(CALL_STATUS.ENDED);
  }, [closePeerConnection, sendToPeer]);

  return {
    room, status, error,
    localStream, remoteStream,
    micOn, camOn, peerMedia,
    toggleMic, toggleCamera, hangUp,
  };
}
