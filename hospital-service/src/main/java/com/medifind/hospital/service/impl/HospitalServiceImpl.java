package com.medifind.hospital.service.impl;

import com.medifind.hospital.dto.HospitalRequest;
import com.medifind.hospital.dto.HospitalResponse;
import com.medifind.hospital.entity.Hospital;
import com.medifind.hospital.exception.DuplicateEmailException;
import com.medifind.hospital.exception.HospitalNotFoundException;
import com.medifind.hospital.repository.HospitalRepository;
import com.medifind.hospital.service.HospitalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of {@link HospitalService}.
 * Follows the Repository Pattern and keeps all business logic here.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HospitalServiceImpl implements HospitalService {

    private final HospitalRepository hospitalRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public HospitalResponse createHospital(HospitalRequest request) {
        log.info("Creating hospital with name: {}", request.getHospitalName());

        if (hospitalRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException("A hospital with email '" + request.getEmail() + "' already exists.");
        }

        Hospital hospital = mapToEntity(request);
        Hospital saved = hospitalRepository.save(hospital);

        log.info("Hospital created successfully with id: {}", saved.getId());
        return mapToResponse(saved);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public List<HospitalResponse> getAllHospitals() {
        log.info("Fetching all hospitals");
        return hospitalRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional(readOnly = true)
    public HospitalResponse getHospitalById(Long id) {
        log.info("Fetching hospital with id: {}", id);
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new HospitalNotFoundException("Hospital not found with id: " + id));
        return mapToResponse(hospital);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public HospitalResponse updateHospital(Long id, HospitalRequest request) {
        log.info("Updating hospital with id: {}", id);
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new HospitalNotFoundException("Hospital not found with id: " + id));

        // If email is being changed, ensure it's not taken by another hospital
        if (!hospital.getEmail().equalsIgnoreCase(request.getEmail())
                && hospitalRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException("Email '" + request.getEmail() + "' is already in use.");
        }

        hospital.setHospitalName(request.getHospitalName());
        hospital.setAddress(request.getAddress());
        hospital.setCity(request.getCity());
        hospital.setState(request.getState());
        hospital.setPhoneNumber(request.getPhoneNumber());
        hospital.setEmail(request.getEmail());
        hospital.setLatitude(request.getLatitude());
        hospital.setLongitude(request.getLongitude());
        hospital.setEmergencyAvailable(request.isEmergencyAvailable());

        Hospital updated = hospitalRepository.save(hospital);
        log.info("Hospital updated successfully with id: {}", updated.getId());
        return mapToResponse(updated);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public void deleteHospital(Long id) {
        log.info("Deleting hospital with id: {}", id);
        if (!hospitalRepository.existsById(id)) {
            throw new HospitalNotFoundException("Hospital not found with id: " + id);
        }
        hospitalRepository.deleteById(id);
        log.info("Hospital deleted successfully with id: {}", id);
    }

    // ──────────────────────── Mappers ────────────────────────

    private Hospital mapToEntity(HospitalRequest request) {
        return Hospital.builder()
                .hospitalName(request.getHospitalName())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .emergencyAvailable(request.isEmergencyAvailable())
                .build();
    }

    private HospitalResponse mapToResponse(Hospital hospital) {
        return HospitalResponse.builder()
                .id(hospital.getId())
                .hospitalName(hospital.getHospitalName())
                .address(hospital.getAddress())
                .city(hospital.getCity())
                .state(hospital.getState())
                .phoneNumber(hospital.getPhoneNumber())
                .email(hospital.getEmail())
                .latitude(hospital.getLatitude())
                .longitude(hospital.getLongitude())
                .emergencyAvailable(hospital.isEmergencyAvailable())
                .createdAt(hospital.getCreatedAt())
                .updatedAt(hospital.getUpdatedAt())
                .build();
    }
}
