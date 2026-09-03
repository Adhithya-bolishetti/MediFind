import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar, Box, Button, CircularProgress, IconButton, Paper, Tooltip, Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import useVideoCall, { CALL_STATUS } from '../hooks/useVideoCall';

const TEAL = '#079A9A';
const SHELL = '#0B1220';
const PANEL = '#111C2E';

/** Attaches a MediaStream to a <video> without re-rendering on every frame. */
const VideoSurface = ({ stream, muted, mirrored, hidden }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) {
      ref.current.srcObject = stream || null;
    }
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: mirrored ? 'scaleX(-1)' : 'none',
        opacity: hidden ? 0 : 1,
        transition: 'opacity 0.2s',
      }}
    />
  );
};

/** Shown in place of a video feed when a camera is off or nobody has joined. */
const Placeholder = ({ name, avatar, caption, spinner }) => (
  <Box sx={{
    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 1.5, color: '#E2E8F0',
  }}>
    <Avatar src={avatar || undefined} sx={{ width: 88, height: 88, bgcolor: TEAL, fontSize: 32, fontWeight: 700 }}>
      {(name || '?').charAt(0).toUpperCase()}
    </Avatar>
    <Typography variant="h6" fontWeight={700}>{name}</Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {spinner && <CircularProgress size={14} sx={{ color: TEAL }} />}
      <Typography variant="body2" sx={{ color: '#94A3B8' }}>{caption}</Typography>
    </Box>
  </Box>
);

const ControlButton = ({ title, onClick, active, danger, children }) => (
  <Tooltip title={title}>
    <IconButton
      onClick={onClick}
      sx={{
        width: 56, height: 56,
        bgcolor: danger ? '#DC2626' : active ? 'rgba(255,255,255,0.12)' : '#F1F5F9',
        color: danger ? '#fff' : active ? '#fff' : '#0F172A',
        '&:hover': { bgcolor: danger ? '#B91C1C' : active ? 'rgba(255,255,255,0.2)' : '#E2E8F0' },
      }}
    >
      {children}
    </IconButton>
  </Tooltip>
);

const VideoConsultation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    room, status, error,
    localStream, remoteStream,
    micOn, camOn, peerMedia,
    toggleMic, toggleCamera, hangUp,
  } = useVideoCall(id);

  const peerName = room?.peer?.role === 'DOCTOR'
    ? `Dr. ${(room.peer.name || '').replace(/^Dr\.?\s+/i, '')}`
    : room?.peer?.name || 'Participant';

  const leave = () => {
    hangUp();
    navigate('/appointments');
  };

  const isLive = status === CALL_STATUS.CONNECTED;
  const statusLabel = {
    [CALL_STATUS.LOADING]: 'Preparing your consultation…',
    [CALL_STATUS.WAITING]: `Waiting for ${peerName} to join…`,
    [CALL_STATUS.CONNECTING]: 'Connecting…',
    [CALL_STATUS.CONNECTED]: 'Connected',
    [CALL_STATUS.ENDED]: 'Call ended',
    [CALL_STATUS.ERROR]: 'Cannot connect',
  }[status];

  if (status === CALL_STATUS.ERROR || status === CALL_STATUS.ENDED) {
    const ended = status === CALL_STATUS.ENDED;
    return (
      <Box sx={{
        minHeight: '100vh', bgcolor: SHELL, display: 'flex',
        alignItems: 'center', justifyContent: 'center', p: 3,
      }}>
        <Paper elevation={0} sx={{ p: 5, borderRadius: 4, maxWidth: 460, textAlign: 'center', bgcolor: '#fff' }}>
          <Box sx={{
            width: 72, height: 72, mx: 'auto', mb: 2, borderRadius: '50%',
            bgcolor: ended ? '#ECFDF5' : '#FEF2F2', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {ended
              ? <VideoCallIcon sx={{ fontSize: 34, color: '#16A34A' }} />
              : <CallEndIcon sx={{ fontSize: 34, color: '#EF4444' }} />}
          </Box>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            {ended ? 'Consultation ended' : 'Cannot join this consultation'}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {ended
              ? 'The call has finished. You can rejoin while the appointment window is still open.'
              : error}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/appointments')}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, bgcolor: TEAL, '&:hover': { bgcolor: '#068A8A' } }}
            >
              Back to appointments
            </Button>
            {ended && (
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
              >
                Rejoin
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: SHELL, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 2, px: { xs: 2, md: 4 }, py: 2,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <IconButton onClick={leave} sx={{ color: '#94A3B8' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} color="#F8FAFC" noWrap>
            Consultation with {peerName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 8, height: 8, borderRadius: '50%',
              bgcolor: isLive ? '#22C55E' : '#F59E0B',
            }} />
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>{statusLabel}</Typography>
          </Box>
        </Box>
      </Box>

      {/* Stage */}
      <Box sx={{ flex: 1, position: 'relative', p: { xs: 1.5, md: 3 } }}>
        <Box sx={{
          position: 'relative', width: '100%', height: '100%', minHeight: { xs: 380, md: 460 },
          borderRadius: 4, overflow: 'hidden', bgcolor: PANEL,
        }}>
          <VideoSurface stream={remoteStream} muted={false} hidden={!remoteStream || !peerMedia.video} />
          {(!remoteStream || !peerMedia.video) && (
            <Placeholder
              name={peerName}
              avatar={room?.peer?.avatar}
              spinner={status !== CALL_STATUS.CONNECTED}
              caption={
                status === CALL_STATUS.WAITING ? 'Has not joined yet'
                  : status === CALL_STATUS.CONNECTED ? 'Camera is off'
                    : 'Connecting…'
              }
            />
          )}

          {!peerMedia.audio && remoteStream && (
            <Box sx={{
              position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 0.75,
              px: 1.5, py: 0.75, borderRadius: 2, bgcolor: 'rgba(15,23,42,0.75)', color: '#F8FAFC',
            }}>
              <MicOffIcon fontSize="small" />
              <Typography variant="caption" fontWeight={600}>Muted</Typography>
            </Box>
          )}

          {/* Self view */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'absolute', right: 16, bottom: 16,
              width: 190, height: 130, borderRadius: 14, overflow: 'hidden',
              background: '#0F172A', border: '2px solid rgba(255,255,255,0.14)',
            }}
          >
            <VideoSurface stream={localStream} muted mirrored hidden={!camOn} />
            {!camOn && (
              <Box sx={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#64748B',
              }}>
                <VideocamOffIcon />
              </Box>
            )}
            <Typography variant="caption" sx={{
              position: 'absolute', left: 8, bottom: 6, color: '#E2E8F0', fontWeight: 600,
              textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            }}>
              You
            </Typography>
          </motion.div>
        </Box>
      </Box>

      {/* Controls */}
      <Box sx={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2,
        py: 3, borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <ControlButton title={micOn ? 'Mute microphone' : 'Unmute microphone'} onClick={toggleMic} active={micOn}>
          {micOn ? <MicIcon /> : <MicOffIcon />}
        </ControlButton>
        <ControlButton title={camOn ? 'Turn camera off' : 'Turn camera on'} onClick={toggleCamera} active={camOn}>
          {camOn ? <VideocamIcon /> : <VideocamOffIcon />}
        </ControlButton>
        <ControlButton title="Leave consultation" onClick={leave} danger>
          <CallEndIcon />
        </ControlButton>
      </Box>
    </Box>
  );
};

export default VideoConsultation;
