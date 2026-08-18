package com.medifind.notification.service;

public interface SmsService {
    void sendSms(String phoneNumber, String message);
}
