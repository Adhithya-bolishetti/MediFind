package com.medifind.notification.service;

public interface EmailService {
    void sendEmail(String to, String subject, String body);
    void sendHtmlEmail(String to, String subject, String htmlBody);
    
    void sendOtpEmail(String to, String otp, String purpose);
    void sendAppointmentStatusEmail(String to, String appointmentId, String patientName, String doctorName, String date, String time, String status);
}
