package com.medifind.doctor.controller;

import com.medifind.doctor.dto.EmergencyCheckRequest;
import com.medifind.doctor.dto.EmergencyCheckResponse;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/emergency")
public class EmergencyController {

    private final List<String> emergencyKeywords = Arrays.asList(
            "chest pain", "breathing difficulty", "heart", "stroke", "bleeding", "unconscious"
    );

    @Operation(summary = "Check if symptoms constitute an emergency")
    @PostMapping("/check")
    public ResponseEntity<EmergencyCheckResponse> checkEmergency(@RequestBody EmergencyCheckRequest request) {
        boolean isEmergency = false;

        if (request.getSymptoms() != null) {
            for (String symptom : request.getSymptoms()) {
                String lowerSymptom = symptom.toLowerCase();
                for (String keyword : emergencyKeywords) {
                    if (lowerSymptom.contains(keyword)) {
                        isEmergency = true;
                        break;
                    }
                }
                if (isEmergency) break;
            }
        }

        if (isEmergency) {
            return ResponseEntity.ok(EmergencyCheckResponse.builder()
                    .emergency(true)
                    .message("Please seek emergency medical attention immediately.")
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
