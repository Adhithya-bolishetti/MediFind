package com.medifind.notification.service;

import com.medifind.notification.dto.NotificationRequest;
import com.medifind.notification.dto.NotificationResponse;

import java.util.List;

public interface NotificationService {
    NotificationResponse createNotification(NotificationRequest request);
    List<NotificationResponse> getUserNotifications(Long userId);
    List<NotificationResponse> getUnreadUserNotifications(Long userId);
    NotificationResponse markAsRead(Long id, Long userId);
    void deleteNotification(Long id, Long userId);
}
