package com.medifind.hospital.service;

import com.medifind.hospital.dto.*;
import com.medifind.hospital.entity.HospitalStatus;

import java.util.List;

/**
 * Business service contract for Hospital operations.
 */
public interface HospitalService {

    /**
     * Create a new hospital record (admin).
     */
    HospitalResponse createHospital(HospitalRequest request);

    /**
     * Retrieve all hospitals.
     *
     * @param includeInactive include deactivated hospitals (admin views)
     */
    List<HospitalResponse> getAllHospitals(boolean includeInactive);

    /**
     * Retrieve a single hospital by its ID.
     */
    HospitalResponse getHospitalById(Long id);

    /**
     * Update an existing hospital record (admin).
     */
    HospitalResponse updateHospital(Long id, HospitalRequest request);

    /**
     * Permanently delete a hospital record (admin). Also removes its images.
     */
    void deleteHospital(Long id);

    // ─────────── Hospital-owner profile operations ───────────

    /**
     * Create the hospital profile owned by an auth user. New profiles start
     * PENDING and only become public once an admin approves them.
     */
    HospitalResponse createProfile(Long userId, HospitalProfileRequest request);

    /**
     * Update the hospital profile owned by an auth user.
     */
    HospitalResponse updateProfile(Long userId, HospitalProfileRequest request);

    /**
     * Fetch the profile owned by an auth user (404 when it does not exist).
     */
    HospitalResponse getProfileByUserId(Long userId);

    /**
     * Profile completion status for the auth flow — "INCOMPLETE" when no
     * profile exists, otherwise the hospital status name.
     */
    String getProfileStatus(Long userId);

    /**
     * List all hospitals (admin view, includes every status).
     */
    List<HospitalResponse> getAllHospitalsAdmin();

    /**
     * Change a hospital's lifecycle status (approve / suspend / activate /
     * reject). Keeps the legacy {@code active} flag in sync with the status.
     */
    HospitalResponse updateStatus(Long id, HospitalStatus status);

    /**
     * Search hospitals by free-text (name / city / address / type / facilities).
     * Only returns hospitals that are publicly visible.
     */
    List<HospitalResponse> searchHospitals(String q, String city, String type);

    // ─────────── Hospital image operations ───────────

    /**
     * Add one image to a hospital. Maximum 10 images per hospital.
     */
    HospitalImageResponse addImage(Long hospitalId, String imageUrl, Long requesterUserId, boolean isAdmin);

    /**
     * Replace an existing image.
     */
    HospitalImageResponse replaceImage(Long imageId, String imageUrl, Long requesterUserId, boolean isAdmin);

    /**
     * Remove an image. When the cover image is removed, the cover falls back
     * to the first remaining image.
     */
    void deleteImage(Long imageId, Long requesterUserId, boolean isAdmin);

    /**
     * Reorder a hospital's images by the given ordered ids.
     */
    List<HospitalImageResponse> reorderImages(Long hospitalId, List<Long> orderedIds, Long requesterUserId, boolean isAdmin);

    /**
     * Delete all images belonging to a hospital (used when deleting the hospital).
     */
    void deleteImagesByHospital(Long hospitalId);
}
