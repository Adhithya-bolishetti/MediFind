package com.medifind.video.controller;

import com.medifind.video.dto.VideoRoomResponse;
import com.medifind.video.service.VideoCallService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/video")
@RequiredArgsConstructor
@Tag(name = "Video Consultation", description = "WebRTC consultation rooms for online appointments")
public class VideoCallController {

    private final VideoCallService videoCallService;

    @GetMapping("/appointments/{appointmentId}/room")
    @Operation(summary = "Resolve the consultation room for an appointment",
            description = "Returns the signaling room and ICE configuration. Fails with 400/403 when the "
                    + "appointment is not an accepted online consultation, the caller is not a participant, "
                    + "or the join window is closed.")
    public ResponseEntity<VideoRoomResponse> getRoom(
            @PathVariable Long appointmentId,
            @RequestAttribute(value = "X-User-Id", required = false) Long userId) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to join the consultation");
        }
        return ResponseEntity.ok(videoCallService.getRoom(appointmentId, userId));
    }
}
