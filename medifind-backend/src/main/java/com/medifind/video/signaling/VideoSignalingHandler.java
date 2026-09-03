package com.medifind.video.signaling;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medifind.video.dto.CallAuthorization;
import com.medifind.video.service.VideoCallService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Relays WebRTC signaling between the two participants of a consultation.
 *
 * <p>The server never inspects SDP or ICE payloads — it only forwards them to
 * the other party in the same room, stamped with the sender's identity. Media
 * itself flows peer-to-peer and never touches this process.</p>
 *
 * <p>Room membership is mutated only inside {@link ConcurrentHashMap#compute},
 * so simultaneous joins and drops cannot interleave into a lost or orphaned
 * room.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class VideoSignalingHandler extends TextWebSocketHandler {

    /** Message types a client is allowed to relay to its peer. */
    private static final Set<String> RELAYABLE = Set.of("offer", "answer", "ice-candidate", "hangup", "media-state");

    /**
     * Types that are meaningless without a peer and are simply dropped when the
     * sender is alone — a muted mic or a hang-up with nobody listening is not an
     * error, and reporting one would tear down an otherwise healthy call.
     */
    private static final Set<String> ADVISORY = Set.of("ice-candidate", "hangup", "media-state");

    private static final int MAX_PARTICIPANTS = 2;

    private final ObjectMapper objectMapper;
    private final VideoCallService videoCallService;

    /** roomId -> live sessions. Rooms are created on first join and dropped when empty. */
    private final Map<String, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        CallAuthorization auth = authOf(session);
        String roomId = auth.getRoomId();

        List<WebSocketSession> replaced = new ArrayList<>();
        AtomicBoolean full = new AtomicBoolean(false);

        rooms.compute(roomId, (key, room) -> {
            Set<WebSocketSession> members = room != null ? room : ConcurrentHashMap.newKeySet();
            // A reconnect from the same user replaces their previous socket rather
            // than counting as a second participant.
            for (WebSocketSession existing : members) {
                if (auth.getUserId().equals(authOf(existing).getUserId())) {
                    replaced.add(existing);
                }
            }
            members.removeAll(replaced);

            if (members.size() >= MAX_PARTICIPANTS) {
                full.set(true);
            } else {
                members.add(session);
            }
            return members.isEmpty() ? null : members;
        });

        replaced.forEach(old -> close(old, CloseStatus.NORMAL.withReason("Reconnected elsewhere")));

        if (full.get()) {
            send(session, error("This consultation already has two participants"));
            close(session, CloseStatus.NOT_ACCEPTABLE.withReason("Room full"));
            return;
        }

        videoCallService.markStarted(roomId);

        WebSocketSession peer = peerOf(roomId, session);
        ObjectNode joined = objectMapper.createObjectNode();
        joined.put("type", "joined");
        joined.put("role", auth.getRole());
        // The second participant to arrive drives the offer, so exactly one side does.
        joined.put("shouldInitiate", peer != null);
        joined.set("peer", peer != null ? describe(authOf(peer)) : null);
        send(session, joined);

        if (peer != null) {
            ObjectNode peerJoined = objectMapper.createObjectNode();
            peerJoined.put("type", "peer-joined");
            peerJoined.set("peer", describe(auth));
            send(peer, peerJoined);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        CallAuthorization auth = authOf(session);
        ObjectNode payload;
        try {
            payload = (ObjectNode) objectMapper.readTree(message.getPayload());
        } catch (Exception ex) {
            send(session, error("Malformed signaling message"));
            return;
        }

        String type = payload.path("type").asText(null);
        if (!RELAYABLE.contains(type)) {
            send(session, error("Unsupported signaling message: " + type));
            return;
        }

        WebSocketSession peer = peerOf(auth.getRoomId(), session);
        if (peer == null) {
            if (!ADVISORY.contains(type)) {
                send(session, error("The other participant has not joined yet"));
            }
            return;
        }

        payload.set("from", describe(auth));
        send(peer, payload);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        CallAuthorization auth = authOf(session);
        if (auth == null) {
            return;
        }
        String roomId = auth.getRoomId();
        List<WebSocketSession> remaining = new ArrayList<>();
        AtomicBoolean wasMember = new AtomicBoolean(false);

        rooms.compute(roomId, (key, room) -> {
            if (room == null) {
                return null;
            }
            // A socket already evicted by a reconnect is no longer this room's
            // business — it must not report the participant as having left.
            wasMember.set(room.remove(session));
            remaining.addAll(room);
            return room.isEmpty() ? null : room;
        });

        if (!wasMember.get()) {
            return;
        }

        for (WebSocketSession peer : remaining) {
            ObjectNode left = objectMapper.createObjectNode();
            left.put("type", "peer-left");
            left.set("peer", describe(auth));
            send(peer, left);
        }

        if (remaining.isEmpty()) {
            videoCallService.markEnded(roomId);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.debug("Video signaling transport error: {}", exception.getMessage());
        close(session, CloseStatus.SERVER_ERROR);
    }

    private CallAuthorization authOf(WebSocketSession session) {
        return (CallAuthorization) session.getAttributes().get(VideoHandshakeInterceptor.AUTH_ATTRIBUTE);
    }

    /** @return the other participant's session, or {@code null} while alone in the room. */
    private WebSocketSession peerOf(String roomId, WebSocketSession self) {
        Set<WebSocketSession> room = rooms.get(roomId);
        if (room == null) {
            return null;
        }
        return room.stream()
                .filter(candidate -> !candidate.getId().equals(self.getId()))
                .filter(WebSocketSession::isOpen)
                .findFirst()
                .orElse(null);
    }

    private ObjectNode describe(CallAuthorization auth) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("userId", auth.getUserId());
        node.put("role", auth.getRole());
        node.put("name", auth.getName());
        return node;
    }

    private ObjectNode error(String message) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", "error");
        node.put("message", message);
        return node;
    }

    private void send(WebSocketSession session, ObjectNode payload) {
        if (session == null || !session.isOpen()) {
            return;
        }
        try {
            // Concurrent sends on one session corrupt the frame stream.
            synchronized (session) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
            }
        } catch (IOException ex) {
            log.debug("Failed to deliver signaling message: {}", ex.getMessage());
        }
    }

    private void close(WebSocketSession session, CloseStatus status) {
        try {
            session.close(status);
        } catch (IOException ignored) {
            // The socket is already gone — nothing left to clean up.
        }
    }
}
