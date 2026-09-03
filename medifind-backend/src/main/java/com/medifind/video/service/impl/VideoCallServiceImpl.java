package com.medifind.video.service.impl;

import com.medifind.appointment.entity.Appointment;
import com.medifind.appointment.entity.AppointmentStatus;
import com.medifind.appointment.repository.AppointmentRepository;
import com.medifind.doctor.entity.Doctor;
import com.medifind.doctor.repository.DoctorRepository;
import com.medifind.user.entity.User;
import com.medifind.user.repository.UserRepository;
import com.medifind.video.dto.CallAuthorization;
import com.medifind.video.dto.CallParticipantResponse;
import com.medifind.video.dto.IceServerResponse;
import com.medifind.video.dto.VideoRoomResponse;
import com.medifind.video.entity.VideoSession;
import com.medifind.video.repository.VideoSessionRepository;
import com.medifind.video.service.VideoCallService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VideoCallServiceImpl implements VideoCallService {

    static final String ROLE_PATIENT = "PATIENT";
    static final String ROLE_DOCTOR = "DOCTOR";

    private final AppointmentRepository appointmentRepository;
    private final VideoSessionRepository videoSessionRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    /** Minutes before the scheduled time that the room opens. */
    @Value("${application.video.join-window-before-minutes:15}")
    private int joinWindowBeforeMinutes;

    /** Minutes after the scheduled time that the room stays open. */
    @Value("${application.video.join-window-after-minutes:60}")
    private int joinWindowAfterMinutes;

    @Value("${application.video.stun-urls:stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302}")
    private String stunUrls;

    @Value("${application.video.turn-url:}")
    private String turnUrl;

    @Value("${application.video.turn-username:}")
    private String turnUsername;

    @Value("${application.video.turn-credential:}")
    private String turnCredential;

    @Override
    @Transactional
    public VideoRoomResponse getRoom(Long appointmentId, Long userId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));

        String role = resolveRole(appointment, userId);
        if (role == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This appointment does not belong to you");
        }
        assertJoinable(appointment);

        VideoSession session = findOrCreateSession(appointmentId);
        LocalDateTime scheduledAt = scheduledAt(appointment);

        return VideoRoomResponse.builder()
                .appointmentId(appointmentId)
                .roomId(session.getRoomId())
                .signalingPath("/ws/video")
                .self(describeSelf(appointment, role))
                .peer(describePeer(appointment, role))
                .iceServers(iceServers())
                .scheduledAt(scheduledAt)
                .joinableFrom(scheduledAt.minusMinutes(joinWindowBeforeMinutes))
                .joinableUntil(scheduledAt.plusMinutes(joinWindowAfterMinutes))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CallAuthorization authorizeRoomAccess(String roomId, Long userId) {
        if (roomId == null || roomId.isBlank() || userId == null) {
            return null;
        }
        Optional<VideoSession> session = videoSessionRepository.findByRoomId(roomId);
        if (session.isEmpty()) {
            return null;
        }
        Appointment appointment = appointmentRepository.findById(session.get().getAppointmentId()).orElse(null);
        if (appointment == null) {
            return null;
        }
        String role = resolveRole(appointment, userId);
        if (role == null || !isWithinJoinWindow(appointment) || !isOnlineConsultation(appointment)
                || appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            return null;
        }
        return CallAuthorization.builder()
                .appointmentId(appointment.getId())
                .roomId(roomId)
                .userId(userId)
                .role(role)
                .name(describeSelf(appointment, role).getName())
                .build();
    }

    @Override
    @Transactional
    public void markStarted(String roomId) {
        videoSessionRepository.findByRoomId(roomId).ifPresent(session -> {
            if (session.getStartedAt() == null) {
                session.setStartedAt(LocalDateTime.now());
            }
            // A rejoin re-opens a session that had previously ended.
            session.setEndedAt(null);
            videoSessionRepository.save(session);
        });
    }

    @Override
    @Transactional
    public void markEnded(String roomId) {
        videoSessionRepository.findByRoomId(roomId).ifPresent(session -> {
            session.setEndedAt(LocalDateTime.now());
            videoSessionRepository.save(session);
        });
    }

    /**
     * Rejects the call unless the appointment is an accepted online consultation
     * and the current time falls inside the join window.
     */
    private void assertJoinable(Appointment appointment) {
        if (!isOnlineConsultation(appointment)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This is an in-person appointment — there is no video consultation for it");
        }
        if (appointment.getStatus() != AppointmentStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The video consultation opens once the doctor accepts the appointment");
        }
        LocalDateTime scheduledAt = scheduledAt(appointment);
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(scheduledAt.minusMinutes(joinWindowBeforeMinutes))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The consultation room opens " + joinWindowBeforeMinutes + " minutes before the scheduled time");
        }
        if (now.isAfter(scheduledAt.plusMinutes(joinWindowAfterMinutes))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This consultation has ended");
        }
    }

    private boolean isWithinJoinWindow(Appointment appointment) {
        LocalDateTime scheduledAt = scheduledAt(appointment);
        LocalDateTime now = LocalDateTime.now();
        return !now.isBefore(scheduledAt.minusMinutes(joinWindowBeforeMinutes))
                && !now.isAfter(scheduledAt.plusMinutes(joinWindowAfterMinutes));
    }

    private boolean isOnlineConsultation(Appointment appointment) {
        return "Online".equalsIgnoreCase(appointment.getConsultationType());
    }

    private LocalDateTime scheduledAt(Appointment appointment) {
        return LocalDateTime.of(appointment.getAppointmentDate(), appointment.getAppointmentTime());
    }

    /** @return "PATIENT", "DOCTOR", or {@code null} when the user is neither. */
    private String resolveRole(Appointment appointment, Long userId) {
        if (userId == null) {
            return null;
        }
        if (userId.equals(appointment.getUserId())) {
            return ROLE_PATIENT;
        }
        return doctorRepository.findByUserId(userId)
                .filter(doctor -> doctor.getId().equals(appointment.getDoctorId()))
                .map(doctor -> ROLE_DOCTOR)
                .orElse(null);
    }

    private VideoSession findOrCreateSession(Long appointmentId) {
        return videoSessionRepository.findByAppointmentId(appointmentId)
                .orElseGet(() -> {
                    try {
                        return videoSessionRepository.save(VideoSession.builder()
                                .appointmentId(appointmentId)
                                .roomId(UUID.randomUUID().toString())
                                .build());
                    } catch (DataIntegrityViolationException raced) {
                        // Both participants can open the room at once; the loser reads the winner's row.
                        return videoSessionRepository.findByAppointmentId(appointmentId)
                                .orElseThrow(() -> raced);
                    }
                });
    }

    private CallParticipantResponse describeSelf(Appointment appointment, String role) {
        return ROLE_PATIENT.equals(role)
                ? patientParticipant(appointment)
                : doctorParticipant(appointment);
    }

    private CallParticipantResponse describePeer(Appointment appointment, String role) {
        return ROLE_PATIENT.equals(role)
                ? doctorParticipant(appointment)
                : patientParticipant(appointment);
    }

    private CallParticipantResponse patientParticipant(Appointment appointment) {
        User patient = userRepository.findById(appointment.getUserId()).orElse(null);
        return CallParticipantResponse.builder()
                .userId(appointment.getUserId())
                .role(ROLE_PATIENT)
                .name(patient != null ? patient.getFullName() : "Patient")
                .avatar(patient != null ? patient.getProfileImage() : null)
                .build();
    }

    private CallParticipantResponse doctorParticipant(Appointment appointment) {
        Doctor doctor = doctorRepository.findById(appointment.getDoctorId()).orElse(null);
        return CallParticipantResponse.builder()
                .userId(doctor != null ? doctor.getUserId() : null)
                .role(ROLE_DOCTOR)
                .name(doctor != null ? doctor.getDoctorName() : "Doctor")
                .avatar(doctor != null ? doctor.getProfileImage() : null)
                .build();
    }

    private List<IceServerResponse> iceServers() {
        List<IceServerResponse> servers = new ArrayList<>();
        List<String> stun = Arrays.stream(stunUrls.split(","))
                .map(String::trim)
                .filter(url -> !url.isEmpty())
                .toList();
        if (!stun.isEmpty()) {
            servers.add(IceServerResponse.builder().urls(stun).build());
        }
        if (turnUrl != null && !turnUrl.isBlank()) {
            servers.add(IceServerResponse.builder()
                    .urls(List.of(turnUrl.trim()))
                    .username(turnUsername)
                    .credential(turnCredential)
                    .build());
        }
        return servers;
    }
}
