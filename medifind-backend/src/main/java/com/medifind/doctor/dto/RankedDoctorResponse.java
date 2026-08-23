package com.medifind.doctor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for a doctor returned from symptom-based search,
 * including ranking score and distance information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RankedDoctorResponse {

    private Long id;
    private String doctorName;
    private String specialization;
    private Integer experience;
    private Double rating;
    private Integer totalReviews;
    private String hospital;
    private String city;
    private String clinicAddress;
    private boolean available;
    private boolean availableForEmergency;
    private Double latitude;
    private Double longitude;
    private Double consultationFee;
    private String profileImage;

    /** Composite ranking score (0-100 scale). */
    private Double rankingScore;

    /** Distance from user in km, null if user location not provided. */
    private Double distanceKm;
}
