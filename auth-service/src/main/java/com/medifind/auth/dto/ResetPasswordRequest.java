package com.medifind.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "Token is required")
    private String token;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password should be at least 6 characters long")
    private String newPassword;

    @NotBlank(message = "Confirm Password is required")
    private String confirmPassword;
}
