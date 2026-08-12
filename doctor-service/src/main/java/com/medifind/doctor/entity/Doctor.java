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

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    private String doctorName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String phoneNumber;

    private String gender;
    private java.time.LocalDate dateOfBirth;
    private String profileImage;

    // Professional Information
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Specialization specialization;

    private String subSpecialization;
    private String qualification;
    private String medicalCollege;
    private String medicalLicenseNumber;

    @Column(nullable = false)
    private Integer experience;

    @Column(length = 2000)
    private String about;

    @Column(nullable = false)
    private Double consultationFee;

    private String languages;

    // Location / Hospital
    private Long hospitalId;
    private String clinicName;
    private String clinicAddress;
    
    @Column(nullable = false)
    private String city;
    
    private String state;
    private String country;
    private String pincode;
    private Double latitude;
    private Double longitude;

    // Availability
    @Column(nullable = false)
    private boolean available;
    private String workingDays; // e.g. "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY"
    private String consultationStartTime; // e.g. "09:00"
    private String consultationEndTime; // e.g. "17:00"
    private Integer appointmentDuration; // in minutes e.g. 30
    private boolean availableForOnlineConsultation;
    private boolean availableForEmergency;

    // Verification and License Storage
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;
    
    private String licenseCertificatePath;
    private String rejectionReason;

    /** Aggregate rating out of 5.0. */
    @Column(nullable = false)
    private Double rating = 0.0;

    @Column(nullable = false)
    private Integer totalReviews = 0;

    @Column(nullable = false)
    private Integer rating5 = 0;

    @Column(nullable = false)
    private Integer rating4 = 0;

    @Column(nullable = false)
    private Integer rating3 = 0;

    @Column(nullable = false)
    private Integer rating2 = 0;

    @Column(nullable = false)
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
