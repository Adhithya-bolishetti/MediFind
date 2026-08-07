package com.medifind.hospital.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger configuration for the Hospital Service.
 * Registers the Bearer-token security scheme so Swagger UI displays the Authorize button.
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI hospitalServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("MediFind — Hospital Service API")
                        .description("Manages hospital records: CRUD operations and location data.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("MediFind Engineering")
                                .email("dev@medifind.com")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}
