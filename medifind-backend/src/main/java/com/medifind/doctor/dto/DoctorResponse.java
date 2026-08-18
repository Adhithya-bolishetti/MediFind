package com.medifind.doctor.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Read-only DTO returned from Doctor API endpoints.
 * Includes enriched {@code hospitalInfo} fetched from the Hospital Service via Feign.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorResponse {

    private Long id;
    private Long userId;
    private String doctorName;
    private String specialization;
    private String qualification;
    private Integer experience;
    private Double consultationFee;
    private Double rating;
    private Integer totalReviews;
    private RatingDistribution ratingDistribution;
    private Long hospitalId;

    /** Enriched hospital information fetched via Feign — may be null if Hospital Service is unavailable. */
    private HospitalResponse hospitalInfo;

    private String city;
    private String state;

    /** Clinic/hospital name as stored on the doctor profile — used for display when no hospital is linked. */
    private String clinicName;
    private String clinicAddress;
    private Double latitude;
    private Double longitude;
    private String phoneNumber;
    private String email;
    private String profileImage;
    private boolean available;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
