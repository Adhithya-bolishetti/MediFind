package com.medifind.doctor.controller;

import com.medifind.doctor.dto.*;
import com.medifind.doctor.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    // Day 3: Availability
    @GetMapping("/{doctorId}/availability")
    public ResponseEntity<DoctorAvailabilityResponse> getDoctorAvailability(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorService.getDoctorAvailability(doctorId));
    }

    @GetMapping("/{doctorId}/available-slots")
    public ResponseEntity<AvailableSlotResponse> getAvailableSlots(@PathVariable Long doctorId, @RequestParam String date) {
        return ResponseEntity.ok(doctorService.getAvailableSlots(doctorId, date));
    }

    // Day 3: Reviews
    @PostMapping("/{doctorId}/reviews")
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable Long doctorId,
            @Valid @RequestBody ReviewRequest request,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) userId = 1L; // Fallback for testing if missing
        return ResponseEntity.ok(doctorService.createReview(doctorId, request, userId));
    }

    @GetMapping("/{doctorId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getDoctorReviews(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorService.getDoctorReviews(doctorId));
    }

    @PutMapping("/{doctorId}/reviews/{reviewId}")
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable Long doctorId,
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewRequest request,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) userId = 1L;
        return ResponseEntity.ok(doctorService.updateReview(doctorId, reviewId, request, userId));
    }

    @DeleteMapping("/{doctorId}/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long doctorId,
            @PathVariable Long reviewId,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "USER") String role) { // we could also extract role from SecurityContext
        if (userId == null) userId = 1L;
        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        doctorService.deleteReview(doctorId, reviewId, userId, isAdmin);
        return ResponseEntity.noContent().build();
    }

    // Day 3: Recommendations
    @GetMapping("/recommendations")
    public ResponseEntity<List<DoctorRecommendationResponse>> getRecommendations(
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double minimumRating,
            @RequestParam(required = false) Integer minimumExperience,
            @RequestParam(required = false) Boolean available) {
        return ResponseEntity.ok(doctorService.getRecommendations(specialization, city, minimumRating, minimumExperience, available));
    }
}
