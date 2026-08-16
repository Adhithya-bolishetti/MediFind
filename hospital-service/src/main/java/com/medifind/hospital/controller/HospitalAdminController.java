package com.medifind.hospital.controller;

import com.medifind.hospital.dto.HospitalResponse;
import com.medifind.hospital.entity.HospitalReview;
import com.medifind.hospital.entity.HospitalStatus;
import com.medifind.hospital.entity.ReviewStatus;
import com.medifind.hospital.repository.HospitalReviewRepository;
import com.medifind.hospital.service.HospitalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/hospitals")
@RequiredArgsConstructor
public class HospitalAdminController {

    private final HospitalReviewRepository reviewRepo;
    private final com.medifind.hospital.service.HospitalReviewService reviewService;
    private final HospitalService hospitalService;

    /**
     * List every hospital (all statuses) for admin management.
     */
    @GetMapping
    public ResponseEntity<List<HospitalResponse>> getAllHospitals() {
        return ResponseEntity.ok(hospitalService.getAllHospitalsAdmin());
    }

    /**
     * Change a hospital's lifecycle status (APPROVED / ACTIVE / SUSPENDED / REJECTED / PENDING).
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<HospitalResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String statusStr = payload.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        }
        HospitalStatus status;
        try {
            status = HospitalStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + statusStr);
        }
        return ResponseEntity.ok(hospitalService.updateStatus(id, status));
    }

    // Review Moderation
    @GetMapping("/reviews/pending")
    public ResponseEntity<List<HospitalReview>> getPendingReviews() {
        return ResponseEntity.ok(reviewRepo.findAll().stream()
                .filter(r -> r.getStatus() == ReviewStatus.PENDING)
                .collect(Collectors.toList()));
    }

    @PutMapping("/reviews/{reviewId}/status")
    public ResponseEntity<com.medifind.hospital.dto.HospitalReviewResponse> updateReviewStatus(
            @PathVariable Long reviewId,
            @RequestBody Map<String, String> payload) {
        
        String statusStr = payload.get("status");
        if (statusStr == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing status");
        }
        
        ReviewStatus status = ReviewStatus.valueOf(statusStr.toUpperCase());
        return ResponseEntity.ok(reviewService.updateReviewStatus(reviewId, status));
    }
}
