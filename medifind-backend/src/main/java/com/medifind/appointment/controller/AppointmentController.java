package com.medifind.appointment.controller;

import com.medifind.appointment.dto.AppointmentRequest;
import com.medifind.appointment.dto.AppointmentResponse;
import com.medifind.appointment.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<AppointmentResponse> createAppointment(
            @Valid @RequestBody AppointmentRequest request,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) userId = 1L; // Fallback
        return new ResponseEntity<>(appointmentService.createAppointment(request, userId), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getAppointmentById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AppointmentResponse>> getUserAppointments(@PathVariable Long userId) {
        return ResponseEntity.ok(appointmentService.getUserAppointments(userId));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<AppointmentResponse>> getDoctorAppointments(@PathVariable Long doctorId) {
        return ResponseEntity.ok(appointmentService.getDoctorAppointments(doctorId));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponse> cancelAppointment(
            @PathVariable Long id,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) userId = 1L;
        return ResponseEntity.ok(appointmentService.cancelAppointment(id, userId));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<AppointmentResponse> confirmAppointment(
            @PathVariable Long id,
            @RequestParam(required = false) Long doctorId,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (doctorId == null) doctorId = userId; // fall back to auth user id
        if (doctorId == null) doctorId = 1L;
        return ResponseEntity.ok(appointmentService.confirmAppointment(id, doctorId));
    }

    @PutMapping("/{id}/decline")
    public ResponseEntity<AppointmentResponse> declineAppointment(
            @PathVariable Long id,
            @RequestParam(required = false) Long doctorId,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (doctorId == null) doctorId = userId; // fall back to auth user id
        if (doctorId == null) doctorId = 1L;
        return ResponseEntity.ok(appointmentService.declineAppointment(id, doctorId));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<AppointmentResponse> completeAppointment(
            @PathVariable Long id,
            @RequestParam(required = false) Long doctorId,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (doctorId == null) doctorId = userId; // fall back to auth user id
        if (doctorId == null) doctorId = 1L;
        return ResponseEntity.ok(appointmentService.completeAppointment(id, doctorId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }

    // Inter-service APIs (Internal)
    @GetMapping("/doctor/{doctorId}/has-completed")
    public ResponseEntity<Boolean> hasCompletedAppointment(
            @PathVariable Long doctorId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(appointmentService.hasCompletedAppointment(doctorId, userId));
    }
    
    @GetMapping("/doctor/{doctorId}/booked-slots")
    public ResponseEntity<List<String>> getBookedSlots(
            @PathVariable Long doctorId,
            @RequestParam String date) {
        return ResponseEntity.ok(appointmentService.getBookedSlots(doctorId, date));
    }
}
