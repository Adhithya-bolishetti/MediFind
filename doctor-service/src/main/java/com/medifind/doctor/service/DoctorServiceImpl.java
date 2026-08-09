package com.medifind.doctor.service;

import com.medifind.doctor.client.AppointmentClient;
import com.medifind.doctor.client.HospitalClient;
import com.medifind.doctor.dto.*;
import com.medifind.doctor.entity.Doctor;
import com.medifind.doctor.entity.Review;
import com.medifind.doctor.repository.DoctorRepository;
import com.medifind.doctor.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final ReviewRepository reviewRepository;
    private final AppointmentClient appointmentClient;
    private final HospitalClient hospitalClient;

    @Override
    public DoctorResponse createDoctor(DoctorRequest request) { return null; }

    @Override
    public List<DoctorResponse> getAllDoctors() { return List.of(); }

    @Override
    public DoctorResponse getDoctorById(Long id) { return null; }

    @Override
    public DoctorResponse updateDoctor(Long id, DoctorRequest request) { return null; }

    @Override
    public void deleteDoctor(Long id) { }

    @Override
    public List<DoctorResponse> searchDoctors(String specialization, String city, Long hospitalId, Boolean available, Double minimumRating, Integer experience) {
        return List.of();
    }

    @Override
    public DoctorAvailabilityResponse getDoctorAvailability(Long doctorId) {
        Doctor doctor = getDoctor(doctorId);
        return DoctorAvailabilityResponse.builder()
                .doctorId(doctor.getId())
                .available(doctor.isAvailable())
                .workingDays(doctor.getWorkingDays())
                .consultationStartTime(doctor.getConsultationStartTime())
                .consultationEndTime(doctor.getConsultationEndTime())
                .appointmentDuration(doctor.getAppointmentDuration())
                .build();
    }

    @Override
    public AvailableSlotResponse getAvailableSlots(Long doctorId, String date) {
        Doctor doctor = getDoctor(doctorId);
        if (!doctor.isAvailable() || doctor.getConsultationStartTime() == null) {
            return AvailableSlotResponse.builder().doctorId(doctorId).date(date).slots(List.of()).build();
        }

        LocalTime startTime = LocalTime.parse(doctor.getConsultationStartTime());
        LocalTime endTime = LocalTime.parse(doctor.getConsultationEndTime());
        int duration = doctor.getAppointmentDuration() != null ? doctor.getAppointmentDuration() : 30;

        List<String> allSlots = new ArrayList<>();
        while (startTime.plusMinutes(duration).isBefore(endTime) || startTime.plusMinutes(duration).equals(endTime)) {
            allSlots.add(startTime.format(DateTimeFormatter.ofPattern("HH:mm")));
            startTime = startTime.plusMinutes(duration);
        }

        List<String> bookedSlots = new ArrayList<>();
        try {
            bookedSlots = appointmentClient.getBookedSlots(doctorId, date);
        } catch (Exception e) {
            // Ignore if service is down, we'll assume no slots are booked (or we could fail)
        }

        allSlots.removeAll(bookedSlots);

        return AvailableSlotResponse.builder()
                .doctorId(doctorId)
                .date(date)
                .slots(allSlots)
                .build();
    }

    @Override
    public ReviewResponse createReview(Long doctorId, ReviewRequest request, Long userId) {
        Doctor doctor = getDoctor(doctorId);

        if (reviewRepository.existsByDoctorIdAndUserId(doctorId, userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User has already reviewed this doctor");
        }

        boolean hasCompleted = false;
        try {
            hasCompleted = appointmentClient.hasCompletedAppointment(doctorId, userId);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Could not verify completed appointments");
        }

        if (!hasCompleted) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Review not allowed. You must have a completed appointment.");
        }

        Review review = Review.builder()
                .doctorId(doctorId)
                .userId(userId)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        review = reviewRepository.save(review);
        updateDoctorRating(doctor);

        return mapToReviewResponse(review);
    }

    @Override
    public List<ReviewResponse> getDoctorReviews(Long doctorId) {
        return reviewRepository.findByDoctorId(doctorId).stream()
                .map(this::mapToReviewResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ReviewResponse updateReview(Long doctorId, Long reviewId, ReviewRequest request, Long userId) {
        Review review = reviewRepository.findByIdAndDoctorId(reviewId, doctorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        if (!review.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own review");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review = reviewRepository.save(review);
        
        Doctor doctor = getDoctor(doctorId);
        updateDoctorRating(doctor);
        
        return mapToReviewResponse(review);
    }

    @Override
    public void deleteReview(Long doctorId, Long reviewId, Long userId, boolean isAdmin) {
        Review review = reviewRepository.findByIdAndDoctorId(reviewId, doctorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        if (!isAdmin && !review.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own review");
        }

        reviewRepository.delete(review);
        Doctor doctor = getDoctor(doctorId);
        updateDoctorRating(doctor);
    }

    @Override
    public List<DoctorRecommendationResponse> getRecommendations(String specialization, String city, Double minimumRating, Integer minimumExperience, Boolean available) {
        List<Doctor> allDoctors = doctorRepository.findAll();
        
        return allDoctors.stream()
                .filter(d -> specialization == null || (d.getSpecialization() != null && d.getSpecialization().equalsIgnoreCase(specialization)))
                .filter(d -> minimumRating == null || d.getRating() >= minimumRating)
                .filter(d -> minimumExperience == null || d.getExperience() >= minimumExperience)
                .filter(d -> available == null || d.isAvailable() == available)
                .map(d -> {
                    double locationScore = (city != null && d.getCity().equalsIgnoreCase(city)) ? 10.0 : 0.0;
                    double ratingScore = (d.getRating() / 5.0) * 50.0;
                    double expScore = Math.min(d.getExperience() / 20.0, 1.0) * 20.0;
                    double availabilityScore = d.isAvailable() ? 20.0 : 0.0;
                    
                    double finalScore = ratingScore + expScore + availabilityScore + locationScore;
                    
                    String hospitalName = "Unknown";
                    if (d.getHospitalId() != null) {
                        try {
                            HospitalResponse h = hospitalClient.getHospitalById(d.getHospitalId());
                            if (h != null) hospitalName = h.getHospitalName();
                        } catch (Exception ignored) {}
                    }
                    
                    return DoctorRecommendationResponse.builder()
                            .doctorId(d.getId())
                            .doctorName(d.getDoctorName())
                            .specialization(d.getSpecialization())
                            .experience(d.getExperience())
                            .rating(d.getRating())
                            .hospital(hospitalName)
                            .city(d.getCity())
                            .available(d.isAvailable())
                            .recommendationScore(Math.round(finalScore * 100.0) / 100.0)
                            .build();
                })
                .sorted((d1, d2) -> Double.compare(d2.getRecommendationScore(), d1.getRecommendationScore()))
                .collect(Collectors.toList());
    }

    private Doctor getDoctor(Long doctorId) {
        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
    }

    private void updateDoctorRating(Doctor doctor) {
        List<Review> reviews = reviewRepository.findByDoctorId(doctor.getId());
        double avg = reviews.isEmpty() ? 0.0 : reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        doctor.setRating(Math.round(avg * 100.0) / 100.0);
        doctorRepository.save(doctor);
    }
    
    private ReviewResponse mapToReviewResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .doctorId(review.getDoctorId())
                .userId(review.getUserId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
