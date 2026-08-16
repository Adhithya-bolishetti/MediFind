package com.medifind.hospital.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * One uploaded image belonging to a hospital. Images are stored as base64
 * data URLs in the database (matching how doctor profile photos and license
 * certificates are stored elsewhere in the platform).
 */
@Entity
@Table(name = "hospital_images")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HospitalImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long hospitalId;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String imageUrl;

    @Column(nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
