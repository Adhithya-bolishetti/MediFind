package com.medifind.doctor.controller;

import com.medifind.doctor.dto.RankedDoctorResponse;
import com.medifind.doctor.dto.SymptomSearchRequest;
import com.medifind.doctor.dto.SymptomSearchResponse;
import com.medifind.doctor.service.DoctorRankingService;
import com.medifind.doctor.service.SymptomAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for symptom-based doctor search and recommendation.
 * <p>
 * Analyses user-reported symptoms, determines the appropriate medical
 * specialization, and returns ranked doctor recommendations. For emergency
 * situations, also returns nearest hospitals and a warning message.
 */
@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Symptom Search", description = "Symptom-based doctor recommendation APIs")
public class SymptomSearchController {

    private final SymptomAnalysisService symptomAnalysisService;
    private final DoctorRankingService doctorRankingService;

    /**
     * Analyse symptoms and return ranked doctor recommendations.
     *
     * <p><b>Normal response:</b> includes recommended specialization,
     * reason, and ranked doctors sorted by rating/experience/availability/distance.</p>
     *
     * <p><b>Emergency response:</b> includes emergency warning,
     * nearest doctors sorted by distance, and nearest hospitals.</p>
     *
     * @param request symptom list and optional user location
     * @return analysis result with ranked doctors (and hospitals for emergencies)
     */
    @Operation(
        summary = "Search doctors by symptoms",
        description = "Analyses symptoms, determines specialization, and returns ranked doctor recommendations. "
                + "In emergency cases, also returns nearest hospitals sorted by distance."
    )
    @PostMapping("/search-by-symptoms")
    public ResponseEntity<SymptomSearchResponse> searchBySymptoms(
            @Valid @RequestBody SymptomSearchRequest request) {

        log.info("POST /api/doctors/search-by-symptoms — symptoms: {}, location: ({}, {})",
                request.getSymptoms(),
                request.getLatitude(),
                request.getLongitude());

        // 1. Analyse symptoms
        SymptomAnalysisService.SymptomAnalysis analysis =
                symptomAnalysisService.analyse(request.getSymptoms());

        // 2. Rank doctors
        List<RankedDoctorResponse> rankedDoctors = doctorRankingService.rankDoctors(
                analysis.specialization(),
                analysis.emergency(),
                request.getLatitude(),
                request.getLongitude());

        // 3. Build response
        SymptomSearchResponse.SymptomSearchResponseBuilder builder = SymptomSearchResponse.builder()
                .conditionType(analysis.conditionType())
                .emergency(analysis.emergency())
                .severityScore(analysis.severityScore())
                .confidence((double) Math.round(analysis.confidence() * 100.0))
                .specialization(analysis.specialization())
                .matchedSymptoms(analysis.matchedSymptoms())
                .explanation(analysis.explanation())
                .recommendedDoctors(rankedDoctors);

        // 4. Emergency: add message and nearest hospitals
        if (analysis.emergency()) {
            builder.message("🚨 EMERGENCY DETECTED — Seek immediate medical attention! "
                    + "Call emergency services or visit the nearest hospital.");

            if (request.getLatitude() != null && request.getLongitude() != null) {
                builder.nearestHospitals(
                        doctorRankingService.findNearestHospitals(
                                request.getLatitude(), request.getLongitude()));
            }
        }

        return ResponseEntity.ok(builder.build());
    }
}
