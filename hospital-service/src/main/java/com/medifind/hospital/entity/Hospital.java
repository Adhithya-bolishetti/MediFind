package com.medifind.hospital.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * JPA entity representing a Hospital in the MediFind system.
 * Mapped to the {@code hospitals} table.
 */
@Entity
@Table(name = "hospitals")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Hospital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Full registered name of the hospital. */
    @Column(nullable = false)
    private String hospitalName;

    /** Street / locality address. */
    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String state;

    /** Contact phone number (10–15 digits, optional leading +). */
    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = false, unique = true)
    private String email;

    /** GPS latitude — range [-90.0, +90.0]. */
    private Double latitude;

    /** GPS longitude — range [-180.0, +180.0]. */
    private Double longitude;

    /** Whether the hospital has a 24×7 emergency department. */
    @Column(nullable = false)
    private boolean emergencyAvailable;

    @Column(nullable = false)
    @Builder.Default
    private Double rating = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Integer totalReviews = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer rating5 = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer rating4 = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer rating3 = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer rating2 = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer rating1 = 0;

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
