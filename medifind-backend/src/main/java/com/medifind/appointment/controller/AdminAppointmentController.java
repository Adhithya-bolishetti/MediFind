package com.medifind.appointment.controller;

import com.medifind.appointment.dto.AppointmentResponse;
import com.medifind.appointment.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-only appointment management. Requires ROLE_ADMIN (also enforced by SecurityConfig).
 */
@RestController
@RequestMapping("/api/admin/appointments")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminAppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> getAllAppointments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(appointmentService.getAllAppointments(status, date));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getAppointmentById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponse> cancelAppointment(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.cancelAppointmentAsAdmin(id));
    }

    /**
     * Delete every appointment belonging to a user (used when an admin
     * permanently deletes a patient account).
     */
    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> deleteByUser(@PathVariable Long userId) {
        appointmentService.deleteAppointmentsByUser(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Delete every appointment for a doctor (used when an admin permanently
     * deletes a doctor profile).
     */
    @DeleteMapping("/doctor/{doctorId}")
    public ResponseEntity<Void> deleteByDoctor(@PathVariable Long doctorId) {
        appointmentService.deleteAppointmentsByDoctor(doctorId);
        return ResponseEntity.noContent().build();
    }
}
