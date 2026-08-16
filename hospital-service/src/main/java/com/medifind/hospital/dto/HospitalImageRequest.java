package com.medifind.hospital.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HospitalImageRequest {

    @NotBlank(message = "Image data is required")
    private String imageUrl;
}
