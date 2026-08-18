package com.medifind.hospital.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * DTO used by a hospital owner to create or update their own profile.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HospitalProfileRequest {

    @NotBlank(message = "Hospital name is required")
    private String hospitalName;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    private String pincode;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone number must be 10–15 digits")
    private String phoneNumber;

    @Email(message = "Email must be valid")
    private String email;

    private String hospitalType;

    private String description;

    private String website;

    /** Comma-separated facilities. */
    private String facilities;

    /** Comma-separated specialties. */
    private String specialties;

    private String operatingHours;

    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180")
    private Double longitude;

    private boolean emergencyAvailable;

    private Boolean ambulanceAvailable;

    // Emergency hotlines can be short (e.g. 108, 911), so allow 3–15 digits.
    @Pattern(regexp = "^\\+?[0-9]{3,15}$", message = "Ambulance phone must be a valid emergency number")
    private String ambulancePhone;

    /** Cover image (base64 data URL) — optional. */
    private String imageUrl;
}
