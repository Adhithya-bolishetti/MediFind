package com.medifind.video.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/** Everything the browser needs to open a consultation call. */
@Data
@Builder
public class VideoRoomResponse {
    private Long appointmentId;
    private String roomId;
    /** Relative signaling path, e.g. {@code /ws/video} — the client resolves the host. */
    private String signalingPath;
    private CallParticipantResponse self;
    private CallParticipantResponse peer;
    private List<IceServerResponse> iceServers;
    private LocalDateTime scheduledAt;
    private LocalDateTime joinableFrom;
    private LocalDateTime joinableUntil;
}
