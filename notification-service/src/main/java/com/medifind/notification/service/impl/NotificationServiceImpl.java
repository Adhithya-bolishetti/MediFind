package com.medifind.notification.service.impl;

import com.medifind.notification.dto.NotificationRequest;
import com.medifind.notification.dto.NotificationResponse;
import com.medifind.notification.entity.Notification;
import com.medifind.notification.repository.NotificationRepository;
import com.medifind.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final com.medifind.notification.service.EmailService emailService;
    private final com.medifind.notification.service.SmsService smsService;
    private final com.medifind.notification.repository.NotificationLogRepository notificationLogRepository;

    @Override
    @Transactional
    public NotificationResponse createNotification(NotificationRequest request) {
        log.info("Creating notification for user: {}", request.getUserId());
        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .type(request.getType())
                .title(request.getTitle())
                .message(request.getMessage())
                .read(false)
                .build();
        notification = notificationRepository.save(notification);
        return mapToResponse(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadUserNotifications(Long userId) {
        return notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        
        if (!notification.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to modify this notification");
        }
        
        notification.setRead(true);
        notification = notificationRepository.save(notification);
        return mapToResponse(notification);
    }

    @Override
    @Transactional
    public void deleteNotification(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        
        if (!notification.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to delete this notification");
        }
        
        notificationRepository.delete(notification);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    // Day 6: System Notifications
    @Override
    public void sendSystemEmail(com.medifind.notification.dto.SendEmailRequest request) {
        com.medifind.notification.entity.NotificationLog logEntry = com.medifind.notification.entity.NotificationLog.builder()
                .recipient(request.getTo())
                .type("EMAIL")
                .subject(request.getSubject())
                .content(request.getBody())
                .status(com.medifind.notification.entity.NotificationStatus.PENDING)
                .build();
        
        logEntry = notificationLogRepository.save(logEntry);
        
        try {
            if (request.isHtml()) {
                emailService.sendHtmlEmail(request.getTo(), request.getSubject(), request.getBody());
            } else {
                emailService.sendEmail(request.getTo(), request.getSubject(), request.getBody());
            }
            logEntry.setStatus(com.medifind.notification.entity.NotificationStatus.SENT);
        } catch (Exception e) {
            logEntry.setStatus(com.medifind.notification.entity.NotificationStatus.FAILED);
            logEntry.setErrorMessage(e.getMessage());
            log.error("Failed to send system email to {}", request.getTo(), e);
        } finally {
            notificationLogRepository.save(logEntry);
        }
    }

    @Override
    public void sendSystemSms(com.medifind.notification.dto.SendSmsRequest request) {
        com.medifind.notification.entity.NotificationLog logEntry = com.medifind.notification.entity.NotificationLog.builder()
                .recipient(request.getPhoneNumber())
                .type("SMS")
                .subject("SMS Notification") // Default subject for SMS log
                .content(request.getMessage())
                .status(com.medifind.notification.entity.NotificationStatus.PENDING)
                .build();
        
        logEntry = notificationLogRepository.save(logEntry);
        
        try {
            smsService.sendSms(request.getPhoneNumber(), request.getMessage());
            logEntry.setStatus(com.medifind.notification.entity.NotificationStatus.SENT);
        } catch (Exception e) {
            logEntry.setStatus(com.medifind.notification.entity.NotificationStatus.FAILED);
            logEntry.setErrorMessage(e.getMessage());
            log.error("Failed to send system SMS to {}", request.getPhoneNumber(), e);
        } finally {
            notificationLogRepository.save(logEntry);
        }
    }
}
