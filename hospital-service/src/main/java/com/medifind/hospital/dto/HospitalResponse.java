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
    private String phoneNumber;
    private String email;
    private Double latitude;
    private Double longitude;
    private boolean emergencyAvailable;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
