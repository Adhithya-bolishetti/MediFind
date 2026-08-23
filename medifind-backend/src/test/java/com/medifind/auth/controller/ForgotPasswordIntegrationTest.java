package com.medifind.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medifind.auth.dto.ForgotPasswordRequest;
import com.medifind.auth.entity.OtpEntity;
import com.medifind.auth.repository.OtpRepository;
import com.medifind.notification.service.EmailService;
import com.medifind.user.entity.User;
import com.medifind.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ForgotPasswordIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpRepository otpRepository;

    @MockBean
    private EmailService emailService;

    private User testUser;

    @BeforeEach
    void setUp() {
        otpRepository.deleteAll();
        userRepository.deleteAll();

        testUser = User.builder()
                .email("test@example.com")
                .password("password123")
                .fullName("Test User")
                .role(com.medifind.auth.entity.Role.PATIENT)
                .status("ACTIVE")
                .build();
        userRepository.save(testUser);
    }

    @AfterEach
    void tearDown() {
        otpRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void testForgotPassword_ExistingUser_Success() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("test@example.com");

        doNothing().when(emailService).sendOtpEmail(anyString(), anyString(), anyString());

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If an account exists, a reset link/OTP has been sent."));

        verify(emailService, times(1)).sendOtpEmail(eq("test@example.com"), anyString(), eq("PASSWORD_RESET"));

        List<OtpEntity> otps = otpRepository.findAll();
        assertEquals(1, otps.size());
        assertEquals("test@example.com", otps.get(0).getEmail());
    }

    @Test
    void testForgotPassword_NonExistingUser_Success() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("notfound@example.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If an account exists, a reset link/OTP has been sent."));

        verify(emailService, never()).sendOtpEmail(anyString(), anyString(), anyString());
        
        List<OtpEntity> otps = otpRepository.findAll();
        assertEquals(0, otps.size());
    }

    @Test
    void testForgotPassword_EmailProviderFailure_Returns500() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("test@example.com");

        doThrow(new RuntimeException("Simulated Resend API failure"))
                .when(emailService).sendOtpEmail(anyString(), anyString(), anyString());

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("An unexpected error occurred while processing the forgot password request."));

        verify(emailService, times(1)).sendOtpEmail(eq("test@example.com"), anyString(), eq("PASSWORD_RESET"));
    }
}
