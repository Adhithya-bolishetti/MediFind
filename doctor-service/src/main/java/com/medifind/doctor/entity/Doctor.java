package com.medifind.doctor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * JPA entity representing a Doctor profile in the MediFind system.
 * Mapped to the {@code doctors} table.
 * References a hospital by {@code hospitalId} — hospital data is fetched
 * on-demand via the {@link com.medifind.doctor.client.HospitalClient} Feign client.
 */
@Entity
@Table(name = "doctors")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String doctorName;

    @Column(nullable = false)
    private String specialization;

    private String qualification;

    /** Years of clinical experience. */
    @Column(nullable = false)
    private Integer experience;

    /** Consultation fee in INR. */
    @Column(nullable = false)
    private Double consultationFee;

    /** Aggregate rating out of 5.0. */
    @Column(nullable = false)
    private Double rating;

    /** Foreign key referencing the hospital (stored in hospital-service). */
    private Long hospitalId;

    @Column(nullable = false)
    private String city;

    private String state;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = false, unique = true)
    private String email;

    /** URL to the doctor's profile image. */
    private String profileImage;

    /** Whether the doctor is currently accepting appointments. */
    @Column(nullable = false)
    private boolean available;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
