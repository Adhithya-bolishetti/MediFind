package com.medifind.video.service;

import com.medifind.appointment.entity.Appointment;
import com.medifind.appointment.entity.AppointmentStatus;
import com.medifind.appointment.repository.AppointmentRepository;
import com.medifind.doctor.entity.Doctor;
import com.medifind.doctor.repository.DoctorRepository;
import com.medifind.user.entity.User;
import com.medifind.user.repository.UserRepository;
import com.medifind.video.dto.CallAuthorization;
import com.medifind.video.dto.VideoRoomResponse;
import com.medifind.video.entity.VideoSession;
import com.medifind.video.repository.VideoSessionRepository;
import com.medifind.video.service.impl.VideoCallServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VideoCallServiceTest {

    private static final Long APPOINTMENT_ID = 100L;
    private static final Long PATIENT_USER_ID = 7L;
    private static final Long DOCTOR_USER_ID = 8L;
    private static final Long DOCTOR_PROFILE_ID = 42L;
    private static final Long STRANGER_USER_ID = 99L;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private VideoSessionRepository videoSessionRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private VideoCallServiceImpl videoCallService;

    private Appointment appointment;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(videoCallService, "joinWindowBeforeMinutes", 15);
        ReflectionTestUtils.setField(videoCallService, "joinWindowAfterMinutes", 60);
        ReflectionTestUtils.setField(videoCallService, "stunUrls", "stun:stun.l.google.com:19302");
        ReflectionTestUtils.setField(videoCallService, "turnUrl", "");

        // Scheduled right now, so the join window is open by default.
        LocalDateTime now = LocalDateTime.now();
        appointment = Appointment.builder()
                .id(APPOINTMENT_ID)
                .userId(PATIENT_USER_ID)
                .doctorId(DOCTOR_PROFILE_ID)
                .appointmentDate(now.toLocalDate())
                .appointmentTime(now.toLocalTime())
                .reason("Follow-up")
                .consultationType("Online")
                .status(AppointmentStatus.CONFIRMED)
                .build();

        Doctor doctor = Doctor.builder()
                .id(DOCTOR_PROFILE_ID)
                .userId(DOCTOR_USER_ID)
                .doctorName("Asha Rao")
                .build();

        when(appointmentRepository.findById(APPOINTMENT_ID)).thenReturn(Optional.of(appointment));
        when(doctorRepository.findById(DOCTOR_PROFILE_ID)).thenReturn(Optional.of(doctor));
        when(doctorRepository.findByUserId(DOCTOR_USER_ID)).thenReturn(Optional.of(doctor));
        when(doctorRepository.findByUserId(PATIENT_USER_ID)).thenReturn(Optional.empty());
        when(doctorRepository.findByUserId(STRANGER_USER_ID)).thenReturn(Optional.empty());
        when(userRepository.findById(PATIENT_USER_ID)).thenReturn(Optional.of(
                User.builder().id(PATIENT_USER_ID).fullName("Ravi Kumar").build()));
        when(videoSessionRepository.findByAppointmentId(APPOINTMENT_ID)).thenReturn(Optional.empty());
        when(videoSessionRepository.save(any(VideoSession.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void patientGetsRoomWithDoctorAsPeer() {
        VideoRoomResponse room = videoCallService.getRoom(APPOINTMENT_ID, PATIENT_USER_ID);

        assertEquals("PATIENT", room.getSelf().getRole());
        assertEquals("DOCTOR", room.getPeer().getRole());
        assertEquals("Asha Rao", room.getPeer().getName());
        assertNotNull(room.getRoomId());
        assertFalse(room.getIceServers().isEmpty());
    }

    @Test
    void doctorGetsRoomWithPatientAsPeer() {
        VideoRoomResponse room = videoCallService.getRoom(APPOINTMENT_ID, DOCTOR_USER_ID);

        assertEquals("DOCTOR", room.getSelf().getRole());
        assertEquals("PATIENT", room.getPeer().getRole());
        assertEquals("Ravi Kumar", room.getPeer().getName());
    }

    @Test
    void bothParticipantsShareTheSameRoom() {
        VideoRoomResponse patientRoom = videoCallService.getRoom(APPOINTMENT_ID, PATIENT_USER_ID);

        VideoSession created = VideoSession.builder()
                .appointmentId(APPOINTMENT_ID)
                .roomId(patientRoom.getRoomId())
                .build();
        when(videoSessionRepository.findByAppointmentId(APPOINTMENT_ID)).thenReturn(Optional.of(created));

        VideoRoomResponse doctorRoom = videoCallService.getRoom(APPOINTMENT_ID, DOCTOR_USER_ID);

        assertEquals(patientRoom.getRoomId(), doctorRoom.getRoomId());
        verify(videoSessionRepository, times(1)).save(any(VideoSession.class));
    }

    @Test
    void strangerIsRefused() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> videoCallService.getRoom(APPOINTMENT_ID, STRANGER_USER_ID));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void doctorOfAnotherAppointmentIsRefused() {
        Doctor otherDoctor = Doctor.builder().id(777L).userId(STRANGER_USER_ID).doctorName("Other").build();
        when(doctorRepository.findByUserId(STRANGER_USER_ID)).thenReturn(Optional.of(otherDoctor));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> videoCallService.getRoom(APPOINTMENT_ID, STRANGER_USER_ID));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void inPersonAppointmentHasNoRoom() {
        appointment.setConsultationType("In-person");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> videoCallService.getRoom(APPOINTMENT_ID, PATIENT_USER_ID));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("in-person"));
    }

    @Test
    void pendingAppointmentCannotBeJoined() {
        appointment.setStatus(AppointmentStatus.PENDING);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> videoCallService.getRoom(APPOINTMENT_ID, PATIENT_USER_ID));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    void roomIsClosedBeforeTheJoinWindowOpens() {
        LocalDateTime later = LocalDateTime.now().plusHours(3);
        appointment.setAppointmentDate(later.toLocalDate());
        appointment.setAppointmentTime(later.toLocalTime());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> videoCallService.getRoom(APPOINTMENT_ID, PATIENT_USER_ID));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("opens"));
    }

    @Test
    void roomIsClosedAfterTheJoinWindowExpires() {
        LocalDateTime earlier = LocalDateTime.now().minusHours(3);
        appointment.setAppointmentDate(earlier.toLocalDate());
        appointment.setAppointmentTime(earlier.toLocalTime());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> videoCallService.getRoom(APPOINTMENT_ID, PATIENT_USER_ID));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("ended"));
    }

    @Test
    void signalingAuthorizationMirrorsTheRestRules() {
        String roomId = "room-token";
        when(videoSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(
                VideoSession.builder().appointmentId(APPOINTMENT_ID).roomId(roomId).build()));

        CallAuthorization patientAuth = videoCallService.authorizeRoomAccess(roomId, PATIENT_USER_ID);
        assertNotNull(patientAuth);
        assertEquals("PATIENT", patientAuth.getRole());

        assertNull(videoCallService.authorizeRoomAccess(roomId, STRANGER_USER_ID));
        assertNull(videoCallService.authorizeRoomAccess("unknown-room", PATIENT_USER_ID));

        appointment.setStatus(AppointmentStatus.PENDING);
        assertNull(videoCallService.authorizeRoomAccess(roomId, PATIENT_USER_ID),
                "A room token must not outlive the appointment state that granted it");
    }
}
