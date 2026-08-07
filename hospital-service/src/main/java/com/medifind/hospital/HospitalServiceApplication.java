package com.medifind.hospital;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * Entry point for the MediFind Hospital Service.
 * Registers with Eureka Discovery Server.
 */
@SpringBootApplication
@EnableDiscoveryClient
public class HospitalServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(HospitalServiceApplication.class, args);
    }
}
