package com.medifind.doctor.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AvailableSlotResponse {
    private Long doctorId;
    private String date;
    private List<String> slots;
}
