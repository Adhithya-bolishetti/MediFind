package com.medifind.video.repository;

import com.medifind.video.entity.VideoSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VideoSessionRepository extends JpaRepository<VideoSession, Long> {

    Optional<VideoSession> findByAppointmentId(Long appointmentId);

    Optional<VideoSession> findByRoomId(String roomId);
}
