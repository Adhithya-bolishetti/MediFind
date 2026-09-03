package com.medifind.video.signaling;

import com.medifind.auth.service.JwtService;
import com.medifind.user.entity.User;
import com.medifind.video.dto.CallAuthorization;
import com.medifind.video.service.VideoCallService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

/**
 * Authenticates and authorises a signaling connection before the socket opens.
 *
 * <p>Browsers cannot set headers on a WebSocket handshake, so the JWT arrives as
 * a {@code token} query parameter. The room is then re-checked against the
 * appointment — holding a room id is never on its own enough to connect.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class VideoHandshakeInterceptor implements HandshakeInterceptor {

    /** Key under which the authorised identity is published to the handler. */
    public static final String AUTH_ATTRIBUTE = "videoCallAuth";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final VideoCallService videoCallService;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        Map<String, String> params = UriComponentsBuilder.fromUri(request.getURI())
                .build().getQueryParams().toSingleValueMap();

        Long userId = resolveUserId(params.get("token"));
        if (userId == null) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        CallAuthorization auth = videoCallService.authorizeRoomAccess(params.get("roomId"), userId);
        if (auth == null) {
            response.setStatusCode(HttpStatus.FORBIDDEN);
            return false;
        }

        attributes.put(AUTH_ATTRIBUTE, auth);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // Nothing to do — authorisation is fully resolved before the handshake.
    }

    private Long resolveUserId(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        try {
            String username = jwtService.extractUsername(token);
            if (username == null) {
                return null;
            }
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            if (!jwtService.isTokenValid(token, userDetails) || !(userDetails instanceof User user)) {
                return null;
            }
            return user.getId();
        } catch (Exception ex) {
            log.debug("Rejected video signaling handshake: {}", ex.getMessage());
            return null;
        }
    }
}
