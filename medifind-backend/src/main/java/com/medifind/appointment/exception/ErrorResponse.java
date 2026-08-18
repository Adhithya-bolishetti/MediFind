package com.medifind.appointment.exception;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Standard error response body returned by the {@link GlobalExceptionHandler}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {

    private LocalDateTime timestamp;
    private int status;
    private String message;
    private String path;
}
