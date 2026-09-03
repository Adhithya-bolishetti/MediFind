package com.medifind.video.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A video consultation room bound to a single appointment.
 *
 * <p>The {@code roomId} is a random, unguessable token rather than the
 * appointment id, so a leaked room name alone grants nothing — every join is
 * still authorised against the appointment.</p>
 */
@Entity
@Table(name = "video_sessions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long appointmentId;

    @Column(nullable = false, unique = true, length = 64)
    private String roomId;

    /** Set the first time either participant connects. */
    private LocalDateTime startedAt;

    /** Set when the room empties out again. */
    private LocalDateTime endedAt;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
