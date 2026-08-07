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
     * @param specialization filter by specialization (partial match, case-insensitive)
     * @param city           filter by city (partial match, case-insensitive)
     * @param hospitalId     filter by exact hospital ID
     * @param available      filter by availability flag
     * @param minimumRating  filter doctors with rating >= this value
     * @param experience     filter doctors with experience >= this value (years)
     * @return list of matching doctor response DTOs
     */
    List<DoctorResponse> searchDoctors(String specialization, String city, Long hospitalId,
                                       Boolean available, Double minimumRating, Integer experience);
}
