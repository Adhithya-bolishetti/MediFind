package com.medifind.hospital.service;

import com.medifind.hospital.dto.HospitalReviewRequest;
import com.medifind.hospital.dto.HospitalReviewResponse;

import java.util.List;

public interface HospitalReviewService {
    HospitalReviewResponse createReview(Long hospitalId, HospitalReviewRequest request, Long patientId);
    List<HospitalReviewResponse> getHospitalReviews(Long hospitalId);
    HospitalReviewResponse updateReview(Long hospitalId, Long reviewId, HospitalReviewRequest request, Long patientId);
    void deleteReview(Long hospitalId, Long reviewId, Long patientId, boolean isAdmin);
    HospitalReviewResponse updateReviewStatus(Long reviewId, com.medifind.hospital.entity.ReviewStatus status);
}
