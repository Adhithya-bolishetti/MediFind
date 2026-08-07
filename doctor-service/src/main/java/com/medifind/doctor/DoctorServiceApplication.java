package com.medifind.doctor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * Entry point for the MediFind Doctor Service.
 * Registers with Eureka and enables OpenFeign client scanning for Hospital Service calls.
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class DoctorServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(DoctorServiceApplication.class, args);
    }
}
