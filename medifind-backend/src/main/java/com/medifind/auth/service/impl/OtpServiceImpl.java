package com.medifind.auth.service.impl;

import com.medifind.auth.entity.OtpEntity;
import com.medifind.auth.repository.OtpRepository;
import com.medifind.auth.service.OtpService;
import com.medifind.notification.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpServiceImpl implements OtpService {

    private final OtpRepository otpRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 3;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public void generateAndSendOtp(String email, String purpose) {
        Optional<OtpEntity> existingOtpOpt = otpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email, purpose);

        if (existingOtpOpt.isPresent()) {
            OtpEntity existingOtp = existingOtpOpt.get();
            if (existingOtp.getCreatedAt().plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
                throw new RuntimeException("Please wait before requesting a new OTP.");
            }
        }

        // Generate 6-digit OTP
        String rawOtp = String.format("%06d", secureRandom.nextInt(1000000));
        String hashedOtp = passwordEncoder.encode(rawOtp);
        log.info("Token generated (OTP generated)");

        OtpEntity otpEntity = existingOtpOpt.map(existing -> {
            if (existing.isUsed() || existing.isExpired() || existing.getAttemptCount() >= MAX_ATTEMPTS) {
                return createNewOtpEntity(email, hashedOtp, purpose);
            } else {
                existing.setHashedOtp(hashedOtp);
                existing.setExpiryDate(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
                existing.setAttemptCount(existing.getAttemptCount() + 1);
                return existing;
            }
        }).orElseGet(() -> createNewOtpEntity(email, hashedOtp, purpose));

        otpRepository.save(otpEntity);
        log.info("Token stored (OTP stored)");

        log.info("Email request prepared");
        // Send Email (now synchronously)
        emailService.sendOtpEmail(email, rawOtp, purpose);
        log.info("Email sent");
        log.info("OTP generated for email: {}, purpose: {}", email, purpose);
        log.info("Response returned");
    }

    private OtpEntity createNewOtpEntity(String email, String hashedOtp, String purpose) {
        return OtpEntity.builder()
                .email(email)
                .hashedOtp(hashedOtp)
                .purpose(purpose)
                .expiryDate(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .isUsed(false)
                .attemptCount(1)
                .build();
    }

    @Override
    @Transactional
    public boolean verifyOtp(String email, String rawOtp, String purpose) {
        Optional<OtpEntity> otpOpt = otpRepository.findTopByEmailAndPurposeOrderByCreatedAtDesc(email, purpose);

        if (otpOpt.isEmpty()) {
            throw new RuntimeException("No OTP found for this email and purpose.");
        }

        OtpEntity otpEntity = otpOpt.get();

        if (otpEntity.isUsed()) {
            throw new RuntimeException("OTP has already been used.");
        }

        if (otpEntity.isExpired()) {
            throw new RuntimeException("OTP has expired.");
        }

        if (!passwordEncoder.matches(rawOtp, otpEntity.getHashedOtp())) {
            throw new RuntimeException("Invalid OTP.");
        }

        otpEntity.setUsed(true);
        otpRepository.save(otpEntity);
        return true;
    }
}
