package com.medifind.notification.controller;

import com.medifind.notification.dto.NotificationRequest;
import com.medifind.notification.dto.NotificationResponse;
import com.medifind.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "Create a notification")
    @PostMapping
    public ResponseEntity<NotificationResponse> createNotification(@Valid @RequestBody NotificationRequest request) {
        return new ResponseEntity<>(notificationService.createNotification(request), HttpStatus.CREATED);
    }

    @Operation(summary = "Get all notifications for a user")
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getUserNotifications(
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) userId = 1L; // For testing if header is missing
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @Operation(summary = "Get unread notifications for a user")
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadUserNotifications(
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) userId = 1L;
        return ResponseEntity.ok(notificationService.getUnreadUserNotifications(userId));
    }

    @Operation(summary = "Mark a notification as read")
    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long id,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) userId = 1L;
        return ResponseEntity.ok(notificationService.markAsRead(id, userId));
    }

    @Operation(summary = "Delete a notification")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) userId = 1L;
        notificationService.deleteNotification(id, userId);
        return ResponseEntity.noContent().build();
    }

    // Day 6: Email and SMS Endpoints
    @PostMapping("/email")
    public ResponseEntity<Void> sendEmail(@RequestBody com.medifind.notification.dto.SendEmailRequest request) {
        // We inject the services here, or we can use the notificationService facade.
        // For simplicity, let's just assume we have it or update the constructor.
        // Actually, we should update NotificationService interface and implementation.
        notificationService.sendSystemEmail(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sms")
    public ResponseEntity<Void> sendSms(@RequestBody com.medifind.notification.dto.SendSmsRequest request) {
        notificationService.sendSystemSms(request);
        return ResponseEntity.ok().build();
    }
}
