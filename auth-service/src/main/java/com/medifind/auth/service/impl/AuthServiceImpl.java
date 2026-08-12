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

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email is already in use.");
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
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(requestedRole) 
                .build();

        User savedUser = userRepository.save(user);
        return mapToUserResponse(savedUser);
    }

    @Override
    public LoginResponse login(LoginRequest request) {
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

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        String jwtToken = jwtService.generateToken(user);

        return LoginResponse.builder()
                .accessToken(jwtToken)
                .user(mapToUserResponse(user))
                .build();
    }

    @Override
    public UserResponse getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Current user not found"));
        return mapToUserResponse(user);
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);
        
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
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
