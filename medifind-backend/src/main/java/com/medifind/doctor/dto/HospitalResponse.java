package com.medifind.doctor.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO representing the Hospital data returned by the Hospital Service Feign client.
 * This is a local copy of the response structure — not shared from hospital-service.
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
    private String phoneNumber;
    private String email;
    private Double latitude;
    private Double longitude;
    private boolean emergencyAvailable;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
