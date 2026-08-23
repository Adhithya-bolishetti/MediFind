package com.medifind.doctor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for a hospital returned from emergency symptom search,
 * ranked by distance from the user.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RankedHospitalResponse {

    private Long id;
    private String hospitalName;
    private String address;
    private String city;
    private String phoneNumber;
    private boolean emergencyAvailable;
    private Double latitude;
    private Double longitude;

    /** Distance from user in km, null if user location not provided. */
    private Double distanceKm;
}
