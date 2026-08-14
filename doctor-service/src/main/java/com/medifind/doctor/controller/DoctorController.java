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
    private final com.medifind.doctor.service.FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<List<DoctorResponse>> getAllDoctors() {
        return ResponseEntity.ok(doctorService.getAllDoctors());
    }

    @GetMapping("/search")
    public ResponseEntity<List<DoctorResponse>> searchDoctors(
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Long hospitalId,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) Double minimumRating,
            @RequestParam(required = false) Integer experience) {
        return ResponseEntity.ok(doctorService.searchDoctors(specialty, city, hospitalId, available, minimumRating, experience));
    }

    // Day 6: Doctor Onboarding APIs
    @PostMapping("/profile")
    public ResponseEntity<DoctorProfileResponse> createProfile(
            @Valid @RequestBody DoctorProfileRequest request,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if(userId == null) userId = 1L; // Fallback
        return ResponseEntity.ok(doctorService.createDoctorProfile(request, userId));
    }

    @GetMapping("/profile/me")
    public ResponseEntity<DoctorProfileResponse> getMyProfile(
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if(userId == null) userId = 1L;
        return ResponseEntity.ok(doctorService.getDoctorProfileByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorProfileResponse> getDoctorById(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getDoctorProfileByUserId(doctorService.getDoctorById(id).getUserId()));
    }

    @PutMapping("/profile/me")
    public ResponseEntity<DoctorProfileResponse> updateMyProfile(
            @Valid @RequestBody DoctorProfileRequest request,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if(userId == null) userId = 1L;
        return ResponseEntity.ok(doctorService.updateDoctorProfile(request, userId));
    }

    @PostMapping("/profile/license")
    public ResponseEntity<String> uploadLicense(
            @org.springframework.web.bind.annotation.RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if(userId == null) userId = 1L;
        DoctorProfileResponse doc = doctorService.getDoctorProfileByUserId(userId);
        String filePath = fileStorageService.storeFile(file, doc.getId());
        doctorService.updateLicensePath(doc.getId(), filePath);
        return ResponseEntity.ok("License uploaded successfully");
    }

    @GetMapping("/profile/status")
    public ResponseEntity<com.medifind.doctor.entity.VerificationStatus> getProfileStatus(
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if(userId == null) userId = 1L;
        DoctorProfileResponse doc = doctorService.getDoctorProfileByUserId(userId);
        return ResponseEntity.ok(doc.getVerificationStatus());
    }

    @PostMapping("/profile/submit")
    public ResponseEntity<String> submitProfile(
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if(userId == null) userId = 1L;
        DoctorProfileResponse doc = doctorService.getDoctorProfileByUserId(userId);
        doctorService.submitForVerification(doc.getId());
        return ResponseEntity.ok("Profile submitted for verification");
    }

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
