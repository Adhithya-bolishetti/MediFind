package com.medifind.auth.service;

import com.medifind.auth.dto.LoginRequest;
import com.medifind.auth.dto.LoginResponse;
import com.medifind.auth.dto.RegisterRequest;
import com.medifind.auth.dto.UserResponse;

public interface AuthService {
    UserResponse register(RegisterRequest request);
    LoginResponse login(LoginRequest request);
    UserResponse getCurrentUser();
}
