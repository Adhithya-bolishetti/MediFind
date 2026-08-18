package com.medifind.auth.service;

import com.medifind.auth.dto.LoginRequest;
import com.medifind.auth.dto.LoginResponse;
import com.medifind.auth.dto.RegisterRequest;
import com.medifind.auth.dto.UserResponse;
import com.medifind.auth.entity.Role;
import com.medifind.auth.exception.BadCredentialsException;
import com.medifind.auth.exception.UserAlreadyExistsException;
import com.medifind.auth.repository.PasswordResetTokenRepository;
import com.medifind.auth.service.impl.AuthServiceImpl;
import com.medifind.user.entity.User;
import com.medifind.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequest baseRegisterRequest;

    @BeforeEach
    void setUp() {
        baseRegisterRequest = RegisterRequest.builder()
                .fullName("John Doe")
                .password("password123")
                .confirmPassword("password123")
                .build();
    }

    @Test
    void testPatientRegistration_Success() {
        baseRegisterRequest.setEmail("patient@example.com");
        baseRegisterRequest.setRole("PATIENT");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });

        UserResponse response = authService.register(baseRegisterRequest);

        assertNotNull(response);
        assertEquals("patient@example.com", response.getEmail());
        assertEquals(Role.PATIENT, response.getRole());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        
        assertEquals("ACTIVE", savedUser.getStatus());
        assertEquals("encodedPassword", savedUser.getPassword());
    }

    @Test
    void testDoctorRegistration_Success() {
        baseRegisterRequest.setEmail("doctor@example.com");
        baseRegisterRequest.setRole("DOCTOR");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(2L);
            return u;
        });

        UserResponse response = authService.register(baseRegisterRequest);

        assertEquals(Role.DOCTOR, response.getRole());
        
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals("ACTIVE", userCaptor.getValue().getStatus());
    }
    
    @Test
    void testHospitalRegistration_Success() {
        baseRegisterRequest.setEmail("hospital@example.com");
        baseRegisterRequest.setRole("HOSPITAL");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(3L);
            return u;
        });

        UserResponse response = authService.register(baseRegisterRequest);

        assertEquals(Role.HOSPITAL, response.getRole());
    }

    @Test
    void testRegistrationWithMobileOnly_Success() {
        baseRegisterRequest.setMobileNumber("9876543210");
        
        when(userRepository.existsByMobileNumber(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(4L);
            return u;
        });

        UserResponse response = authService.register(baseRegisterRequest);

        assertEquals("9876543210", response.getMobileNumber());
        assertNull(response.getEmail());
        
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals("ACTIVE", userCaptor.getValue().getStatus());
    }

    @Test
    void testRegistrationWithMobileAndEmail_Success() {
        baseRegisterRequest.setEmail("dual@example.com");
        baseRegisterRequest.setMobileNumber("9876543210");
        
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByMobileNumber(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(5L);
            return u;
        });

        UserResponse response = authService.register(baseRegisterRequest);

        assertEquals("dual@example.com", response.getEmail());
        assertEquals("9876543210", response.getMobileNumber());
    }

    @Test
    void testRegistration_DuplicateEmail_ThrowsException() {
        baseRegisterRequest.setEmail("existing@example.com");
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(baseRegisterRequest));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testRegistration_DuplicateMobile_ThrowsException() {
        baseRegisterRequest.setMobileNumber("9876543210");
        when(userRepository.existsByMobileNumber(anyString())).thenReturn(true);

        assertThrows(UserAlreadyExistsException.class, () -> authService.register(baseRegisterRequest));
        verify(userRepository, never()).save(any());
    }

    @Test
    void testLoginAfterRegistration_Success() {
        User user = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("encodedPassword")
                .role(Role.PATIENT)
                .status("ACTIVE")
                .build();
                
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null);
        when(jwtService.generateToken(user)).thenReturn("mockedJwtToken");

        LoginRequest loginRequest = LoginRequest.builder()
                .email("test@example.com")
                .password("password123")
                .build();

        LoginResponse loginResponse = authService.login(loginRequest);

        assertNotNull(loginResponse);
        assertEquals("mockedJwtToken", loginResponse.getAccessToken());
        assertEquals("test@example.com", loginResponse.getUser().getEmail());
        
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtService).generateToken(user);
    }
}
