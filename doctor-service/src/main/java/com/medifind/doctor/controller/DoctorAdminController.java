package com.medifind.doctor.controller;

import com.medifind.doctor.dto.DoctorProfileResponse;
import com.medifind.doctor.entity.Doctor;
import com.medifind.doctor.entity.VerificationStatus;
import com.medifind.doctor.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/doctors")
@RequiredArgsConstructor
public class DoctorAdminController {

    private final DoctorRepository doctorRepository;
    private final com.medifind.doctor.service.DoctorService doctorService;

    @GetMapping("/pending")
    public ResponseEntity<List<DoctorProfileResponse>> getPendingDoctors() {
        List<DoctorProfileResponse> pending = doctorRepository.findAll().stream()
                .filter(d -> d.getVerificationStatus() == VerificationStatus.PENDING)
                .map(d -> doctorService.getDoctorProfileByUserId(d.getUserId())) // Reuse the mapping
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
    public ResponseEntity<Void> approveDoctor(@PathVariable Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
        doctor.setVerificationStatus(VerificationStatus.APPROVED);
        doctor.setAvailable(true);
        doctor.setRejectionReason(null);
        doctorRepository.save(doctor);
        // Trigger notification...
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Void> rejectDoctor(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
        doctor.setVerificationStatus(VerificationStatus.REJECTED);
        doctor.setAvailable(false);
        doctor.setRejectionReason(payload.get("reason"));
        doctorRepository.save(doctor);
        // Trigger notification...
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/suspend")
    public ResponseEntity<Void> suspendDoctor(@PathVariable Long id) {
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
        doctor.setVerificationStatus(VerificationStatus.SUSPENDED);
        doctor.setAvailable(false);
        doctorRepository.save(doctor);
        return ResponseEntity.ok().build();
    }

    // Review Moderation
    @GetMapping("/reviews/pending")
    public ResponseEntity<List<com.medifind.doctor.entity.Review>> getPendingReviews(
            @org.springframework.beans.factory.annotation.Autowired com.medifind.doctor.repository.ReviewRepository reviewRepo) {
        return ResponseEntity.ok(reviewRepo.findAll().stream()
                .filter(r -> r.getStatus() == com.medifind.doctor.entity.ReviewStatus.PENDING)
                .collect(Collectors.toList()));
    }

    @PutMapping("/reviews/{reviewId}/status")
    public ResponseEntity<Void> updateReviewStatus(
            @PathVariable Long reviewId,
            @RequestBody Map<String, String> payload,
            @org.springframework.beans.factory.annotation.Autowired com.medifind.doctor.repository.ReviewRepository reviewRepo,
            @org.springframework.beans.factory.annotation.Autowired com.medifind.doctor.service.DoctorService docService) {
        
        com.medifind.doctor.entity.Review review = reviewRepo.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));
        
        String statusStr = payload.get("status");
        if (statusStr == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing status");
        }
        
        com.medifind.doctor.entity.ReviewStatus status = com.medifind.doctor.entity.ReviewStatus.valueOf(statusStr.toUpperCase());
        review.setStatus(status);
        reviewRepo.save(review);
        
        // Let DoctorServiceImpl recalculate rating
        // Need to add recalculate method to DoctorService or trigger via update
        return ResponseEntity.ok().build();
    }
}
