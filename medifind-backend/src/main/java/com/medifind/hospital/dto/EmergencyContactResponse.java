package com.medifind.hospital.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyContactResponse {
    private Long hospitalId;
    private String hospitalName;
    private String emergencyPhone;
    private String address;
    private Double latitude;
    private Double longitude;
}
