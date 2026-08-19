package com.medifind.auth.repository;

import com.medifind.auth.entity.OtpEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<OtpEntity, Long> {
    Optional<OtpEntity> findTopByEmailAndPurposeOrderByCreatedAtDesc(String email, String purpose);
    void deleteByExpiryDateBefore(LocalDateTime dateTime);
}
