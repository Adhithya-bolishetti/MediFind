package com.medifind.hospital.controller;

import com.medifind.hospital.dto.*;
import com.medifind.hospital.service.HospitalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Self-service endpoints for hospital owners. Ownership is enforced in the
 * service layer using the authenticated user id (X-User-Id) from the JWT.
 */
@RestController
@RequestMapping("/api/hospitals")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Hospital Profile", description = "Hospital-owner profile & image APIs")
public class HospitalProfileController {

    private final HospitalService hospitalService;

    @Operation(summary = "Create the logged-in hospital's profile")
    @PostMapping("/profile")
    public ResponseEntity<HospitalResponse> createProfile(
            @Valid @RequestBody HospitalProfileRequest request,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return new ResponseEntity<>(hospitalService.createProfile(userId, request), HttpStatus.CREATED);
    }

    @Operation(summary = "Get the logged-in hospital's profile")
    @GetMapping("/profile/me")
    public ResponseEntity<HospitalResponse> getMyProfile(
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(hospitalService.getProfileByUserId(userId));
    }

    @Operation(summary = "Update the logged-in hospital's profile")
    @PutMapping("/profile/me")
    public ResponseEntity<HospitalResponse> updateMyProfile(
            @Valid @RequestBody HospitalProfileRequest request,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(hospitalService.updateProfile(userId, request));
    }

    @Operation(summary = "Profile completion status used by the auth flow")
    @GetMapping("/profile/status")
    public ResponseEntity<String> getProfileStatus(
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(hospitalService.getProfileStatus(userId));
    }

    // ─────────── Images ───────────

    @Operation(summary = "Add an image (max 10 per hospital)")
    @PostMapping("/{hospitalId}/images")
    public ResponseEntity<HospitalImageResponse> addImage(
            @PathVariable Long hospitalId,
            @Valid @RequestBody HospitalImageRequest request,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "USER") String role) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        return new ResponseEntity<>(hospitalService.addImage(hospitalId, request.getImageUrl(), userId, isAdmin), HttpStatus.CREATED);
    }

    @Operation(summary = "Replace an image")
    @PutMapping("/images/{imageId}")
    public ResponseEntity<HospitalImageResponse> replaceImage(
            @PathVariable Long imageId,
            @Valid @RequestBody HospitalImageRequest request,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "USER") String role) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        return ResponseEntity.ok(hospitalService.replaceImage(imageId, request.getImageUrl(), userId, isAdmin));
    }

    @Operation(summary = "Delete an image")
    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<Void> deleteImage(
            @PathVariable Long imageId,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "USER") String role) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        hospitalService.deleteImage(imageId, userId, isAdmin);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Reorder a hospital's images")
    @PutMapping("/{hospitalId}/images/reorder")
    public ResponseEntity<List<HospitalImageResponse>> reorderImages(
            @PathVariable Long hospitalId,
            @RequestBody Map<String, List<Long>> payload,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "USER") String role) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        boolean isAdmin = "ADMIN".equalsIgnoreCase(role);
        List<Long> orderedIds = payload == null ? null : payload.get("orderedIds");
        return ResponseEntity.ok(hospitalService.reorderImages(hospitalId, orderedIds, userId, isAdmin));
    }
}
