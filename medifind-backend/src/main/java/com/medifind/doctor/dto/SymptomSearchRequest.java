package com.medifind.doctor.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for symptom-based doctor search.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SymptomSearchRequest {

    /** List of symptom strings provided by the user (e.g. "fever", "chest pain"). */
    @NotEmpty(message = "At least one symptom is required")
    private List<String> symptoms;

    /** User's current latitude for distance-based ranking. */
    private Double latitude;

    /** User's current longitude for distance-based ranking. */
    private Double longitude;
}
