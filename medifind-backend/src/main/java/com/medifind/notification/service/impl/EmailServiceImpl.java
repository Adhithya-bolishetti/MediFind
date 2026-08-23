package com.medifind.notification.service.impl;

import com.medifind.notification.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Override
    public void sendEmail(String to, String subject, String body) {
        log.info("Email sending disabled.");
    }

    @Override
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        log.info("Email sending disabled.");
    }
    
    @Override
    public void sendOtpEmail(String to, String otp, String purpose) {
        log.info("Email sending disabled.");
    }
    
    @Async
    @Override
    public void sendAppointmentStatusEmail(String to, String appointmentId, String patientName, String doctorName, String date, String time, String status) {
        log.info("Email sending disabled.");
    }
    
    @Override
    public String sendTestEmail(String to) {
        log.info("Email sending disabled.");
        return "mock-id-12345";
    }
}
