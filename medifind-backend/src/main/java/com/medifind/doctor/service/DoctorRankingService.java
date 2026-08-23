package com.medifind.doctor.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medifind.doctor.dto.RankedDoctorResponse;
import com.medifind.doctor.dto.RankedHospitalResponse;
import com.medifind.doctor.entity.Doctor;
import com.medifind.doctor.entity.VerificationStatus;
import com.medifind.doctor.repository.DoctorRepository;
import com.medifind.doctor.util.DistanceUtils;
import com.medifind.hospital.entity.Hospital;
import com.medifind.hospital.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Ranks doctors using weighted scoring algorithms that adapt to
 * whether the context is an emergency or a normal consultation.
 * <p>
 * <b>Normal ranking weights:</b>
 * <ul>
 *   <li>Rating: 40%</li>
 *   <li>Experience: 25%</li>
 *   <li>Availability: 20%</li>
 *   <li>Distance: 15%</li>
 * </ul>
 * <p>
 * <b>Emergency ranking weights:</b>
 * <ul>
 *   <li>Distance: 70%</li>
 *   <li>Availability: 20%</li>
 *   <li>Rating: 10%</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorRankingService {

    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;
    private final ObjectMapper objectMapper;

    // ─────────── Normal weights ───────────
    private static final double NORMAL_WEIGHT_RATING = 0.40;
    private static final double NORMAL_WEIGHT_EXPERIENCE = 0.25;
    private static final double NORMAL_WEIGHT_AVAILABILITY = 0.20;
    private static final double NORMAL_WEIGHT_DISTANCE = 0.15;

    // ─────────── Emergency weights ───────────
    private static final double EMERGENCY_WEIGHT_DISTANCE = 0.70;
    private static final double EMERGENCY_WEIGHT_AVAILABILITY = 0.20;
    private static final double EMERGENCY_WEIGHT_RATING = 0.10;

    /** Maximum expected experience in years for normalisation. */
    private static final double MAX_EXPERIENCE_YEARS = 40.0;

    /** Maximum expected distance in km for normalisation. */
    private static final double MAX_DISTANCE_KM = 100.0;

    /**
     * Rank doctors by the given specialization, using either emergency or normal weights.
     *
     * @param specialization the target specialization (enum name)
     * @param emergency      true for emergency ranking, false for normal
     * @param userLat        user latitude (nullable — if null, distance is omitted)
     * @param userLng        user longitude (nullable)
     * @return ranked list of doctor DTOs sorted by descending score
     */
    public List<RankedDoctorResponse> rankDoctors(String specialization, boolean emergency,
                                                   Double userLat, Double userLng) {
        List<Doctor> doctors = doctorRepository.findAll().stream()
                .filter(d -> d.getVerificationStatus() == VerificationStatus.APPROVED)
                .filter(d -> d.getSpecialization() != null
                        && d.getSpecialization().name().equalsIgnoreCase(specialization))
                .collect(Collectors.toList());

        // If no doctors found for exact specialization, broaden to GENERAL_PHYSICIAN
        if (doctors.isEmpty() && !"GENERAL_PHYSICIAN".equalsIgnoreCase(specialization)) {
            log.info("No {} doctors found, falling back to GENERAL_PHYSICIAN", specialization);
            doctors = doctorRepository.findAll().stream()
                    .filter(d -> d.getVerificationStatus() == VerificationStatus.APPROVED)
                    .filter(d -> d.getSpecialization() != null
                            && d.getSpecialization().name().equals("GENERAL_PHYSICIAN"))
                    .collect(Collectors.toList());
        }

        List<RankedDoctorResponse> ranked = new ArrayList<>();

        for (Doctor doctor : doctors) {
            Double distanceKm = null;
            if (userLat != null && userLng != null
                    && doctor.getLatitude() != null && doctor.getLongitude() != null) {
                distanceKm = DistanceUtils.haversineKm(
                        userLat, userLng, doctor.getLatitude(), doctor.getLongitude());
            }

            double score = computeScore(doctor, distanceKm, emergency);
            String hospitalName = resolveHospitalName(doctor.getHospitalId());

            ranked.add(RankedDoctorResponse.builder()
                    .id(doctor.getId())
                    .doctorName(doctor.getDoctorName())
                    .specialization(doctor.getSpecialization() != null
                            ? doctor.getSpecialization().name() : null)
                    .experience(doctor.getExperience())
                    .rating(doctor.getRating())
                    .totalReviews(doctor.getTotalReviews())
                    .hospital(hospitalName)
                    .city(doctor.getCity())
                    .clinicAddress(doctor.getClinicAddress())
                    .available(doctor.isAvailable())
                    .availableForEmergency(doctor.isAvailableForEmergency())
                    .latitude(doctor.getLatitude())
                    .longitude(doctor.getLongitude())
                    .consultationFee(doctor.getConsultationFee())
                    .profileImage(doctor.getProfileImage())
                    .rankingScore(Math.round(score * 100.0) / 100.0)
                    .distanceKm(distanceKm != null
                            ? Math.round(distanceKm * 100.0) / 100.0 : null)
                    .build());
        }

        // Sort descending by ranking score
        ranked.sort((a, b) -> Double.compare(
                b.getRankingScore() != null ? b.getRankingScore() : 0.0,
                a.getRankingScore() != null ? a.getRankingScore() : 0.0));

        return ranked;
    }

    /**
     * Find nearest hospitals sorted by distance.
     *
     * @param userLat user latitude
     * @param userLng user longitude
     * @return list of nearest hospitals with distance, sorted ascending by distance
     */
    public List<RankedHospitalResponse> findNearestHospitals(Double userLat, Double userLng) {
        List<Hospital> hospitals = hospitalRepository.findAll().stream()
                .filter(Hospital::isActive)
                .collect(Collectors.toList());

        List<RankedHospitalResponse> results = new ArrayList<>();

        for (Hospital hospital : hospitals) {
            Double distanceKm = null;
            if (userLat != null && userLng != null
                    && hospital.getLatitude() != null && hospital.getLongitude() != null) {
                distanceKm = DistanceUtils.haversineKm(
                        userLat, userLng, hospital.getLatitude(), hospital.getLongitude());
            }

            results.add(RankedHospitalResponse.builder()
                    .id(hospital.getId())
                    .hospitalName(hospital.getHospitalName())
                    .address(hospital.getAddress())
                    .city(hospital.getCity())
                    .phoneNumber(hospital.getPhoneNumber())
                    .emergencyAvailable(hospital.isEmergencyAvailable())
                    .latitude(hospital.getLatitude())
                    .longitude(hospital.getLongitude())
                    .distanceKm(distanceKm != null
                            ? Math.round(distanceKm * 100.0) / 100.0 : null)
                    .build());
        }

        // Sort ascending by distance (nulls last)
        results.sort((a, b) -> {
            if (a.getDistanceKm() == null && b.getDistanceKm() == null) return 0;
            if (a.getDistanceKm() == null) return 1;
            if (b.getDistanceKm() == null) return -1;
            return Double.compare(a.getDistanceKm(), b.getDistanceKm());
        });

        return results;
    }

    /**
     * Compute a 0-100 composite ranking score.
     */
    private double computeScore(Doctor doctor, Double distanceKm, boolean emergency) {
        double ratingScore = normalizeRating(doctor.getRating());
        double experienceScore = normalizeExperience(doctor.getExperience());
        double availabilityScore = doctor.isAvailable() ? 1.0 : 0.0;
        double distanceScore = distanceKm != null
                ? normalizeDistance(distanceKm) : 0.5; // neutral if unknown

        double score;
        if (emergency) {
            // Emergency: distance is dominant, availability matters, rating is minor
            score = (EMERGENCY_WEIGHT_DISTANCE * distanceScore)
                    + (EMERGENCY_WEIGHT_AVAILABILITY * availabilityScore)
                    + (EMERGENCY_WEIGHT_RATING * ratingScore);
        } else {
            // Normal: rating > experience > availability > distance
            score = (NORMAL_WEIGHT_RATING * ratingScore)
                    + (NORMAL_WEIGHT_EXPERIENCE * experienceScore)
                    + (NORMAL_WEIGHT_AVAILABILITY * availabilityScore)
                    + (NORMAL_WEIGHT_DISTANCE * distanceScore);
        }

        return score * 100.0; // scale to 0-100
    }

    /** Normalize rating to 0-1 scale (5-star scale). */
    private double normalizeRating(Double rating) {
        if (rating == null || rating <= 0) return 0.0;
        return Math.min(1.0, rating / 5.0);
    }

    /** Normalize experience to 0-1 scale. */
    private double normalizeExperience(Integer experience) {
        if (experience == null || experience <= 0) return 0.0;
        return Math.min(1.0, experience / MAX_EXPERIENCE_YEARS);
    }

    /** Normalize distance to 0-1 scale (closer = higher score). */
    private double normalizeDistance(double distanceKm) {
        return Math.max(0.0, 1.0 - (distanceKm / MAX_DISTANCE_KM));
    }

    /** Resolve hospital name from hospital ID. */
    private String resolveHospitalName(Long hospitalId) {
        if (hospitalId == null) return null;
        try {
            Hospital hospital = hospitalRepository.findById(hospitalId).orElse(null);
            return hospital != null ? hospital.getHospitalName() : null;
        } catch (Exception e) {
            log.warn("Failed to resolve hospital name for id={}: {}", hospitalId, e.getMessage());
            return null;
        }
    }
}
