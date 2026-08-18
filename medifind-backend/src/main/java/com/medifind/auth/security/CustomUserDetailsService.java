package com.medifind.auth.security;

import com.medifind.auth.exception.UserNotFoundException;
import com.medifind.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // The username may be an email address OR a mobile number (mobile-only
        // registrations have no email). Fall back to the legacy mobile-derived
        // email convention for accounts created before mobile login existed.
        String value = username == null ? "" : username.trim().toLowerCase();

        var user = userRepository.findByEmail(value).orElse(null);
        if (user == null) {
            user = userRepository.findByMobileNumber(value).orElse(null);
        }
        if (user == null && !value.contains("@")) {
            user = userRepository.findByEmail(value + "@medifind.com").orElse(null);
        }
        if (user == null) {
            throw new UserNotFoundException("User not found with identifier: " + username);
        }
        return user;
    }
}
