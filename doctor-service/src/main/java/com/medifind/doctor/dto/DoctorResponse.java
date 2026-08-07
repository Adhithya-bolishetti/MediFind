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
    private String doctorName;
    private String specialization;
    private String qualification;
    private Integer experience;
    private Double consultationFee;
    private Double rating;
    private Long hospitalId;

    /** Enriched hospital information fetched via Feign — may be null if Hospital Service is unavailable. */
    private HospitalResponse hospitalInfo;

    private String city;
    private String state;
    private String phoneNumber;
    private String email;
    private String profileImage;
    private boolean available;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
