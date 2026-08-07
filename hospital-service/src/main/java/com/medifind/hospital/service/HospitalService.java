package com.medifind.hospital.service;

import com.medifind.hospital.dto.HospitalRequest;
import com.medifind.hospital.dto.HospitalResponse;

import java.util.List;

/**
 * Business service contract for Hospital operations.
 */
public interface HospitalService {

    /**
     * Create a new hospital record.
     *
     * @param request validated hospital data
     * @return the persisted hospital as a response DTO
     */
    HospitalResponse createHospital(HospitalRequest request);

    /**
     * Retrieve all hospitals.
     *
     * @return list of all hospital response DTOs
     */
    List<HospitalResponse> getAllHospitals();

    /**
     * Retrieve a single hospital by its ID.
     *
     * @param id hospital identifier
     * @return hospital response DTO
     */
    HospitalResponse getHospitalById(Long id);

    /**
     * Update an existing hospital record.
     *
     * @param id      hospital identifier
     * @param request updated hospital data
     * @return updated hospital response DTO
     */
    HospitalResponse updateHospital(Long id, HospitalRequest request);

    /**
     * Permanently delete a hospital record.
     *
     * @param id hospital identifier
     */
    void deleteHospital(Long id);
}
