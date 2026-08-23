package com.medifind.notification.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medifind.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.Async;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final TemplateEngine templateEngine;
    private final ObjectMapper objectMapper;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.from-email:noreply@medifind.com}")
    private String fromEmail;

    @Value("${resend.from-name:MediFind}")
    private String fromName;

    private HttpClient httpClient;

    @PostConstruct
    public void init() {
        if (mailEnabled && (resendApiKey == null || resendApiKey.isBlank())) {
            throw new IllegalStateException("RESEND_API_KEY missing");
        }
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .build();
    }

    private void sendResendEmail(String to, String subject, String htmlBody, String textBody) {
        if (!mailEnabled) {
            log.info("Email disabled. Mock sending to {}: Subject: {}", to, subject);
            return;
        }

        log.info("Sending email to {}", to);
        log.info("Subject: {}", subject);

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("from", fromName + " <" + fromEmail + ">");
            payload.put("to", List.of(to));
            payload.put("subject", subject);
            if (htmlBody != null) {
                payload.put("html", htmlBody);
            }
            if (textBody != null) {
                payload.put("text", textBody);
            }

            String requestBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Resend response: {}", response.body());
                log.info("Email sent successfully to {}", to);
            } else {
                log.error("Failed to send email to {}. Resend status: {}, response: {}", to, response.statusCode(), response.body());
                throw new RuntimeException("Resend API returned status " + response.statusCode() + ": " + response.body());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Resend API error", e);
            throw new RuntimeException("Email sending interrupted", e);
        } catch (Exception ex) {
            log.error("Resend API error", ex);
            throw new RuntimeException("Failed to send email to " + to, ex);
        }
    }

    @Override
    public void sendEmail(String to, String subject, String body) {
        sendResendEmail(to, subject, null, body);
    }

    @Override
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        sendResendEmail(to, subject, htmlBody, null);
    }
    
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
    
    @Override
    public String sendTestEmail(String to) {
        if (!mailEnabled) {
            return "mock-id-12345";
        }
        
        log.info("Sending test email to {}", to);
        String subject = "MediFind Test Email";
        String htmlBody = "<h1>Hello from MediFind!</h1><p>Your Resend integration is working.</p>";
        
        try {
            Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("from", fromName + " <" + fromEmail + ">");
            payload.put("to", List.of(to));
            payload.put("subject", subject);
            payload.put("html", htmlBody);

            String requestBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Resend response: {}", response.body());
                // Parse the message ID from the response if possible, otherwise return a generic ID
                try {
                    Map<String, Object> responseMap = objectMapper.readValue(response.body(), new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
                    return responseMap.containsKey("id") ? (String) responseMap.get("id") : "unknown-id";
                } catch (Exception e) {
                    return "unknown-id";
                }
            } else {
                log.error("Failed to send email to {}. Resend status: {}, response: {}", to, response.statusCode(), response.body());
                throw new RuntimeException("Resend API returned status " + response.statusCode() + ": " + response.body());
            }
        } catch (Exception ex) {
            log.error("Resend API error", ex);
            throw new RuntimeException("Failed to send test email to " + to, ex);
        }
    }
}
