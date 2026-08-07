package com.medifind.hospital.config;

import com.medifind.hospital.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration for the Hospital Service.
 * All hospital write endpoints require ADMIN; reads require authentication.
 * Method-level security (@PreAuthorize) is enabled for fine-grained control.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                // Swagger / OpenAPI — publicly accessible
                .requestMatchers(
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()
                // Write operations — ADMIN only
                .requestMatchers(HttpMethod.POST,   "/api/hospitals/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/hospitals/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/hospitals/**").hasAuthority("ROLE_ADMIN")
                // Read operations — any authenticated user
                .requestMatchers(HttpMethod.GET, "/api/hospitals/**").authenticated()
                .anyRequest().authenticated()
            )
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
