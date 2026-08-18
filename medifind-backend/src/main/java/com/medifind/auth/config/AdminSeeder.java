package com.medifind.auth.config;

import com.medifind.auth.entity.Role;
import com.medifind.user.entity.User;
import com.medifind.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.name:}")
    private String adminName;

    @Value("${admin.mobile:}")
    private String adminMobile;

    @Value("${admin.email:}")
    private String adminEmail;

    @Value("${admin.password:}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (userRepository.existsByRole(Role.ADMIN)) {
            log.info("An ADMIN user already exists. Skipping admin initialization.");
            return;
        }

        if (adminPassword == null || adminPassword.trim().isEmpty()) {
            log.warn("No ADMIN user exists, but ADMIN_PASSWORD environment variable is missing. Cannot create default admin account.");
            return;
        }
        
        if (adminName == null || adminName.trim().isEmpty()) {
            adminName = "Administrator";
        }
        
        String emailToSave = (adminEmail == null || adminEmail.trim().isEmpty()) ? null : adminEmail.trim();
        String mobileToSave = (adminMobile == null || adminMobile.trim().isEmpty()) ? null : adminMobile.trim();
        
        if (emailToSave == null && mobileToSave == null) {
            log.warn("No ADMIN user exists, but both ADMIN_EMAIL and ADMIN_MOBILE are missing. Cannot create default admin account without an identifier.");
            return;
        }

        User admin = User.builder()
                .fullName(adminName)
                .email(emailToSave)
                .mobileNumber(mobileToSave)
                .password(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .build();

        userRepository.save(admin);
        log.info("Successfully created the default ADMIN user account.");
    }
}
