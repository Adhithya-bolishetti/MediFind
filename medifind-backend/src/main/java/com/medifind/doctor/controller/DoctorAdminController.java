package com.medifind.doctor.controller;

import com.medifind.doctor.dto.DoctorProfileResponse;
import com.medifind.doctor.dto.ReviewResponse;
import com.medifind.doctor.entity.Doctor;
import com.medifind.doctor.entity.Review;
import com.medifind.doctor.entity.ReviewStatus;
import com.medifind.doctor.entity.VerificationStatus;
import com.medifind.doctor.repository.DoctorRepository;
import com.medifind.doctor.repository.ReviewRepository;
import com.medifind.doctor.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin-only doctor management + review moderation.
 * All endpoints require ROLE_ADMIN (also enforced by SecurityConfig).
 */
@RestController
@RequestMapping("/api/admin/doctors")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class DoctorAdminController {

    private final DoctorRepository doctorRepository;
    private final ReviewRepository reviewRepository;
    private final DoctorService doctorService;
    private final JdbcTemplate jdbcTemplate;

    /**
     * All doctors regardless of verification status (admin view).
     */
    @GetMapping
    public ResponseEntity<List<DoctorProfileResponse>> getAllDoctors(
            @RequestParam(required = false) String status) {
        List<DoctorProfileResponse> doctors = doctorRepository.findAll().stream()
                .filter(d -> status == null || status.isBlank()
                        || d.getVerificationStatus() != null
                        && d.getVerificationStatus().name().equalsIgnoreCase(status))
                .map(d -> doctorService.getDoctorProfileByUserId(d.getUserId()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(doctors);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<DoctorProfileResponse>> getPendingDoctors() {
        List<DoctorProfileResponse> pending = doctorRepository.findAll().stream()
                .filter(d -> d.getVerificationStatus() == VerificationStatus.PENDING)
                .map(d -> doctorService.getDoctorProfileByUserId(d.getUserId()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(pending);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorProfileResponse> getDoctorById(@PathVariable Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
        return ResponseEntity.ok(doctorService.getDoctorProfileByUserId(doctor.getUserId()));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<DoctorProfileResponse> approveDoctor(@PathVariable Long id) {
        Doctor doctor = findDoctor(id);
        doctor.setVerificationStatus(VerificationStatus.APPROVED);
        doctor.setAvailable(true);
        doctor.setRejectionReason(null);
        doctorRepository.save(doctor);
        return ResponseEntity.ok(doctorService.getDoctorProfileByUserId(doctor.getUserId()));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<DoctorProfileResponse> rejectDoctor(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Doctor doctor = findDoctor(id);
        doctor.setVerificationStatus(VerificationStatus.REJECTED);
        doctor.setAvailable(false);
        doctor.setRejectionReason(payload.get("reason"));
        doctorRepository.save(doctor);
        return ResponseEntity.ok(doctorService.getDoctorProfileByUserId(doctor.getUserId()));
    }

    @PutMapping("/{id}/suspend")
    @Transactional
    public ResponseEntity<DoctorProfileResponse> suspendDoctor(@PathVariable Long id) {
        Doctor doctor = findDoctor(id);
        doctor.setVerificationStatus(VerificationStatus.SUSPENDED);
        doctor.setAvailable(false);
        doctorRepository.save(doctor);
        // Suspend the linked account so the doctor cannot log in.
        syncUserStatus(doctor.getUserId(), "SUSPENDED");
        return ResponseEntity.ok(doctorService.getDoctorProfileByUserId(doctor.getUserId()));
    }

    @PutMapping("/{id}/activate")
    @Transactional
    public ResponseEntity<DoctorProfileResponse> activateDoctor(@PathVariable Long id) {
        Doctor doctor = findDoctor(id);
        doctor.setVerificationStatus(VerificationStatus.APPROVED);
        doctor.setAvailable(true);
        doctor.setRejectionReason(null);
        doctorRepository.save(doctor);
        // Re-enable the linked account so the doctor can log in again.
        syncUserStatus(doctor.getUserId(), "ACTIVE");
        return ResponseEntity.ok(doctorService.getDoctorProfileByUserId(doctor.getUserId()));
    }

    /**
     * Permanently delete a doctor: doctor profile, reviews, and the linked
     * user account. Appointment records for this doctor are handled by the
     * appointment-service (admin delete-by-doctor endpoint).
     */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteDoctor(@PathVariable Long id) {
        Doctor doctor = findDoctor(id);
        Long userId = doctor.getUserId();

        reviewRepository.deleteAll(reviewRepository.findByDoctorId(id));
        doctorRepository.delete(doctor);

        // Remove the linked user account (same medifind_db). Dependent rows
        // referencing the user must be removed first or the FK constraints
        // on `users` (e.g. password_reset_tokens) fail the whole delete.
        if (userId != null) {
            jdbcTemplate.update("DELETE FROM password_reset_tokens WHERE user_id = ?", userId);
            jdbcTemplate.update("DELETE FROM reviews WHERE user_id = ?", userId);
            jdbcTemplate.update("DELETE FROM hospital_reviews WHERE patient_id = ?", userId);
            jdbcTemplate.update("DELETE FROM users WHERE id = ?", userId);
        }
        return ResponseEntity.noContent().build();
    }

    /**
     * Permanently delete a single review (admin moderation) and recalculate
     * the doctor's average rating.
     */
    @DeleteMapping("/reviews/{reviewId}")
    @Transactional
    public ResponseEntity<Void> deleteReview(@PathVariable Long reviewId) {
        com.medifind.doctor.entity.Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));
        Long doctorId = review.getDoctorId();
        reviewRepository.delete(review);
        doctorService.recalculateDoctorRating(doctorId);
        return ResponseEntity.noContent().build();
    }

    private void syncUserStatus(Long userId, String status) {
        if (userId == null) return;
        jdbcTemplate.update("UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?", status, userId);
    }

    // ─────────────── Review Moderation ───────────────

    /**
     * All doctor reviews with their moderation status.
     */
    @GetMapping("/reviews")
    public ResponseEntity<List<ReviewResponse>> getAllReviews(
            @RequestParam(required = false) String status) {
        List<ReviewResponse> reviews = reviewRepository.findAll().stream()
                .filter(r -> status == null || status.isBlank()
                        || r.getStatus() != null && r.getStatus().name().equalsIgnoreCase(status))
                .map(doctorService::mapToReviewResponsePublic)
                .collect(Collectors.toList());
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/reviews/pending")
    public ResponseEntity<List<Review>> getPendingReviews() {
        return ResponseEntity.ok(reviewRepository.findAll().stream()
                .filter(r -> r.getStatus() == ReviewStatus.PENDING)
                .collect(Collectors.toList()));
    }

    @PutMapping("/reviews/{reviewId}/status")
    public ResponseEntity<ReviewResponse> updateReviewStatus(
            @PathVariable Long reviewId,
            @RequestBody Map<String, String> payload) {
        String statusStr = payload.get("status");
        if (statusStr == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing status");
        }
        ReviewStatus status = ReviewStatus.valueOf(statusStr.toUpperCase());
        return ResponseEntity.ok(doctorService.updateReviewStatus(reviewId, status));
    }

    private Doctor findDoctor(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
    }
}
