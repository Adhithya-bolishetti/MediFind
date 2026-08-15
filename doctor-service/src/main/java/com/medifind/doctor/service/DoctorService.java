package com.medifind.doctor.service;

import com.medifind.doctor.dto.DoctorRequest;
import com.medifind.doctor.dto.DoctorResponse;

import java.util.List;

/**
 * Business service contract for Doctor operations.
 */
public interface DoctorService {

    /**
     * Create a new doctor record.
     */
    DoctorResponse createDoctor(DoctorRequest request);

    /**
     * Retrieve all doctor records with enriched hospital info.
     */
    List<DoctorResponse> getAllDoctors();

    /**
     * Retrieve a single doctor by their ID.
     */
    DoctorResponse getDoctorById(Long id);

    /**
     * Update an existing doctor record.
     */
    DoctorResponse updateDoctor(Long id, DoctorRequest request);

    /**
     * Permanently delete a doctor record.
     */
    void deleteDoctor(Long id);

    /**
     * Dynamic search across doctor records using optional filter parameters.
     *
     * @param query          free-text match across name, specialization, qualification, city, state, clinic/hospital
     * @param specialization filter by specialization (partial match, case-insensitive)
     * @param city           filter by city (partial match, case-insensitive)
     * @param hospitalId     filter by exact hospital ID
     * @param available      filter by availability flag
     * @param minimumRating  filter doctors with rating >= this value
     * @param experience     filter doctors with experience >= this value (years)
     * @return list of matching doctor response DTOs
     */
    List<DoctorResponse> searchDoctors(String query, String specialization, String city, Long hospitalId,
                                       Boolean available, Double minimumRating, Integer experience);

    // Day 3
    com.medifind.doctor.dto.DoctorAvailabilityResponse getDoctorAvailability(Long doctorId);
    com.medifind.doctor.dto.AvailableSlotResponse getAvailableSlots(Long doctorId, String date);
    
    com.medifind.doctor.dto.ReviewResponse createReview(Long doctorId, com.medifind.doctor.dto.ReviewRequest request, Long userId);
    List<com.medifind.doctor.dto.ReviewResponse> getDoctorReviews(Long doctorId);
    com.medifind.doctor.dto.ReviewResponse updateReview(Long doctorId, Long reviewId, com.medifind.doctor.dto.ReviewRequest request, Long userId);
    void deleteReview(Long doctorId, Long reviewId, Long userId, boolean isAdmin);
    
    List<com.medifind.doctor.dto.DoctorRecommendationResponse> getRecommendations(String specialization, String city, Double minimumRating, Integer minimumExperience, Boolean available);

    // Day 6: Onboarding
    com.medifind.doctor.dto.DoctorProfileResponse createDoctorProfile(com.medifind.doctor.dto.DoctorProfileRequest request, Long userId);
    com.medifind.doctor.dto.DoctorProfileResponse getDoctorProfileByUserId(Long userId);
    com.medifind.doctor.dto.DoctorProfileResponse updateDoctorProfile(com.medifind.doctor.dto.DoctorProfileRequest request, Long userId);
    void updateLicensePath(Long doctorId, String filePath);
    void submitForVerification(Long doctorId);
}
