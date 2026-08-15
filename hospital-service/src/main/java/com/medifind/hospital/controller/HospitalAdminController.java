package com.medifind.hospital.controller;

import com.medifind.hospital.entity.HospitalReview;
import com.medifind.hospital.entity.ReviewStatus;
import com.medifind.hospital.repository.HospitalReviewRepository;
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
