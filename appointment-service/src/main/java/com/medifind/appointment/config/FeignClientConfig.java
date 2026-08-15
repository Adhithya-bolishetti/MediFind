package com.medifind.appointment.config;

import feign.RequestInterceptor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Feign client configuration that propagates the incoming JWT Authorization header
 * to downstream service calls (User Service, Doctor Service, Notification Service).
 * This ensures the downstream services can authenticate the request and resolve
 * the correct user/doctor identities.
 */
@Configuration
@Slf4j
public class FeignClientConfig {

    /**
     * Intercept every Feign request and attach the Authorization header from
     * the current servlet request context.
     */
    @Bean
    public RequestInterceptor jwtRequestInterceptor() {
        return requestTemplate -> {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String authorizationHeader = request.getHeader("Authorization");
                if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
                    requestTemplate.header("Authorization", authorizationHeader);
                    log.debug("Forwarding Authorization header to Feign request");
                }
            }
        };
    }
}
