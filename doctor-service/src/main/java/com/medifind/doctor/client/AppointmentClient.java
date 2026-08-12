package com.medifind.doctor.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "appointment-service")
public interface AppointmentClient {

    @GetMapping("/api/appointments/doctor/{doctorId}/has-completed")
    boolean hasCompletedAppointment(@PathVariable("doctorId") Long doctorId, @RequestParam("userId") Long userId);
    
    @GetMapping("/api/appointments/doctor/{doctorId}/booked-slots")
    List<String> getBookedSlots(@PathVariable("doctorId") Long doctorId, @RequestParam("date") String date);

    @GetMapping("/api/appointments/{id}")
    java.util.Map<String, Object> getAppointmentById(@PathVariable("id") Long id);
}
