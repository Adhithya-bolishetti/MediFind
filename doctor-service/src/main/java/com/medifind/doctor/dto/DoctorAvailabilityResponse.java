package com.medifind.doctor.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DoctorAvailabilityResponse {
    private Long doctorId;
    private boolean available;
    private String workingDays;
    private String consultationStartTime;
    private String consultationEndTime;
    private Integer appointmentDuration;
}
