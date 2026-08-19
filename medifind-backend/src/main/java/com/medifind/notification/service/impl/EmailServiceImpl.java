package com.medifind.notification.service.impl;

import com.medifind.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;

import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.Async;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final TemplateEngine templateEngine;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${sendgrid.api-key:}")
    private String sendGridApiKey;

    @Value("${sendgrid.from-email:adhithyabolishetti24@gmail.com}")
    private String fromEmail;

    private SendGrid sendGrid;

    @PostConstruct
    public void init() {
        this.sendGrid = new SendGrid(sendGridApiKey);
    }

    @Async
    @Override
    public void sendEmail(String to, String subject, String body) {
        if (!mailEnabled) {
            log.info("Email disabled. Mock sending to {}: Subject: {}, Body: {}", to, subject, body);
            return;
        }

        Email from = new Email(fromEmail);
        Email toEmail = new Email(to);
        Content content = new Content("text/plain", body);
        Mail mail = new Mail(from, subject, toEmail, content);

        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sendGrid.api(request);
            
            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("Email sent successfully to {}, SendGrid Status: {}", to, response.getStatusCode());
            } else {
                log.error("Failed to send email to {}: SendGrid Status {}, Body: {}", to, response.getStatusCode(), response.getBody());
            }
        } catch (IOException ex) {
            log.error("Failed to send email to {}: {}", to, ex.getMessage());
        }
    }

    @Async
    @Override
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        if (!mailEnabled) {
            log.info("Email disabled. Mock sending HTML email to {}: Subject: {}", to, subject);
            return;
        }

        Email from = new Email(fromEmail);
        Email toEmail = new Email(to);
        Content content = new Content("text/html", htmlBody);
        Mail mail = new Mail(from, subject, toEmail, content);

        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sendGrid.api(request);
            
            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                log.info("Email sent successfully to {}, SendGrid Status: {}", to, response.getStatusCode());
            } else {
                log.error("Failed to send email to {}: SendGrid Status {}, Body: {}", to, response.getStatusCode(), response.getBody());
            }
        } catch (IOException ex) {
            log.error("Failed to send HTML email to {}: {}", to, ex.getMessage());
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
