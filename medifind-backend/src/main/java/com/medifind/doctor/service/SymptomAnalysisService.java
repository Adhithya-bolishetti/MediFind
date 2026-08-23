package com.medifind.doctor.service;

import java.util.List;

/**
 * Service for analysing user-reported symptoms and determining the
 * appropriate medical specialization, severity, and emergency status.
 */
public interface SymptomAnalysisService {

    /** Result of analysing a list of symptoms. */
    record SymptomAnalysis(
        /** The most relevant specialization for the given symptoms. */
        String specialization,
        /** Whether the symptoms constitute a medical emergency. */
        boolean emergency,
        /** Explicit condition type: "NORMAL" or "EMERGENCY". */
        String conditionType,
        /** Confidence score (0.0 – 1.0) in the specialization recommendation. */
        double confidence,
        /** Individual symptom strings that matched the internal knowledge base. */
        List<String> matchedSymptoms,
        /** Severity score (0-100) calculated from symptom categories. */
        int severityScore,
        /** Human-readable explanation of why the classification was made. */
        String explanation
    ) {}

    /**
     * Analyse the given list of symptoms and return an analysis result.
     *
     * @param symptoms raw symptom strings from the user (case-insensitive)
     * @return analysis containing specialization, emergency flag, confidence, etc.
     */
    SymptomAnalysis analyse(List<String> symptoms);
}
