package com.medifind.notification.controller;

import com.medifind.notification.client.UserClient;
import com.medifind.notification.dto.NotificationRequest;
import com.medifind.notification.dto.NotificationResponse;
import com.medifind.notification.dto.UserResponse;
import com.medifind.notification.entity.NotificationType;
import com.medifind.notification.service.NotificationService;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * Admin-only notification management — protected by {@code AdminAuthFilter}.
 * Sends a notification to a single user or broadcasts to an entire role.
 */
@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
public class AdminNotificationController {

    private final NotificationService notificationService;
    private final UserClient userClient;

    @Data
    public static class SendRequest {
        @NotBlank
        private String title;
        @NotBlank
        private String message;
        private Long userId;
        /** PATIENT | DOCTOR | ALL */
        private String recipient;
    }

    @PostMapping
    public ResponseEntity<NotificationResponse> sendToUser(@RequestBody SendRequest request) {
        if (request.getUserId() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "userId is required");
        }
        NotificationResponse created = notificationService.createNotification(NotificationRequest.builder()
                .userId(request.getUserId())
                .type(NotificationType.GENERAL)
                .title(request.getTitle())
                .message(request.getMessage())
                .build());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /**
     * Delete every notification belonging to a user (used when an admin
     * permanently deletes a patient or doctor account).
     */
    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> deleteByUser(@PathVariable Long userId) {
        notificationService.deleteNotificationsByUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/broadcast")
    public ResponseEntity<List<NotificationResponse>> broadcast(@RequestBody SendRequest request) {
        String recipient = request.getRecipient() == null ? "ALL" : request.getRecipient().toUpperCase(Locale.ENGLISH);

        List<UserResponse> targets;
        if ("PATIENT".equals(recipient)) {
            targets = userClient.getUsersByRole("PATIENT");
        } else if ("DOCTOR".equals(recipient)) {
            targets = userClient.getUsersByRole("DOCTOR");
        } else {
            targets = userClient.getUsersByRole("ALL");
        }

        List<NotificationResponse> created = targets.stream()
                .filter(u -> u.getStatus() == null || "ACTIVE".equalsIgnoreCase(u.getStatus()))
                .map(u -> notificationService.createNotification(NotificationRequest.builder()
                        .userId(u.getId())
                        .type(NotificationType.GENERAL)
                        .title(request.getTitle())
                        .message(request.getMessage())
                        .build()))
                .collect(Collectors.toList());

        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }
}
