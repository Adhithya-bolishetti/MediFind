package com.medifind.hospital.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class HospitalReviewResponse {
    private Long id;
    private Long hospitalId;
    private Long patientId;
    private Long appointmentId;
    private Integer rating;
    private String reviewText;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
