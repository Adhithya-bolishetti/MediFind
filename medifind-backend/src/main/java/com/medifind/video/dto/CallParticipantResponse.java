package com.medifind.video.dto;

import lombok.Builder;
import lombok.Data;

/** Identity of one side of a consultation call. */
@Data
@Builder
public class CallParticipantResponse {
    private Long userId;
    /** "PATIENT" or "DOCTOR" — this participant's part in the appointment. */
    private String role;
    private String name;
    private String avatar;
}
