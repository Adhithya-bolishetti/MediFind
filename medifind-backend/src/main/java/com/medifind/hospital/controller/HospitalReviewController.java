package com.medifind.hospital.controller;

import com.medifind.hospital.dto.HospitalReviewRequest;
import com.medifind.hospital.dto.HospitalReviewResponse;
import com.medifind.hospital.service.HospitalReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hospitals")
@RequiredArgsConstructor
public class HospitalReviewController {

    private final HospitalReviewService hospitalReviewService;

    @PostMapping("/{hospitalId}/reviews")
    public ResponseEntity<HospitalReviewResponse> createReview(
            @PathVariable Long hospitalId,
            @Valid @RequestBody HospitalReviewRequest request,
            @RequestAttribute(value = "X-User-Id", required = false) Long patientId) {
        if (patientId == null) patientId = 1L; // Fallback for dev
        return ResponseEntity.ok(hospitalReviewService.createReview(hospitalId, request, patientId));
    }

    @GetMapping("/{hospitalId}/reviews")
    public ResponseEntity<List<HospitalReviewResponse>> getHospitalReviews(@PathVariable Long hospitalId) {
        return ResponseEntity.ok(hospitalReviewService.getHospitalReviews(hospitalId));
    }

    @PutMapping("/{hospitalId}/reviews/{reviewId}")
    public ResponseEntity<HospitalReviewResponse> updateReview(
            @PathVariable Long hospitalId,
            @PathVariable Long reviewId,
            @Valid @RequestBody HospitalReviewRequest request,
            @RequestAttribute(value = "X-User-Id", required = false) Long patientId) {
        if (patientId == null) patientId = 1L;
        return ResponseEntity.ok(hospitalReviewService.updateReview(hospitalId, reviewId, request, patientId));
    }

    @DeleteMapping("/{hospitalId}/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long hospitalId,
            @PathVariable Long reviewId,
            @RequestAttribute(value = "X-User-Id", required = false) Long patientId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "USER") String role) {
        if (patientId == null) patientId = 1L;
        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        hospitalReviewService.deleteReview(hospitalId, reviewId, patientId, isAdmin);
        return ResponseEntity.noContent().build();
    }
}
