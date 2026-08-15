package com.medifind.appointment.service;

import com.medifind.appointment.dto.AppointmentRequest;
import com.medifind.appointment.dto.AppointmentResponse;

import java.util.List;

public interface AppointmentService {
    AppointmentResponse createAppointment(AppointmentRequest request, Long userId);
    AppointmentResponse getAppointmentById(Long id);
    List<AppointmentResponse> getUserAppointments(Long userId);
    List<AppointmentResponse> getDoctorAppointments(Long doctorId);
    AppointmentResponse cancelAppointment(Long id, Long userId);
    AppointmentResponse confirmAppointment(Long id, Long doctorId);
    AppointmentResponse declineAppointment(Long id, Long doctorId);
    AppointmentResponse completeAppointment(Long id, Long doctorId);
    void deleteAppointment(Long id);
    boolean hasCompletedAppointment(Long doctorId, Long userId);
    List<String> getBookedSlots(Long doctorId, String date);
}
