package com.medifind.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest {

    /**
     * Login identifier — either an email address or a mobile number.
     * The auth service resolves it to the matching account.
     */
    @NotBlank(message = "Email or mobile number is required")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
}
