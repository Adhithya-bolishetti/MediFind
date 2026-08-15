package com.medifind.doctor.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Long doctorId;
    private String doctorName;
    private Long userId;
    private String patientName;
    private Long appointmentId;
    private Integer rating;
    private String comment;
    private Boolean recommendation;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
