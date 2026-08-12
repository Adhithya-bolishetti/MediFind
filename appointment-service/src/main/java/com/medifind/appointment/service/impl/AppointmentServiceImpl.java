package com.medifind.appointment.service.impl;

import com.medifind.appointment.client.DoctorClient;
import com.medifind.appointment.client.UserClient;
import com.medifind.appointment.client.NotificationClient;
import com.medifind.appointment.dto.*;
import com.medifind.appointment.entity.Appointment;
import com.medifind.appointment.entity.AppointmentStatus;
import com.medifind.appointment.repository.AppointmentRepository;
import com.medifind.appointment.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorClient doctorClient;
    private final UserClient userClient;
    private final NotificationClient notificationClient;

    @Override
    public AppointmentResponse createAppointment(AppointmentRequest request, Long userId) {
        if (request.getAppointmentDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Appointment date cannot be in the past");
        }

        // Validate doctor availability
        DoctorAvailabilityResponse availability = doctorClient.getDoctorAvailability(request.getDoctorId());
        if (availability == null || !availability.isAvailable()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor is not available");
        }
        
        // Basic check for time boundaries
        if (availability.getConsultationStartTime() != null && availability.getConsultationEndTime() != null) {
            LocalTime start = LocalTime.parse(availability.getConsultationStartTime());
            LocalTime end = LocalTime.parse(availability.getConsultationEndTime());
            if (request.getAppointmentTime().isBefore(start) || request.getAppointmentTime().isAfter(end)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Appointment time outside doctor's consultation hours");
            }
        }

        // Check if doctor is already booked for this date and time
        boolean exists = appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTime(
                request.getDoctorId(), request.getAppointmentDate(), request.getAppointmentTime()
        );
        if (exists) {
            // Need to check status of existing? Let's assume any existing non-cancelled means booked.
            // A more complex implementation would filter out cancelled ones, but we'll stick to a simple check here,
            // or query by status as well. We'll improve this if needed. Let's do a strict check:
            List<Appointment> existing = appointmentRepository.findByDoctorIdAndAppointmentDate(request.getDoctorId(), request.getAppointmentDate());
            boolean isBooked = existing.stream()
                .anyMatch(a -> a.getAppointmentTime().equals(request.getAppointmentTime()) &&
                               a.getStatus() != AppointmentStatus.CANCELLED &&
                               a.getStatus() != AppointmentStatus.REJECTED);
            if (isBooked) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Doctor is already booked for this time");
            }
        }

        Appointment appointment = Appointment.builder()
                .userId(userId)
                .doctorId(request.getDoctorId())
                .appointmentDate(request.getAppointmentDate())
                .appointmentTime(request.getAppointmentTime())
                .reason(request.getReason())
                .status(AppointmentStatus.PENDING)
                .build();

        appointment = appointmentRepository.save(appointment);

        sendNotification(userId, "APPOINTMENT_BOOKED", "Appointment Booked",
                "Your appointment has been booked successfully for " + request.getAppointmentDate() + " at " + request.getAppointmentTime());

        return mapToResponse(appointment);
    }

    @Override
    public AppointmentResponse getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));
        return mapToResponse(appointment);
    }

    @Override
    public List<AppointmentResponse> getUserAppointments(Long userId) {
        return appointmentRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<AppointmentResponse> getDoctorAppointments(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AppointmentResponse cancelAppointment(Long id, Long userId) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));

        if (!appointment.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the patient can cancel this appointment");
        }

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed appointments cannot be cancelled");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment = appointmentRepository.save(appointment);

        sendNotification(userId, "APPOINTMENT_CANCELLED", "Appointment Cancelled",
                "Your appointment scheduled for " + appointment.getAppointmentDate() + " has been cancelled.");

        return mapToResponse(appointment);
    }

    @Override
    public AppointmentResponse confirmAppointment(Long id, Long doctorId) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cancelled appointments cannot be confirmed");
        }

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment = appointmentRepository.save(appointment);

        sendNotification(appointment.getUserId(), "APPOINTMENT_CONFIRMED", "Appointment Confirmed",
                "Your appointment scheduled for " + appointment.getAppointmentDate() + " has been confirmed.");

        return mapToResponse(appointment);
    }

    @Override
    public AppointmentResponse completeAppointment(Long id, Long doctorId) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));

        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment = appointmentRepository.save(appointment);

        sendNotification(appointment.getUserId(), "APPOINTMENT_COMPLETED", "Appointment Completed",
                "Your appointment scheduled for " + appointment.getAppointmentDate() + " has been marked as completed.");

        return mapToResponse(appointment);
    }

    @Override
    public void deleteAppointment(Long id) {
        appointmentRepository.deleteById(id);
    }

    @Override
    public boolean hasCompletedAppointment(Long doctorId, Long userId) {
        return appointmentRepository.existsByDoctorIdAndUserIdAndStatus(doctorId, userId, AppointmentStatus.COMPLETED);
    }

    @Override
    public List<String> getBookedSlots(Long doctorId, String date) {
        LocalDate localDate = LocalDate.parse(date);
        List<Appointment> appointments = appointmentRepository.findByDoctorIdAndAppointmentDate(doctorId, localDate);
        
        return appointments.stream()
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED && a.getStatus() != AppointmentStatus.REJECTED)
                .map(a -> a.getAppointmentTime().format(DateTimeFormatter.ofPattern("HH:mm")))
                .collect(Collectors.toList());
    }

    private AppointmentResponse mapToResponse(Appointment appointment) {
        UserResponse user = null;
        DoctorResponse doctor = null;

        try {
            user = userClient.getUserById(appointment.getUserId());
        } catch (Exception e) {
            // Ignore or log
        }

        try {
            doctor = doctorClient.getDoctorById(appointment.getDoctorId());
        } catch (Exception e) {
            // Ignore or log
        }

        return AppointmentResponse.builder()
                .id(appointment.getId())
                .userId(appointment.getUserId())
                .user(user)
                .doctorId(appointment.getDoctorId())
                .doctor(doctor)
                .appointmentDate(appointment.getAppointmentDate())
                .appointmentTime(appointment.getAppointmentTime())
                .reason(appointment.getReason())
                .status(appointment.getStatus())
                .notes(appointment.getNotes())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .build();
    }

    private void sendNotification(Long userId, String type, String title, String message) {
        try {
            // 1. Send In-App Notification
            NotificationRequest request = NotificationRequest.builder()
                    .userId(userId)
                    .type(type)
                    .title(title)
                    .message(message)
                    .build();
            notificationClient.createNotification(request, "Bearer system_token");

            // 2. Fetch User to get Email
            UserResponse user = userClient.getUserById(userId);
            if (user != null && user.getEmail() != null) {
                java.util.Map<String, Object> emailRequest = new java.util.HashMap<>();
                emailRequest.put("to", user.getEmail());
                emailRequest.put("subject", title);
                emailRequest.put("body", message);
                emailRequest.put("isHtml", false);
                notificationClient.sendEmail(emailRequest, "Bearer system_token");
            }
        } catch (Exception e) {
            System.err.println("Failed to send notification: " + e.getMessage());
        }
    }
}
