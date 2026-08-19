package com.medifind.notification.service.impl;

import com.medifind.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;

import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.Async;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final TemplateEngine templateEngine;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.from-email:onboarding@resend.dev}")
    private String fromEmail;

    private Resend resend;

    @PostConstruct
    public void init() {
        this.resend = new Resend(resendApiKey);
    }

    @Async
    @Override
    public void sendEmail(String to, String subject, String body) {
        if (!mailEnabled) {
            log.info("Email disabled. Mock sending to {}: Subject: {}, Body: {}", to, subject, body);
            return;
        }

        CreateEmailOptions sendEmailRequest = CreateEmailOptions.builder()
                .from(fromEmail)
                .to(to)
                .subject(subject)
                .text(body)
                .build();

        try {
            CreateEmailResponse data = resend.emails().send(sendEmailRequest);
            log.info("Email sent successfully to {}, Resend ID: {}", to, data.getId());
        } catch (ResendException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    @Async
    @Override
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        if (!mailEnabled) {
            log.info("Email disabled. Mock sending HTML email to {}: Subject: {}", to, subject);
            return;
        }

        CreateEmailOptions sendEmailRequest = CreateEmailOptions.builder()
                .from(fromEmail)
                .to(to)
                .subject(subject)
                .html(htmlBody)
                .build();

        try {
            CreateEmailResponse data = resend.emails().send(sendEmailRequest);
            log.info("Email sent successfully to {}, Resend ID: {}", to, data.getId());
        } catch (ResendException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
    
    @Async
    @Override
    public void sendOtpEmail(String to, String otp, String purpose) {
        Context context = new Context();
        context.setVariable("otp", otp);
        
        String subject = "MediFind - Your Verification Code";
        String template = "otp"; // default
        
        if ("PASSWORD_RESET".equals(purpose)) {
            subject = "MediFind - Password Reset Code";
            context.setVariable("purpose", "resetting your password");
        } else if ("EMAIL_VERIFICATION".equals(purpose)) {
            subject = "MediFind - Verify Your Email";
            context.setVariable("purpose", "verifying your email address");
        } else {
            context.setVariable("purpose", "verifying your account");
        }
        
        String htmlBody = templateEngine.process("email/" + template, context);
        sendHtmlEmail(to, subject, htmlBody);
    }
    
    @Async
    @Override
    public void sendAppointmentStatusEmail(String to, String appointmentId, String patientName, String doctorName, String date, String time, String status) {
        Context context = new Context();
        context.setVariable("appointmentId", appointmentId);
        context.setVariable("patientName", patientName);
        context.setVariable("doctorName", doctorName);
        context.setVariable("date", date);
        context.setVariable("time", time);
        context.setVariable("status", status);
        
        String subject = "MediFind - Appointment " + status;
        String htmlBody = templateEngine.process("email/appointment", context);
        
        sendHtmlEmail(to, subject, htmlBody);
    }
}
