package com.medifind.doctor.controller;

import com.medifind.doctor.dto.EmergencyCheckRequest;
import com.medifind.doctor.dto.EmergencyCheckResponse;
import com.medifind.doctor.service.SymptomAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Emergency check endpoint — now delegates to {@link SymptomAnalysisService}
 * for consistent, severity-based emergency detection across the application.
 */
@RestController
@RequestMapping("/api/emergency")
@RequiredArgsConstructor
public class EmergencyController {

    private final SymptomAnalysisService symptomAnalysisService;

    @Operation(summary = "Check if symptoms constitute an emergency")
    @PostMapping("/check")
    public ResponseEntity<EmergencyCheckResponse> checkEmergency(@RequestBody EmergencyCheckRequest request) {
        SymptomAnalysisService.SymptomAnalysis analysis =
                symptomAnalysisService.analyse(request.getSymptoms());

        if (analysis.emergency()) {
            return ResponseEntity.ok(EmergencyCheckResponse.builder()
                    .emergency(true)
                    .message("Please seek emergency medical attention immediately. Severity: "
                            + analysis.severityScore() + "/100.")
                    .recommendedAction("NEAREST_HOSPITAL")
                    .build());
        } else {
            return ResponseEntity.ok(EmergencyCheckResponse.builder()
                    .emergency(false)
                    .message("You can consult a suitable doctor.")
                    .recommendedAction("DOCTOR_RECOMMENDATION")
                    .build());
        }
    }
}
