package com.medifind.doctor.service;

import com.medifind.doctor.client.AppointmentClient;
import com.medifind.doctor.client.HospitalClient;
import com.medifind.doctor.client.UserClient;
import com.medifind.doctor.dto.*;
import com.medifind.doctor.entity.Doctor;
import com.medifind.doctor.entity.Review;
import com.medifind.doctor.repository.DoctorRepository;
import com.medifind.doctor.repository.ReviewRepository;
import com.medifind.doctor.util.AvailabilityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
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
    private final UserClient userClient;

    @Override
    public DoctorResponse createDoctor(DoctorRequest request) { return null; }

    /**
     * Only APPROVED doctors are exposed publicly (Find Doctors, search, etc.).
     */
    private boolean isPubliclyVisible(Doctor d) {
        return d.getVerificationStatus() == com.medifind.doctor.entity.VerificationStatus.APPROVED;
    }

    @Override
    public List<DoctorResponse> getAllDoctors() {
        return doctorRepository.findAll().stream()
                .filter(this::isPubliclyVisible)
                .map(this::mapToDoctorResponse)
                .collect(Collectors.toList());
    }

    @Override
    public DoctorResponse getDoctorById(Long id) {
        Doctor d = getDoctor(id);
        if (!isPubliclyVisible(d)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found");
        }
        return mapToDoctorResponse(d);
    }

    @Override
    public DoctorResponse updateDoctor(Long id, DoctorRequest request) { return null; }

    @Override
    public void deleteDoctor(Long id) { }

    @Override
    public List<DoctorResponse> searchDoctors(String query, String specialization, String city, Long hospitalId, Boolean available, Double minimumRating, Integer experience) {
        return doctorRepository.findAll().stream()
                .filter(this::isPubliclyVisible)
                .filter(d -> query == null || query.trim().isEmpty() || matchesQuery(d, query))
                .filter(d -> specialization == null || (d.getSpecialization() != null && d.getSpecialization().name().toLowerCase().contains(specialization.toLowerCase())))
                .filter(d -> city == null || (d.getCity() != null && d.getCity().toLowerCase().contains(city.toLowerCase())))
                .filter(d -> hospitalId == null || (d.getHospitalId() != null && d.getHospitalId().equals(hospitalId)))
                .filter(d -> available == null || d.isAvailable() == available)
                .filter(d -> minimumRating == null || d.getRating() >= minimumRating)
                .filter(d -> experience == null || d.getExperience() >= experience)
                .map(this::mapToDoctorResponse)
                .collect(Collectors.toList());
    }

    /**
     * Case-insensitive free-text match across the searchable doctor fields.
     */
    private boolean matchesQuery(Doctor d, String query) {
        String q = query.trim().toLowerCase(java.util.Locale.ENGLISH);
        if (q.isEmpty()) {
            return true;
        }
        String specialization = d.getSpecialization() != null ? d.getSpecialization().name() : null;
        java.util.List<String> haystacks = new ArrayList<>();
        haystacks.add(d.getDoctorName());
        haystacks.add(d.getSubSpecialization());
        haystacks.add(d.getQualification());
        haystacks.add(d.getCity());
        haystacks.add(d.getState());
        haystacks.add(d.getClinicName());
        haystacks.add(d.getClinicAddress());
        haystacks.add(specialization);
        if (specialization != null) {
            haystacks.add(specialization.replace("_", " "));
        }
        for (String field : haystacks) {
            if (field != null && field.toLowerCase(java.util.Locale.ENGLISH).contains(q)) {
                return true;
            }
        }
        return false;
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
        LocalDate requestedDate;
        try {
            requestedDate = LocalDate.parse(date);
        } catch (Exception e) {
            return AvailableSlotResponse.builder().doctorId(doctorId).date(date).slots(List.of()).build();
        }

        if (!doctor.isAvailable()) {
            return AvailableSlotResponse.builder().doctorId(doctorId).date(date).slots(List.of()).build();
        }

        // Respect configured working days — no slots on off days. Handles full
        // names, abbreviations and legacy ranges like "Mon-Sat".
        if (!AvailabilityUtils.isWorkingDay(doctor.getWorkingDays(), requestedDate.getDayOfWeek())) {
            return AvailableSlotResponse.builder().doctorId(doctorId).date(date).slots(List.of()).build();
        }

        // Times may be 24h or 12h (e.g. "05:00 PM" must mean 5 PM, not 5 AM).
        LocalTime[] hours = AvailabilityUtils.resolveConsultationHours(
                doctor.getConsultationStartTime(), doctor.getConsultationEndTime());
        LocalTime startTime = hours[0];
        LocalTime endTime = hours[1];
        if (startTime == null || endTime == null || !startTime.isBefore(endTime)) {
            return AvailableSlotResponse.builder().doctorId(doctorId).date(date).slots(List.of()).build();
        }
        int duration = doctor.getAppointmentDuration() != null && doctor.getAppointmentDuration() > 0
                ? doctor.getAppointmentDuration() : 30;

        List<String> allSlots = new ArrayList<>();
        LocalTime slot = startTime;
        while (slot.plusMinutes(duration).isBefore(endTime) || slot.plusMinutes(duration).equals(endTime)) {
            allSlots.add(slot.format(DateTimeFormatter.ofPattern("HH:mm")));
            slot = slot.plusMinutes(duration);
        }

        // Never offer time slots that are already in the past for today.
        if (requestedDate.equals(LocalDate.now())) {
            LocalTime now = LocalTime.now();
            allSlots.removeIf(s -> LocalTime.parse(s).isBefore(now));
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

        if (reviewRepository.existsByAppointmentId(request.getAppointmentId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A review already exists for this appointment");
        }

        // Validate the appointment via the appointment service. Network failures
        // must surface as a friendly error, but validation failures (404/403/400)
        // are thrown AFTER the try-catch so they are not converted to 503.
        java.util.Map<String, Object> appointment;
        try {
            appointment = appointmentClient.getAppointmentById(request.getAppointmentId());
        } catch (feign.FeignException e) {
            if (e.status() == 404) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found");
            }
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Could not verify appointment details");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Could not verify appointment details");
        }
        if (appointment == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found");
        }

        // Validate appointment belongs to this patient and doctor
        Number appUserId = (Number) appointment.get("userId");
        Number appDoctorId = (Number) appointment.get("doctorId");
        String status = (String) appointment.get("status");

        if (appUserId == null || appUserId.longValue() != userId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Appointment does not belong to you");
        }
        if (appDoctorId == null || appDoctorId.longValue() != doctorId) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Appointment does not match this doctor");
        }
        if (!"COMPLETED".equals(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review not allowed. You must have a completed appointment.");
        }

        Review review = Review.builder()
                .doctorId(doctorId)
                .userId(userId)
                .appointmentId(request.getAppointmentId())
                .rating(request.getRating())
                .comment(request.getComment())
                .recommendation(request.getRecommendation())
                .status(com.medifind.doctor.entity.ReviewStatus.APPROVED) // Auto-approve for now
                .build();

        review = reviewRepository.save(review);
        updateDoctorRating(doctor);

        return mapToReviewResponse(review);
    }

    @Override
    public List<ReviewResponse> getDoctorReviews(Long doctorId) {
        // Only approved (publicly visible) reviews are shown to patients.
        return reviewRepository.findByDoctorId(doctorId).stream()
                .filter(r -> r.getStatus() == com.medifind.doctor.entity.ReviewStatus.APPROVED)
                .map(this::mapToReviewResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ReviewResponse updateReviewStatus(Long reviewId, com.medifind.doctor.entity.ReviewStatus status) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));
        review.setStatus(status);
        review = reviewRepository.save(review);
        // Hiding/restoring a review changes the public average rating.
        Doctor doctor = getDoctor(review.getDoctorId());
        updateDoctorRating(doctor);
        return mapToReviewResponse(review);
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
        review.setRecommendation(request.getRecommendation());
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
                .filter(this::isPubliclyVisible)
                .filter(d -> specialization == null || (d.getSpecialization() != null && d.getSpecialization().name().equalsIgnoreCase(specialization)))
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
                            .specialization(d.getSpecialization() != null ? d.getSpecialization().name() : null)
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
        List<Review> reviews = reviewRepository.findByDoctorId(doctor.getId())
                .stream()
                .filter(r -> r.getStatus() == com.medifind.doctor.entity.ReviewStatus.APPROVED)
                .collect(Collectors.toList());
                
        int total = reviews.size();
        int r5 = 0, r4 = 0, r3 = 0, r2 = 0, r1 = 0;
        
        for (Review r : reviews) {
            if (r.getRating() == 5) r5++;
            else if (r.getRating() == 4) r4++;
            else if (r.getRating() == 3) r3++;
            else if (r.getRating() == 2) r2++;
            else if (r.getRating() == 1) r1++;
        }
        
        double avg = total == 0 ? 0.0 : reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        
        doctor.setTotalReviews(total);
        doctor.setRating5(r5);
        doctor.setRating4(r4);
        doctor.setRating3(r3);
        doctor.setRating2(r2);
        doctor.setRating1(r1);
        doctor.setRating(Math.round(avg * 10.0) / 10.0);
        doctorRepository.save(doctor);
    }
    
    @Override
    public void recalculateDoctorRating(Long doctorId) {
        updateDoctorRating(getDoctor(doctorId));
    }

    @Override
    public ReviewResponse mapToReviewResponsePublic(Review review) {
        return mapToReviewResponse(review);
    }

    private ReviewResponse mapToReviewResponse(Review review) {
        String patientName = null;
        try {
            UserResponse user = userClient.getUserById(review.getUserId());
            if (user != null) patientName = user.getFullName();
        } catch (Exception e) {
            // Patient lookup is best-effort; fall back to showing the id on the frontend.
        }

        String doctorName = null;
        try {
            Doctor d = getDoctor(review.getDoctorId());
            doctorName = d.getDoctorName();
        } catch (Exception e) {
            // Best-effort
        }

        return ReviewResponse.builder()
                .id(review.getId())
                .doctorId(review.getDoctorId())
                .doctorName(doctorName)
                .userId(review.getUserId())
                .patientName(patientName)
                .appointmentId(review.getAppointmentId())
                .rating(review.getRating())
                .comment(review.getComment())
                .recommendation(review.getRecommendation())
                .status(review.getStatus() != null ? review.getStatus().name() : null)
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    private DoctorResponse mapToDoctorResponse(Doctor doctor) {
        HospitalResponse hospitalInfo = null;
        if (doctor.getHospitalId() != null) {
            try {
                hospitalInfo = hospitalClient.getHospitalById(doctor.getHospitalId());
            } catch (Exception e) {
                // Best effort — fall back to the doctor's own clinic fields.
            }
        }

        return DoctorResponse.builder()
                .id(doctor.getId())
                .doctorName(doctor.getDoctorName())
                .userId(doctor.getUserId())
                .hospitalId(doctor.getHospitalId())
                .hospitalInfo(hospitalInfo)
                .specialization(doctor.getSpecialization() != null ? doctor.getSpecialization().name() : null)
                .qualification(doctor.getQualification())
                .experience(doctor.getExperience())
                .consultationFee(doctor.getConsultationFee())
                .city(doctor.getCity())
                .state(doctor.getState())
                .clinicName(doctor.getClinicName())
                .clinicAddress(doctor.getClinicAddress())
                .latitude(doctor.getLatitude())
                .longitude(doctor.getLongitude())
                .available(doctor.isAvailable())
                .rating(doctor.getRating())
                .totalReviews(doctor.getTotalReviews())
                .profileImage(doctor.getProfileImage())
                .build();
    }

    // Day 6: Onboarding Methods
    @Override
    public DoctorProfileResponse createDoctorProfile(DoctorProfileRequest request, Long userId) {
        if (doctorRepository.findByUserId(userId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor profile already exists for this user");
        }

        Doctor doctor = Doctor.builder()
                .userId(userId)
                .doctorName(request.getDoctorName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .gender(request.getGender())
                .dateOfBirth(request.getDateOfBirth())
                .profileImage(request.getProfileImage())
                .specialization(request.getSpecialization())
                .subSpecialization(request.getSubSpecialization())
                .qualification(request.getQualification())
                .medicalCollege(request.getMedicalCollege())
                .medicalLicenseNumber(request.getMedicalLicenseNumber())
                .experience(request.getExperience() != null ? request.getExperience() : 0)
                .about(request.getAbout())
                .consultationFee(request.getConsultationFee() != null ? request.getConsultationFee() : 0.0)
                .languages(request.getLanguages())
                .clinicName(request.getClinicName())
                .clinicAddress(request.getClinicAddress())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry())
                .pincode(request.getPincode())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .workingDays(request.getWorkingDays())
                .consultationStartTime(request.getConsultationStartTime())
                .consultationEndTime(request.getConsultationEndTime())
                .appointmentDuration(request.getAppointmentDuration())
                .availableForOnlineConsultation(Boolean.TRUE.equals(request.getAvailableForOnlineConsultation()))
                .availableForEmergency(Boolean.TRUE.equals(request.getAvailableForEmergency()))
                // New doctor profiles start PENDING until reviewed & approved by an admin.
                .verificationStatus(com.medifind.doctor.entity.VerificationStatus.PENDING)
                .available(false)
                .build();

        doctor = doctorRepository.save(doctor);
        return mapToDoctorProfileResponse(doctor);
    }

    @Override
    public DoctorProfileResponse getDoctorProfileByUserId(Long userId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor profile not found"));
        return mapToDoctorProfileResponse(doctor);
    }

    @Override
    public DoctorProfileResponse updateDoctorProfile(DoctorProfileRequest request, Long userId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor profile not found"));

        // Update fields
        if (request.getDoctorName() != null) doctor.setDoctorName(request.getDoctorName());
        if (request.getPhoneNumber() != null) doctor.setPhoneNumber(request.getPhoneNumber());
        if (request.getGender() != null) doctor.setGender(request.getGender());
        if (request.getDateOfBirth() != null) doctor.setDateOfBirth(request.getDateOfBirth());
        if (request.getProfileImage() != null) doctor.setProfileImage(request.getProfileImage());
        if (request.getSpecialization() != null) doctor.setSpecialization(request.getSpecialization());
        if (request.getSubSpecialization() != null) doctor.setSubSpecialization(request.getSubSpecialization());
        if (request.getQualification() != null) doctor.setQualification(request.getQualification());
        if (request.getMedicalCollege() != null) doctor.setMedicalCollege(request.getMedicalCollege());
        if (request.getMedicalLicenseNumber() != null) doctor.setMedicalLicenseNumber(request.getMedicalLicenseNumber());
        if (request.getExperience() != null) doctor.setExperience(request.getExperience());
        if (request.getAbout() != null) doctor.setAbout(request.getAbout());
        if (request.getConsultationFee() != null) doctor.setConsultationFee(request.getConsultationFee());
        if (request.getLanguages() != null) doctor.setLanguages(request.getLanguages());
        if (request.getClinicName() != null) doctor.setClinicName(request.getClinicName());
        if (request.getClinicAddress() != null) doctor.setClinicAddress(request.getClinicAddress());
        if (request.getCity() != null) doctor.setCity(request.getCity());
        if (request.getState() != null) doctor.setState(request.getState());
        if (request.getCountry() != null) doctor.setCountry(request.getCountry());
        if (request.getPincode() != null) doctor.setPincode(request.getPincode());
        if (request.getLatitude() != null) doctor.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) doctor.setLongitude(request.getLongitude());
        if (request.getWorkingDays() != null) doctor.setWorkingDays(request.getWorkingDays());
        if (request.getConsultationStartTime() != null) doctor.setConsultationStartTime(request.getConsultationStartTime());
        if (request.getConsultationEndTime() != null) doctor.setConsultationEndTime(request.getConsultationEndTime());
        if (request.getAppointmentDuration() != null) doctor.setAppointmentDuration(request.getAppointmentDuration());
        
        // Only update when explicitly provided — otherwise a partial update would
        // silently reset these flags to false.
        if (request.getAvailableForOnlineConsultation() != null) {
            doctor.setAvailableForOnlineConsultation(request.getAvailableForOnlineConsultation());
        }
        if (request.getAvailableForEmergency() != null) {
            doctor.setAvailableForEmergency(request.getAvailableForEmergency());
        }

        doctor = doctorRepository.save(doctor);
        return mapToDoctorProfileResponse(doctor);
    }

    @Override
    public void updateLicensePath(Long doctorId, String filePath) {
        Doctor doctor = getDoctor(doctorId);
        doctor.setLicenseCertificatePath(filePath);
        doctorRepository.save(doctor);
    }

    @Override
    public void submitForVerification(Long doctorId) {
        Doctor doctor = getDoctor(doctorId);
        if (doctor.getVerificationStatus() == com.medifind.doctor.entity.VerificationStatus.PENDING) {
            // Already pending, or could add more validation here
            // e.g. check if required fields are filled
        }
        doctorRepository.save(doctor);
        // Here we could trigger a Notification event for admin
    }

    private DoctorProfileResponse mapToDoctorProfileResponse(Doctor doctor) {
        return DoctorProfileResponse.builder()
                .id(doctor.getId())
                .userId(doctor.getUserId())
                .doctorName(doctor.getDoctorName())
                .email(doctor.getEmail())
                .phoneNumber(doctor.getPhoneNumber())
                .gender(doctor.getGender())
                .dateOfBirth(doctor.getDateOfBirth())
                .profileImage(doctor.getProfileImage())
                .specialization(doctor.getSpecialization())
                .subSpecialization(doctor.getSubSpecialization())
                .qualification(doctor.getQualification())
                .medicalCollege(doctor.getMedicalCollege())
                .medicalLicenseNumber(doctor.getMedicalLicenseNumber())
                .experience(doctor.getExperience())
                .about(doctor.getAbout())
                .consultationFee(doctor.getConsultationFee())
                .languages(doctor.getLanguages())
                .clinicName(doctor.getClinicName())
                .clinicAddress(doctor.getClinicAddress())
                .city(doctor.getCity())
                .state(doctor.getState())
                .country(doctor.getCountry())
                .pincode(doctor.getPincode())
                .latitude(doctor.getLatitude())
                .longitude(doctor.getLongitude())
                .workingDays(doctor.getWorkingDays())
                .consultationStartTime(doctor.getConsultationStartTime())
                .consultationEndTime(doctor.getConsultationEndTime())
                .appointmentDuration(doctor.getAppointmentDuration())
                .availableForOnlineConsultation(doctor.isAvailableForOnlineConsultation())
                .availableForEmergency(doctor.isAvailableForEmergency())
                .verificationStatus(doctor.getVerificationStatus())
                .licenseCertificatePath(doctor.getLicenseCertificatePath())
                .rejectionReason(doctor.getRejectionReason())
                .createdAt(doctor.getCreatedAt())
                .updatedAt(doctor.getUpdatedAt())
                .rating(doctor.getRating())
                .totalReviews(doctor.getTotalReviews())
                .ratingDistribution(RatingDistribution.builder()
                        .averageRating(doctor.getRating())
                        .totalReviews(doctor.getTotalReviews())
                        .rating5(doctor.getRating5())
                        .rating4(doctor.getRating4())
                        .rating3(doctor.getRating3())
                        .rating2(doctor.getRating2())
                        .rating1(doctor.getRating1())
                        .build())
                .build();
    }
}
