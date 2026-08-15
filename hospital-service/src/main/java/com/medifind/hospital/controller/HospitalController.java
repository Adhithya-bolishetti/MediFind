package com.medifind.hospital.controller;

import com.medifind.hospital.dto.HospitalRequest;
import com.medifind.hospital.dto.HospitalResponse;
import com.medifind.hospital.service.HospitalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller exposing Hospital CRUD endpoints.
 *
 * <ul>
 *   <li>ADMIN → full read/write access</li>
 *   <li>USER  → read-only access</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/hospitals")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Hospital", description = "Hospital Management APIs")
@SecurityRequirement(name = "bearerAuth")
public class HospitalController {

    private final HospitalService hospitalService;

    /**
     * Create a new hospital. ADMIN only.
     */
    @Operation(summary = "Create a new hospital", description = "Requires ADMIN role")
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<HospitalResponse> createHospital(@Valid @RequestBody HospitalRequest request) {
        log.info("POST /api/hospitals — creating hospital: {}", request.getHospitalName());
        return new ResponseEntity<>(hospitalService.createHospital(request), HttpStatus.CREATED);
    }

    /**
     * Retrieve all hospitals. Accessible by any authenticated user.
     */
    @Operation(summary = "Get all hospitals")
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<HospitalResponse>> getAllHospitals() {
        return ResponseEntity.ok(hospitalService.getAllHospitals());
    }

    /**
     * Retrieve a hospital by ID. Accessible by any authenticated user.
     */
    @Operation(summary = "Get hospital by ID")
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<HospitalResponse> getHospitalById(@PathVariable Long id) {
        return ResponseEntity.ok(hospitalService.getHospitalById(id));
    }

    /**
     * Update an existing hospital. ADMIN only.
     */
    @Operation(summary = "Update a hospital", description = "Requires ADMIN role")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<HospitalResponse> updateHospital(
            @PathVariable Long id,
            @Valid @RequestBody HospitalRequest request) {
        log.info("PUT /api/hospitals/{} — updating hospital", id);
        return ResponseEntity.ok(hospitalService.updateHospital(id, request));
    }

    /**
     * Delete a hospital. ADMIN only.
     */
    @Operation(summary = "Delete a hospital", description = "Requires ADMIN role")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteHospital(@PathVariable Long id) {
        log.info("DELETE /api/hospitals/{} — deleting hospital", id);
        hospitalService.deleteHospital(id);
        return ResponseEntity.noContent().build();
    }
}
