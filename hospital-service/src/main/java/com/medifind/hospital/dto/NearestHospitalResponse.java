package com.medifind.hospital.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NearestHospitalResponse {
    private Long hospitalId;
    private String hospitalName;
    private String address;
    private String city;
    private String phoneNumber;
    private boolean emergencyAvailable;
    private Double latitude;
    private Double longitude;
    private Double distanceInKm;
}
