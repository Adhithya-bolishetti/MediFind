package com.medifind.doctor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for symptom-based doctor search.
 * Contains condition classification, severity, and doctor recommendations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SymptomSearchResponse {

    /** Explicit condition type: "NORMAL" or "EMERGENCY". */
    private String conditionType;

    /** Whether the symptoms constitute a medical emergency. */
    private boolean emergency;

    /** Severity score from 0 to 100. */
    private Integer severityScore;

    /** Confidence in the classification (0–100 scale). */
    private Double confidence;

    /** The recommended medical specialization based on symptom analysis. */
    private String specialization;

    /** Emergency warning message (populated only when emergency is true). */
    private String message;

    /** List of symptoms that were matched during analysis. */
    private List<String> matchedSymptoms;

    /** Human-readable explanation of why the classification was made. */
    private String explanation;

    /** Ranked list of recommended doctors (present in both emergency and normal responses). */
    private List<RankedDoctorResponse> recommendedDoctors;

    /** Nearest hospitals (populated only in emergency responses). */
    private List<RankedHospitalResponse> nearestHospitals;
}
