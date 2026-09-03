package com.medifind.video.dto;

import lombok.Builder;
import lombok.Data;

/** Result of authorising a user against a room, used by the signaling handshake. */
@Data
@Builder
public class CallAuthorization {
    private Long appointmentId;
    private String roomId;
    private Long userId;
    private String role;
    private String name;
}
