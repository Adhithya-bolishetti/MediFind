package com.medifind.hospital.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HospitalImageResponse {
    private Long id;
    private Long hospitalId;
    private String imageUrl;
    private Integer displayOrder;
    private LocalDateTime createdAt;
}
