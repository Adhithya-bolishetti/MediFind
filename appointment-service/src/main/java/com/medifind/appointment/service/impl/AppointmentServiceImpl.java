package com.medifind.appointment.service.impl;

import com.medifind.appointment.client.DoctorClient;
import com.medifind.appointment.client.UserClient;
import com.medifind.appointment.client.NotificationClient;
import com.medifind.appointment.dto.*;
import com.medifind.appointment.entity.Appointment;
import com.medifind.appointment.entity.AppointmentStatus;
import com.medifind.appointment.repository.AppointmentRepository;
import com.medifind.appointment.service.AppointmentService;
import com.medifind.appointment.util.AvailabilityUtils;
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

        // Never allow booking a time that has already passed today.
        if (request.getAppointmentDate().equals(LocalDate.now())
                && request.getAppointmentTime().isBefore(LocalTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Appointment time has already passed for today");
        }

        // Validate doctor availability (working hours + working days)
        DoctorAvailabilityResponse availability = doctorClient.getDoctorAvailability(request.getDoctorId());
        if (availability == null || !availability.isAvailable()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor is not available");
        }

        validateWorkingDay(availability, request.getAppointmentDate());
        validateSlotAlignment(availability, request.getAppointmentTime());

        // Serialize the check-and-insert to prevent double booking within this service instance.
        synchronized (this) {
            List<Appointment> existing = appointmentRepository
                    .findByDoctorIdAndAppointmentDate(request.getDoctorId(), request.getAppointmentDate());
            boolean isBooked = existing.stream()
                .anyMatch(a -> a.getAppointmentTime().equals(request.getAppointmentTime()) &&
                               a.getStatus() != AppointmentStatus.CANCELLED &&
                               a.getStatus() != AppointmentStatus.DECLINED &&
                               a.getStatus() != AppointmentStatus.REJECTED);
            if (isBooked) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Appointment slot is no longer available");
            }

            Appointment appointment = Appointment.builder()
                    .userId(userId)
                    .doctorId(request.getDoctorId())
                    .appointmentDate(request.getAppointmentDate())
                    .appointmentTime(request.getAppointmentTime())
                    .reason(request.getReason())
                    .consultationType(request.getConsultationType() != null && !request.getConsultationType().isBlank()
                            ? request.getConsultationType() : "In-person")
                    .status(AppointmentStatus.PENDING)
                    .build();

            appointment = appointmentRepository.save(appointment);

            sendNotification(userId, "APPOINTMENT_BOOKED", "Appointment Booked",
                    "Your appointment has been booked successfully for " + request.getAppointmentDate() + " at " + request.getAppointmentTime());

            return mapToResponse(appointment);
        }
    }

    /**
     * Rejects booking when the doctor has configured working days and the
     * requested date does not fall on one of them. Handles full names,
     * abbreviations and legacy ranges like "Mon-Sat".
     */
    private void validateWorkingDay(DoctorAvailabilityResponse availability, LocalDate date) {
        if (!AvailabilityUtils.isWorkingDay(availability.getWorkingDays(), date.getDayOfWeek())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Doctor is not available on " + date.getDayOfWeek().name().charAt(0)
                            + date.getDayOfWeek().name().substring(1).toLowerCase(java.util.Locale.ENGLISH) + "s");
        }
    }

    /**
     * Rejects appointment times that do not fall exactly on one of the doctor's
     * generated slots (start time stepped by the appointment duration). Times
     * may be 24h or 12h formats.
     */
    private void validateSlotAlignment(DoctorAvailabilityResponse availability, LocalTime requestedTime) {
        LocalTime[] hours = AvailabilityUtils.resolveConsultationHours(
                availability.getConsultationStartTime(), availability.getConsultationEndTime());
        LocalTime start = hours[0];
        LocalTime end = hours[1];
        if (start == null || end == null || !start.isBefore(end)) {
            return; // Doctor hasn't configured valid hours — keep legacy behavior
        }
        int duration = availability.getAppointmentDuration() != null && availability.getAppointmentDuration() > 0
                ? availability.getAppointmentDuration() : 30;

        boolean aligned = false;
        LocalTime slot = start;
        while (slot.plusMinutes(duration).isBefore(end) || slot.plusMinutes(duration).equals(end)) {
            if (slot.equals(requestedTime)) {
                aligned = true;
                break;
            }
            slot = slot.plusMinutes(duration);
        }
        if (!aligned) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Appointment time must be within the doctor's available slots");
        }
    }

    @Override
    public AppointmentResponse getAppointmentById(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));
        return mapToResponse(appointment);
    }

    @Override
    public List<AppointmentResponse> getAllAppointments(String status, String date) {
        return appointmentRepository.findAll().stream()
                .filter(a -> status == null || status.isBlank() || a.getStatus().name().equalsIgnoreCase(status))
                .filter(a -> date == null || date.isBlank() || a.getAppointmentDate().toString().equals(date))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AppointmentResponse cancelAppointmentAsAdmin(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed appointments cannot be cancelled");
        }
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment = appointmentRepository.save(appointment);
        sendNotification(appointment.getUserId(), "APPOINTMENT_CANCELLED", "Appointment Cancelled",
                "Your appointment scheduled for " + appointment.getAppointmentDate() + " has been cancelled by the administrator.");
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

        verifyDoctorOwnership(appointment, doctorId);

        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only pending appointments can be accepted");
        }

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment = appointmentRepository.save(appointment);

        sendNotification(appointment.getUserId(), "APPOINTMENT_CONFIRMED", "Appointment Confirmed",
                "Your appointment scheduled for " + appointment.getAppointmentDate() + " has been confirmed.");

        return mapToResponse(appointment);
    }

    @Override
    public AppointmentResponse declineAppointment(Long id, Long doctorId) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));

        verifyDoctorOwnership(appointment, doctorId);

        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only pending appointments can be declined");
        }

        appointment.setStatus(AppointmentStatus.DECLINED);
        appointment = appointmentRepository.save(appointment);

        sendNotification(appointment.getUserId(), "APPOINTMENT_DECLINED", "Appointment Declined",
                "Your appointment scheduled for " + appointment.getAppointmentDate() + " was declined by the doctor.");

        return mapToResponse(appointment);
    }

    private void verifyDoctorOwnership(Appointment appointment, Long doctorId) {
        if (doctorId == null || !appointment.getDoctorId().equals(doctorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This appointment does not belong to you");
        }
    }

    @Override
    public AppointmentResponse completeAppointment(Long id, Long doctorId) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));

        verifyDoctorOwnership(appointment, doctorId);

        // Only accepted (CONFIRMED) appointments may be marked as completed.
        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only accepted appointments can be marked as completed");
        }

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
    public void deleteAppointmentsByUser(Long userId) {
        appointmentRepository.deleteAll(appointmentRepository.findByUserId(userId));
    }

    @Override
    public void deleteAppointmentsByDoctor(Long doctorId) {
        appointmentRepository.deleteAll(appointmentRepository.findByDoctorId(doctorId));
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
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED
                        && a.getStatus() != AppointmentStatus.DECLINED
                        && a.getStatus() != AppointmentStatus.REJECTED)
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
                .consultationType(appointment.getConsultationType())
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
