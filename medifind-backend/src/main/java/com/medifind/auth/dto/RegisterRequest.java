package com.medifind.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    
    @NotBlank(message = "Full name is required")
    private String fullName;

    /**
     * Optional — users may register with only a mobile number. No fake email
     * is ever generated; the email can be provided later during profile setup.
     */
    @Email(message = "Email is not valid")
    private String email;

    /**
     * Required identifier for users who register without an email.
     * Stored on the account and used to log in.
     */
    private String mobileNumber;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password should be at least 6 characters long")
    private String password;

    @NotBlank(message = "Confirm Password is required")
    private String confirmPassword;

    private String role; // e.g., PATIENT or DOCTOR
}
