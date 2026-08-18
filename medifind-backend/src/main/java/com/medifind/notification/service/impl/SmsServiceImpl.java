package com.medifind.notification.service.impl;

import com.medifind.notification.service.SmsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class SmsServiceImpl implements SmsService {

    @Value("${app.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${app.sms.provider:mock}")
    private String smsProvider;

    @Override
    public void sendSms(String phoneNumber, String message) {
        if (!smsEnabled || "mock".equalsIgnoreCase(smsProvider)) {
            log.info("SMS disabled or mock provider. Mock sending to {}: Message: {}", phoneNumber, message);
            return;
        }

        // Logic for Twilio or other provider would go here
        log.info("Sending SMS via {} to {}: {}", smsProvider, phoneNumber, message);
    }
}
