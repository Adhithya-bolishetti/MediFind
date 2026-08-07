package com.medifind.doctor.client;

import com.medifind.doctor.config.FeignClientConfig;
import com.medifind.doctor.dto.HospitalResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * OpenFeign client for communicating with the Hospital Service.
 * Load-balanced via Eureka using service name {@code HOSPITAL-SERVICE}.
 * Forwards the caller's JWT Authorization header via {@link FeignClientConfig}.
 */
@FeignClient(name = "HOSPITAL-SERVICE", path = "/api/hospitals", configuration = FeignClientConfig.class)
public interface HospitalClient {

    /**
     * Fetch hospital details by ID from the Hospital Service.
     *
     * @param id hospital identifier
     * @return hospital response DTO
     */
    @GetMapping("/{id}")
    HospitalResponse getHospitalById(@PathVariable("id") Long id);
}
