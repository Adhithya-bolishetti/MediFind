package com.medifind.doctor.dto;

import com.medifind.doctor.entity.ReviewStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DoctorReviewResponse {
    private Long id;
    private Long doctorId;
    private Long patientId;
    private Long appointmentId;
    private Integer rating;
    private String reviewText;
    private Boolean recommendation;
    private ReviewStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
