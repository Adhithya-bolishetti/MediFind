package com.medifind.hospital.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * DTO used for creating or updating a {@link com.medifind.hospital.entity.Hospital}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HospitalRequest {

    @NotBlank(message = "Hospital name is required")
    private String hospitalName;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone number must be 10–15 digits")
    private String phoneNumber;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0",  message = "Latitude must be <= 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0",  message = "Longitude must be <= 180")
    private Double longitude;

    private boolean emergencyAvailable;
}
