package com.medifind.auth.service.impl;

import com.medifind.auth.dto.LoginRequest;
import com.medifind.auth.dto.LoginResponse;
import com.medifind.auth.dto.RegisterRequest;
import com.medifind.auth.dto.UserResponse;
import com.medifind.auth.entity.Role;
import com.medifind.auth.entity.User;
import com.medifind.auth.exception.BadCredentialsException;
import com.medifind.auth.exception.UserAlreadyExistsException;
import com.medifind.auth.exception.UserNotFoundException;
import com.medifind.auth.repository.UserRepository;
import com.medifind.auth.dto.ForgotPasswordRequest;
import com.medifind.auth.dto.ResetPasswordRequest;
import com.medifind.auth.entity.PasswordResetToken;
import com.medifind.auth.repository.PasswordResetTokenRepository;
import com.medifind.auth.service.AuthService;
import com.medifind.auth.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    public UserResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        // Email is optional — never generate a fake one. Users may register
        // with only a mobile number and add their email later.
        String email = (request.getEmail() == null || request.getEmail().isBlank())
                ? null : request.getEmail().trim().toLowerCase();
        String mobileNumber = (request.getMobileNumber() == null || request.getMobileNumber().isBlank())
                ? null : request.getMobileNumber().trim();

        if (email != null && userRepository.existsByEmail(email)) {
            throw new UserAlreadyExistsException("Email is already in use.");
        }
        if (mobileNumber != null && userRepository.existsByMobileNumber(mobileNumber)) {
            throw new UserAlreadyExistsException("An account with this mobile number already exists.");
        }

        Role requestedRole = Role.PATIENT; // Default role
        if (request.getRole() != null) {
            try {
                Role parsedRole = Role.valueOf(request.getRole().toUpperCase());
                if (parsedRole == Role.PATIENT || parsedRole == Role.DOCTOR) {
                    requestedRole = parsedRole;
                }
            } catch (IllegalArgumentException e) {
                // Ignore and fallback to PATIENT
            }
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(email)
                .mobileNumber(mobileNumber)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(requestedRole) 
                .build();

        User savedUser = userRepository.save(user);
        return mapToUserResponse(savedUser);
    }

    /**
     * Resolves a login identifier to a user account. The identifier may be:
     * <ul>
     *   <li>an email address (current + legacy accounts)</li>
     *   <li>a mobile number (new mobile-only accounts)</li>
     *   <li>a legacy mobile-derived email like {@code 91xxxxxxxxxx@medifind.com}
     *       for accounts created before mobile login existed</li>
     * </ul>
     */
    private User findByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) return null;
        String value = identifier.trim().toLowerCase();

        User user = userRepository.findByEmail(value).orElse(null);
        if (user == null) {
            user = userRepository.findByMobileNumber(value).orElse(null);
        }
        if (user == null && !value.contains("@")) {
            // Legacy accounts stored the mobile as <mobile>@medifind.com
            user = userRepository.findByEmail(value + "@medifind.com").orElse(null);
        }
        return user;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        // Resolve the identifier (email or mobile number) to an account.
        User user = findByIdentifier(request.getEmail());

        // Suspended accounts must be rejected even though their credentials are
        // valid (User.isEnabled() returns false, which surfaces as DisabledException
        // during authentication). Check status explicitly so the user sees a clear
        // message instead of a generic "invalid credentials" error.
        if (user != null && "SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            throw new BadCredentialsException("Your account has been suspended by the administrator. Please contact MediFind support.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (AuthenticationException e) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String jwtToken = jwtService.generateToken(user);

        return LoginResponse.builder()
                .accessToken(jwtToken)
                .user(mapToUserResponse(user))
                .build();
    }

    @Override
    public UserResponse getCurrentUser() {
        // The JWT subject is the login identifier (email or mobile number).
        String identifier = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = findByIdentifier(identifier);
        if (user == null) {
            throw new UserNotFoundException("Current user not found");
        }
        return mapToUserResponse(user);
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        // Resolve the identifier — an email or a mobile number.
        User user = findByIdentifier(request.getEmail());
        
        if (user == null) {
            // Do not expose whether the user exists or not
            return;
        }

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .build();
        
        passwordResetTokenRepository.save(resetToken);

        // TODO: Call Notification Service to send email with the token
        System.out.println("DEBUG: Password reset token for " + user.getEmail() + " is " + token);
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        if (resetToken.isExpired()) {
            throw new IllegalArgumentException("Invalid or expired reset token");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Invalidate the token
        passwordResetTokenRepository.delete(resetToken);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .mobileNumber(user.getMobileNumber())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
