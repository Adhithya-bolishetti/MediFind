package com.medifind.doctor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyCheckResponse {
    private boolean emergency;
    private String message;
    private String recommendedAction;
}
