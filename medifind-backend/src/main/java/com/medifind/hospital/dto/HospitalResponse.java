package com.medifind.hospital.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Read-only DTO returned from Hospital API endpoints.
 * Intentionally excludes sensitive or internal fields.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HospitalResponse {

    private Long id;
    private String hospitalName;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String phoneNumber;
    private String email;
    private Double latitude;
    private Double longitude;
    private boolean emergencyAvailable;
    private boolean active;
    private String hospitalType;
    private String description;
    private String website;
    private String facilities;
    private String specialties;
    private String operatingHours;
    private boolean ambulanceAvailable;
    private String ambulancePhone;
    private String imageUrl;
    private String status;
    private Long userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    private Double rating;
    private Integer totalReviews;
    private RatingDistribution ratingDistribution;
    private java.util.List<HospitalImageResponse> images;
}
