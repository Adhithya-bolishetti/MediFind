package com.medifind.video.service;

import com.medifind.video.dto.CallAuthorization;
import com.medifind.video.dto.VideoRoomResponse;

public interface VideoCallService {

    /**
     * Resolve (creating on first use) the room for an appointment, after checking
     * that the caller is a participant and that the call window is open.
     *
     * @throws org.springframework.web.server.ResponseStatusException 403/404/400 when the call may not be joined
     */
    VideoRoomResponse getRoom(Long appointmentId, Long userId);

    /**
     * Authorise a signaling connection. Applies exactly the same rules as
     * {@link #getRoom}, keyed by room token instead of appointment id.
     *
     * @return the caller's identity in the room, or {@code null} if they may not connect
     */
    CallAuthorization authorizeRoomAccess(String roomId, Long userId);

    /** Stamp the session start the first time somebody connects. */
    void markStarted(String roomId);

    /** Stamp the session end once the room empties. */
    void markEnded(String roomId);
}
