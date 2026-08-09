package com.medifind.appointment.dto;

import lombok.Data;

@Data
public class DoctorAvailabilityResponse {
    private Long doctorId;
    private boolean available;
    private String workingDays;
    private String consultationStartTime;
    private String consultationEndTime;
    private Integer appointmentDuration;
}
