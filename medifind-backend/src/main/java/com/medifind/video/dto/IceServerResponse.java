package com.medifind.video.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * A single ICE server entry, shaped to match the browser's {@code RTCIceServer}
 * dictionary so it can be handed to {@code new RTCPeerConnection({ iceServers })}
 * untouched.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class IceServerResponse {
    private List<String> urls;
    private String username;
    private String credential;
}
