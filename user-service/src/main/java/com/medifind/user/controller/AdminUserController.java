package com.medifind.user.controller;

import com.medifind.user.dto.UserResponse;
import com.medifind.user.entity.User;
import com.medifind.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin-only user management. Never exposes passwords or auth tokens.
 * All methods require ROLE_ADMIN (enforced at the security layer too).
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    /**
     * List users, optionally filtered by role, free-text search and status.
     * @param role    filter by role (default PATIENT)
     * @param search  case-insensitive match on name / email / phone
     * @param status  filter by account status (ACTIVE / SUSPENDED)
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> listUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {

        String targetRole = (role == null || role.isBlank()) ? "PATIENT" : role.toUpperCase(Locale.ENGLISH);
        String query = search == null ? "" : search.trim().toLowerCase(Locale.ENGLISH);
        String targetStatus = status == null ? null : status.toUpperCase(Locale.ENGLISH);

        List<UserResponse> users = userRepository.findAll().stream()
                .filter(u -> targetRole == null || targetRole.isBlank() || targetRole.equalsIgnoreCase(u.getRole()))
                .filter(u -> targetStatus == null || targetStatus.equalsIgnoreCase(u.getStatus()))
                .filter(u -> query.isEmpty()
                        || (u.getFullName() != null && u.getFullName().toLowerCase(Locale.ENGLISH).contains(query))
                        || (u.getEmail() != null && u.getEmail().toLowerCase(Locale.ENGLISH).contains(query))
                        || (u.getPhone() != null && u.getPhone().contains(query)))
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(mapToResponse(getUser(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @RequestBody com.medifind.user.dto.UserProfileUpdateRequest request) {

        User user = getUser(id);

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        if (request.getCity() != null) user.setCity(request.getCity());
        if (request.getState() != null) user.setState(request.getState());
        if (request.getPincode() != null) user.setPincode(request.getPincode());
        if (request.getProfileImage() != null) user.setProfileImage(request.getProfileImage());
        if (request.getEmergencyContactName() != null) user.setEmergencyContactName(request.getEmergencyContactName());
        if (request.getEmergencyContactPhone() != null) user.setEmergencyContactPhone(request.getEmergencyContactPhone());

        userRepository.save(user);
        return ResponseEntity.ok(mapToResponse(user));
    }

    /**
     * Permanently delete a user and their related records (doctor reviews and
     * hospital reviews live in the same medifind_db). Appointment and
     * notification records are owned by other microservices; the admin UI
     * calls their delete-by-user endpoints in the same operation.
     */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        User user = getUser(id);

        // Clean up review records referencing this user (same database).
        jdbcTemplate.update("DELETE FROM reviews WHERE user_id = ?", id);
        jdbcTemplate.update("DELETE FROM hospital_reviews WHERE patient_id = ?", id);

        userRepository.delete(user);
        return ResponseEntity.noContent().build();
    }

    /**
     * Activate or suspend a user account. Suspended users cannot log in.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {

        String status = payload.get("status");
        if (status == null || status.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required (ACTIVE or SUSPENDED)");
        }
        String normalized = status.toUpperCase(Locale.ENGLISH);
        if (!normalized.equals("ACTIVE") && !normalized.equals("SUSPENDED")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status must be ACTIVE or SUSPENDED");
        }

        User user = getUser(id);
        user.setStatus(normalized);
        userRepository.save(user);
        return ResponseEntity.ok(mapToResponse(user));
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .phone(user.getPhone())
                .gender(user.getGender())
                .dateOfBirth(user.getDateOfBirth() != null ? user.getDateOfBirth().toString() : null)
                .address(user.getAddress())
                .city(user.getCity())
                .state(user.getState())
                .pincode(user.getPincode())
                .profileImage(user.getProfileImage())
                .emergencyContactName(user.getEmergencyContactName())
                .emergencyContactPhone(user.getEmergencyContactPhone())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
