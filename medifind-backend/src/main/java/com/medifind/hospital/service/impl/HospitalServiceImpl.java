package com.medifind.hospital.service.impl;

import com.medifind.hospital.dto.*;
import com.medifind.hospital.entity.Hospital;
import com.medifind.hospital.entity.HospitalImage;
import com.medifind.hospital.entity.HospitalStatus;
import com.medifind.hospital.exception.DuplicateEmailException;
import com.medifind.hospital.exception.HospitalNotFoundException;
import com.medifind.hospital.repository.HospitalImageRepository;
import com.medifind.hospital.repository.HospitalRepository;
import com.medifind.hospital.service.HospitalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * Implementation of {@link HospitalService}.
 * Follows the Repository Pattern and keeps all business logic here.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HospitalServiceImpl implements HospitalService {

    public static final int MAX_IMAGES = 10;

    private final HospitalRepository hospitalRepository;
    private final HospitalImageRepository imageRepository;

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
    public List<HospitalResponse> getAllHospitals(boolean includeInactive) {
        log.info("Fetching all hospitals (includeInactive={})", includeInactive);
        return hospitalRepository.findAll()
                .stream()
                .filter(h -> includeInactive || isPubliclyVisible(h))
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
        if (emailInUseByOther(request.getEmail(), hospital.getEmail())) {
            throw new DuplicateEmailException("Email '" + request.getEmail() + "' is already in use.");
        }

        hospital.setHospitalName(request.getHospitalName());
        hospital.setAddress(request.getAddress());
        hospital.setCity(request.getCity());
        hospital.setState(request.getState());
        hospital.setPhoneNumber(request.getPhoneNumber());
        hospital.setEmail(request.getEmail() == null || request.getEmail().isBlank()
                ? null : request.getEmail().trim().toLowerCase(Locale.ENGLISH));
        hospital.setLatitude(request.getLatitude());
        hospital.setLongitude(request.getLongitude());
        hospital.setEmergencyAvailable(request.isEmergencyAvailable());
        if (request.getActive() != null) {
            hospital.setActive(request.getActive());
        }

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
        imageRepository.deleteByHospitalId(id);
        hospitalRepository.deleteById(id);
        log.info("Hospital deleted successfully with id: {}", id);
    }

    // ─────────── Hospital-owner profile operations ───────────

    @Override
    @Transactional
    public HospitalResponse createProfile(Long userId, HospitalProfileRequest request) {
        if (hospitalRepository.existsByUserId(userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have a hospital profile.");
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()
                && hospitalRepository.existsByEmail(request.getEmail().trim().toLowerCase(Locale.ENGLISH))) {
            throw new DuplicateEmailException("A hospital with email '" + request.getEmail() + "' already exists.");
        }

        Hospital hospital = mapProfileToEntity(request);
        hospital.setUserId(userId);
        // New self-registered hospitals require admin approval before going public.
        hospital.setStatus(HospitalStatus.PENDING);
        hospital.setActive(false);

        Hospital saved = hospitalRepository.save(hospital);
        log.info("Hospital profile created for user {} with id {}", userId, saved.getId());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public HospitalResponse updateProfile(Long userId, HospitalProfileRequest request) {
        Hospital hospital = getOwnedHospital(userId);

        if (emailInUseByOther(request.getEmail(), hospital.getEmail())) {
            throw new DuplicateEmailException("Email '" + request.getEmail() + "' is already in use.");
        }

        applyProfile(hospital, request);
        if (hospital.getImageUrl() == null && request.getImageUrl() != null) {
            hospital.setImageUrl(request.getImageUrl());
        }

        Hospital updated = hospitalRepository.save(hospital);
        log.info("Hospital profile updated for user {}", userId);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public HospitalResponse getProfileByUserId(Long userId) {
        Hospital hospital = getOwnedHospital(userId);
        return mapToResponse(hospital);
    }

    @Override
    @Transactional(readOnly = true)
    public String getProfileStatus(Long userId) {
        return hospitalRepository.findByUserId(userId)
                .map(h -> h.getStatus() == null ? "INCOMPLETE" : h.getStatus().name())
                .orElse("INCOMPLETE");
    }

    @Override
    @Transactional(readOnly = true)
    public List<HospitalResponse> getAllHospitalsAdmin() {
        return hospitalRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public HospitalResponse updateStatus(Long id, HospitalStatus status) {
        Hospital hospital = hospitalRepository.findById(id)
                .orElseThrow(() -> new HospitalNotFoundException("Hospital not found with id: " + id));
        hospital.setStatus(status);
        hospital.setActive(status == HospitalStatus.APPROVED || status == HospitalStatus.ACTIVE);
        Hospital updated = hospitalRepository.save(hospital);
        log.info("Hospital {} status set to {}", id, status);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HospitalResponse> searchHospitals(String q, String city, String type) {
        String query = q == null ? "" : q.trim().toLowerCase(Locale.ENGLISH);
        String cityQ = city == null ? "" : city.trim().toLowerCase(Locale.ENGLISH);
        String typeQ = type == null ? "" : type.trim().toLowerCase(Locale.ENGLISH);

        return hospitalRepository.findAll().stream()
                .filter(this::isPubliclyVisible)
                .filter(h -> cityQ.isEmpty() || (h.getCity() != null && h.getCity().toLowerCase(Locale.ENGLISH).contains(cityQ)))
                .filter(h -> typeQ.isEmpty() || (h.getHospitalType() != null && h.getHospitalType().toLowerCase(Locale.ENGLISH).contains(typeQ)))
                .filter(h -> query.isEmpty() || matchesQuery(h, query))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ─────────── Hospital image operations ───────────

    @Override
    @Transactional
    public HospitalImageResponse addImage(Long hospitalId, String imageUrl, Long requesterUserId, boolean isAdmin) {
        Hospital hospital = getHospitalForRequester(hospitalId, requesterUserId, isAdmin);
        long count = imageRepository.countByHospitalId(hospitalId);
        if (count >= MAX_IMAGES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum 10 images allowed.");
        }

        HospitalImage image = HospitalImage.builder()
                .hospitalId(hospitalId)
                .imageUrl(imageUrl)
                .displayOrder((int) count)
                .build();
        image = imageRepository.save(image);

        // First uploaded image becomes the cover image.
        if (hospital.getImageUrl() == null || hospital.getImageUrl().isBlank()) {
            hospital.setImageUrl(imageUrl);
            hospitalRepository.save(hospital);
        }

        return mapImageToResponse(image);
    }

    @Override
    @Transactional
    public HospitalImageResponse replaceImage(Long imageId, String imageUrl, Long requesterUserId, boolean isAdmin) {
        HospitalImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found"));
        getHospitalForRequester(image.getHospitalId(), requesterUserId, isAdmin);

        Hospital hospital = hospitalRepository.findById(image.getHospitalId()).orElse(null);
        if (hospital != null && imageUrl.equals(hospital.getImageUrl())) {
            // no-op cover replacement — nothing to change
        } else if (hospital != null && hospital.getImageUrl() != null && hospital.getImageUrl().equals(image.getImageUrl())) {
            hospital.setImageUrl(imageUrl);
            hospitalRepository.save(hospital);
        }

        image.setImageUrl(imageUrl);
        image = imageRepository.save(image);
        return mapImageToResponse(image);
    }

    @Override
    @Transactional
    public void deleteImage(Long imageId, Long requesterUserId, boolean isAdmin) {
        HospitalImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found"));
        Hospital hospital = getHospitalForRequester(image.getHospitalId(), requesterUserId, isAdmin);

        imageRepository.delete(image);

        // Keep the cover image in sync — fall back to the first remaining image.
        if (hospital.getImageUrl() != null && hospital.getImageUrl().equals(image.getImageUrl())) {
            List<HospitalImage> remaining = imageRepository.findByHospitalIdOrderByDisplayOrderAsc(hospital.getId());
            hospital.setImageUrl(remaining.isEmpty() ? null : remaining.get(0).getImageUrl());
            hospitalRepository.save(hospital);
        }
    }

    @Override
    @Transactional
    public List<HospitalImageResponse> reorderImages(Long hospitalId, List<Long> orderedIds, Long requesterUserId, boolean isAdmin) {
        getHospitalForRequester(hospitalId, requesterUserId, isAdmin);
        List<HospitalImage> images = imageRepository.findByHospitalIdOrderByDisplayOrderAsc(hospitalId);
        if (orderedIds == null || orderedIds.isEmpty()) {
            return images.stream().map(this::mapImageToResponse).collect(Collectors.toList());
        }

        for (int i = 0; i < orderedIds.size(); i++) {
            Long id = orderedIds.get(i);
            final int order = i;
            images.stream()
                    .filter(img -> img.getId().equals(id))
                    .findFirst()
                    .ifPresent(img -> img.setDisplayOrder(order));
        }
        imageRepository.saveAll(images);
        return imageRepository.findByHospitalIdOrderByDisplayOrderAsc(hospitalId)
                .stream().map(this::mapImageToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteImagesByHospital(Long hospitalId) {
        imageRepository.deleteByHospitalId(hospitalId);
    }

    // ──────────────── Helpers ────────────────

    private boolean isPubliclyVisible(Hospital h) {
        HospitalStatus st = h.getStatus() == null ? HospitalStatus.APPROVED : h.getStatus();
        return h.isActive() && (st == HospitalStatus.APPROVED || st == HospitalStatus.ACTIVE);
    }

    private boolean matchesQuery(Hospital h, String query) {
        if (query.isEmpty()) return true;
        return anyContains(query,
                h.getHospitalName(), h.getAddress(), h.getCity(), h.getState(),
                h.getHospitalType(), h.getFacilities(), h.getSpecialties());
    }

    private boolean anyContains(String query, String... values) {
        for (String v : values) {
            if (v != null && v.toLowerCase(Locale.ENGLISH).contains(query)) return true;
        }
        return false;
    }

    private boolean emailInUseByOther(String requested, String current) {
        if (requested == null || requested.isBlank()) return false;
        String req = requested.trim().toLowerCase(Locale.ENGLISH);
        if (current != null && current.trim().toLowerCase(Locale.ENGLISH).equals(req)) return false;
        return hospitalRepository.existsByEmail(req);
    }

    private Hospital getOwnedHospital(Long userId) {
        return hospitalRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hospital profile not found"));
    }

    private Hospital getHospitalForRequester(Long hospitalId, Long requesterUserId, boolean isAdmin) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new HospitalNotFoundException("Hospital not found with id: " + hospitalId));
        if (!isAdmin && (hospital.getUserId() == null || !hospital.getUserId().equals(requesterUserId))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own hospital images");
        }
        return hospital;
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
                .active(request.getActive() == null || request.getActive())
                .build();
    }

    private Hospital mapProfileToEntity(HospitalProfileRequest request) {
        Hospital hospital = Hospital.builder()
                .hospitalName(request.getHospitalName())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .phoneNumber(request.getPhoneNumber())
                .build();
        applyProfile(hospital, request);
        return hospital;
    }

    private void applyProfile(Hospital hospital, HospitalProfileRequest request) {
        hospital.setHospitalName(request.getHospitalName());
        hospital.setAddress(request.getAddress());
        hospital.setCity(request.getCity());
        hospital.setState(request.getState());
        if (request.getPincode() != null) hospital.setPincode(request.getPincode());
        hospital.setPhoneNumber(request.getPhoneNumber());
        // Email is optional — blank/null clears it (nullable column).
        hospital.setEmail(request.getEmail() == null || request.getEmail().isBlank()
                ? null : request.getEmail().trim().toLowerCase(Locale.ENGLISH));
        if (request.getHospitalType() != null) hospital.setHospitalType(request.getHospitalType());
        if (request.getDescription() != null) hospital.setDescription(request.getDescription());
        if (request.getWebsite() != null) hospital.setWebsite(request.getWebsite());
        if (request.getFacilities() != null) hospital.setFacilities(request.getFacilities());
        if (request.getSpecialties() != null) hospital.setSpecialties(request.getSpecialties());
        if (request.getOperatingHours() != null) hospital.setOperatingHours(request.getOperatingHours());
        if (request.getLatitude() != null) hospital.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) hospital.setLongitude(request.getLongitude());
        hospital.setEmergencyAvailable(request.isEmergencyAvailable());
        if (request.getAmbulanceAvailable() != null) hospital.setAmbulanceAvailable(request.getAmbulanceAvailable());
        if (request.getAmbulancePhone() != null && !request.getAmbulancePhone().isBlank()) {
            hospital.setAmbulancePhone(request.getAmbulancePhone());
        } else if (request.getAmbulanceAvailable() != null && !request.getAmbulanceAvailable()) {
            hospital.setAmbulancePhone(null);
        }
        if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
            hospital.setImageUrl(request.getImageUrl());
        }
    }

    private HospitalResponse mapToResponse(Hospital hospital) {
        List<HospitalImage> images = imageRepository.findByHospitalIdOrderByDisplayOrderAsc(hospital.getId());
        return HospitalResponse.builder()
                .id(hospital.getId())
                .hospitalName(hospital.getHospitalName())
                .address(hospital.getAddress())
                .city(hospital.getCity())
                .state(hospital.getState())
                .pincode(hospital.getPincode())
                .phoneNumber(hospital.getPhoneNumber())
                .email(hospital.getEmail())
                .latitude(hospital.getLatitude())
                .longitude(hospital.getLongitude())
                .emergencyAvailable(hospital.isEmergencyAvailable())
                .active(hospital.isActive())
                .hospitalType(hospital.getHospitalType())
                .description(hospital.getDescription())
                .website(hospital.getWebsite())
                .facilities(hospital.getFacilities())
                .specialties(hospital.getSpecialties())
                .operatingHours(hospital.getOperatingHours())
                .ambulanceAvailable(hospital.isAmbulanceAvailable())
                .ambulancePhone(hospital.getAmbulancePhone())
                .imageUrl(hospital.getImageUrl())
                .status(hospital.getStatus() == null ? null : hospital.getStatus().name())
                .userId(hospital.getUserId())
                .createdAt(hospital.getCreatedAt())
                .updatedAt(hospital.getUpdatedAt())
                .rating(hospital.getRating())
                .totalReviews(hospital.getTotalReviews())
                .ratingDistribution(com.medifind.hospital.dto.RatingDistribution.builder()
                        .averageRating(hospital.getRating())
                        .totalReviews(hospital.getTotalReviews())
                        .rating5(hospital.getRating5())
                        .rating4(hospital.getRating4())
                        .rating3(hospital.getRating3())
                        .rating2(hospital.getRating2())
                        .rating1(hospital.getRating1())
                        .build())
                .images(images.stream().map(this::mapImageToResponse).collect(Collectors.toList()))
                .build();
    }

    private HospitalImageResponse mapImageToResponse(HospitalImage image) {
        return HospitalImageResponse.builder()
                .id(image.getId())
                .hospitalId(image.getHospitalId())
                .imageUrl(image.getImageUrl())
                .displayOrder(image.getDisplayOrder())
                .createdAt(image.getCreatedAt())
                .build();
    }
}
