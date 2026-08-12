package com.medifind.hospital.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.Map;

@FeignClient(name = "doctor-service")
public interface DoctorClient {

    @GetMapping("/api/doctors/profile/{userId}")
    Map<String, Object> getDoctorProfileByUserId(@PathVariable("userId") Long userId);
}
