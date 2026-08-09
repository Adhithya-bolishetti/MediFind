package com.medifind.appointment.service.impl;

import com.medifind.appointment.client.DoctorClient;
import com.medifind.appointment.client.UserClient;
import com.medifind.appointment.dto.AppointmentRequest;
import com.medifind.appointment.dto.AppointmentResponse;
import com.medifind.appointment.dto.DoctorAvailabilityResponse;
import com.medifind.appointment.entity.Appointment;
import com.medifind.appointment.entity.AppointmentStatus;
import com.medifind.appointment.repository.AppointmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceImplTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private DoctorClient doctorClient;

    @Mock
    private UserClient userClient;

    @InjectMocks
    private AppointmentServiceImpl appointmentService;

    private AppointmentRequest validRequest;
    private DoctorAvailabilityResponse availabilityResponse;

    @BeforeEach
    void setUp() {
        validRequest = new AppointmentRequest();
        validRequest.setDoctorId(10L);
        validRequest.setAppointmentDate(LocalDate.now().plusDays(1));
        validRequest.setAppointmentTime(LocalTime.of(10, 0));
        validRequest.setReason("Checkup");

        availabilityResponse = new DoctorAvailabilityResponse();
        availabilityResponse.setAvailable(true);
        availabilityResponse.setConsultationStartTime("09:00");
        availabilityResponse.setConsultationEndTime("17:00");
    }

    @Test
    void createAppointment_Success() {
        when(doctorClient.getDoctorAvailability(10L)).thenReturn(availabilityResponse);
        when(appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTime(
                10L, validRequest.getAppointmentDate(), validRequest.getAppointmentTime()
        )).thenReturn(false);
        
        Appointment savedAppointment = Appointment.builder()
                .id(1L)
                .userId(1L)
                .doctorId(10L)
                .status(AppointmentStatus.PENDING)
                .build();
                
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(savedAppointment);

        AppointmentResponse response = appointmentService.createAppointment(validRequest, 1L);

        assertNotNull(response);
        assertEquals(AppointmentStatus.PENDING, response.getStatus());
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    void createAppointment_DoctorUnavailable() {
        availabilityResponse.setAvailable(false);
        when(doctorClient.getDoctorAvailability(10L)).thenReturn(availabilityResponse);

        assertThrows(ResponseStatusException.class, () -> appointmentService.createAppointment(validRequest, 1L));
        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    void cancelAppointment_Success() {
        Appointment appointment = Appointment.builder()
                .id(1L)
                .userId(1L)
                .status(AppointmentStatus.PENDING)
                .build();
                
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);
        
        AppointmentResponse response = appointmentService.cancelAppointment(1L, 1L);
        
        assertEquals(AppointmentStatus.CANCELLED, response.getStatus());
    }

    @Test
    void cancelAppointment_Forbidden() {
        Appointment appointment = Appointment.builder()
                .id(1L)
                .userId(2L) // Different user
                .status(AppointmentStatus.PENDING)
                .build();
                
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        
        assertThrows(ResponseStatusException.class, () -> appointmentService.cancelAppointment(1L, 1L));
    }
}
