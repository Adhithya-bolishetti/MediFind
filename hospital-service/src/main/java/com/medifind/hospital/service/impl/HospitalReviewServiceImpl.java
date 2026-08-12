package com.medifind.hospital.service.impl;

import com.medifind.hospital.client.AppointmentClient;
import com.medifind.hospital.client.DoctorClient;
import com.medifind.hospital.dto.HospitalReviewRequest;
import com.medifind.hospital.dto.HospitalReviewResponse;
import com.medifind.hospital.entity.Hospital;
import com.medifind.hospital.entity.HospitalReview;
import com.medifind.hospital.entity.ReviewStatus;
import com.medifind.hospital.repository.HospitalRepository;
import com.medifind.hospital.repository.HospitalReviewRepository;
import com.medifind.hospital.service.HospitalReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HospitalReviewServiceImpl implements HospitalReviewService {

    private final HospitalReviewRepository reviewRepository;
    private final HospitalRepository hospitalRepository;
    private final AppointmentClient appointmentClient;
    private final DoctorClient doctorClient;

    @Override
    public HospitalReviewResponse createReview(Long hospitalId, HospitalReviewRequest request, Long patientId) {
        Hospital hospital = getHospital(hospitalId);

        if (reviewRepository.existsByAppointmentId(request.getAppointmentId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A hospital review already exists for this appointment");
        }

        try {
            Map<String, Object> appointment = appointmentClient.getAppointmentById(request.getAppointmentId());
            if (appointment == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found");
            }
            
            Number appUserId = (Number) appointment.get("userId");
            Number appDoctorId = (Number) appointment.get("doctorId");
            String status = (String) appointment.get("status");
            
            if (appUserId == null || appUserId.longValue() != patientId) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Appointment does not belong to you");
            }
            if (!"COMPLETED".equals(status)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review not allowed. You must have a completed appointment.");
            }
            
            // Check if doctor belongs to the hospital
            Map<String, Object> doctor = doctorClient.getDoctorById(appDoctorId.longValue());
            if (doctor == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found");
            }
            Number docHospitalId = (Number) doctor.get("hospitalId");
            if (docHospitalId == null || docHospitalId.longValue() != hospitalId) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The doctor from this appointment is not associated with this hospital");
            }
        } catch (feign.FeignException e) {
            if (e.status() == 404) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment or Doctor not found");
            }
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Could not verify appointment details");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Could not verify appointment details");
        }

        HospitalReview review = HospitalReview.builder()
                .hospitalId(hospitalId)
                .patientId(patientId)
                .appointmentId(request.getAppointmentId())
                .rating(request.getRating())
                .reviewText(request.getReviewText())
                .status(ReviewStatus.APPROVED) // Auto-approve for now
                .build();

        review = reviewRepository.save(review);
        updateHospitalRating(hospital);

        return mapToResponse(review);
    }

    @Override
    public List<HospitalReviewResponse> getHospitalReviews(Long hospitalId) {
        return reviewRepository.findByHospitalId(hospitalId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public HospitalReviewResponse updateReview(Long hospitalId, Long reviewId, HospitalReviewRequest request, Long patientId) {
        HospitalReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        if (!review.getHospitalId().equals(hospitalId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review does not belong to this hospital");
        }
        if (!review.getPatientId().equals(patientId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own review");
        }

        review.setRating(request.getRating());
        review.setReviewText(request.getReviewText());
        review = reviewRepository.save(review);
        
        updateHospitalRating(getHospital(hospitalId));
        return mapToResponse(review);
    }

    @Override
    public void deleteReview(Long hospitalId, Long reviewId, Long patientId, boolean isAdmin) {
        HospitalReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        if (!review.getHospitalId().equals(hospitalId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review does not belong to this hospital");
        }
        if (!isAdmin && !review.getPatientId().equals(patientId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own review");
        }

        reviewRepository.delete(review);
        updateHospitalRating(getHospital(hospitalId));
    }

    private void updateHospitalRating(Hospital hospital) {
        List<HospitalReview> reviews = reviewRepository.findByHospitalId(hospital.getId())
                .stream()
                .filter(r -> r.getStatus() == ReviewStatus.APPROVED)
                .collect(Collectors.toList());
                
        int total = reviews.size();
        int r5 = 0, r4 = 0, r3 = 0, r2 = 0, r1 = 0;
        
        for (HospitalReview r : reviews) {
            if (r.getRating() == 5) r5++;
            else if (r.getRating() == 4) r4++;
            else if (r.getRating() == 3) r3++;
            else if (r.getRating() == 2) r2++;
            else if (r.getRating() == 1) r1++;
        }
        
        double avg = total == 0 ? 0.0 : reviews.stream().mapToInt(HospitalReview::getRating).average().orElse(0.0);
        
        hospital.setTotalReviews(total);
        hospital.setRating5(r5);
        hospital.setRating4(r4);
        hospital.setRating3(r3);
        hospital.setRating2(r2);
        hospital.setRating1(r1);
        hospital.setRating(Math.round(avg * 10.0) / 10.0);
        hospitalRepository.save(hospital);
    }

    private HospitalReviewResponse mapToResponse(HospitalReview review) {
        return HospitalReviewResponse.builder()
                .id(review.getId())
                .hospitalId(review.getHospitalId())
                .patientId(review.getPatientId())
                .appointmentId(review.getAppointmentId())
                .rating(review.getRating())
                .reviewText(review.getReviewText())
                .status(review.getStatus() != null ? review.getStatus().name() : null)
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    private Hospital getHospital(Long hospitalId) {
        return hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hospital not found"));
    }
}
