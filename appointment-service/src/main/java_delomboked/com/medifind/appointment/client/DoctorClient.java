package com.medifind.appointment.client;

import com.medifind.appointment.dto.DoctorAvailabilityResponse;
import com.medifind.appointment.dto.DoctorResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "doctor-service")
public interface DoctorClient {
    @GetMapping("/api/doctors/{id}")
    DoctorResponse getDoctorById(@PathVariable("id") Long id);

    @GetMapping("/api/doctors/{id}/availability")
    DoctorAvailabilityResponse getDoctorAvailability(@PathVariable("id") Long id);
}
