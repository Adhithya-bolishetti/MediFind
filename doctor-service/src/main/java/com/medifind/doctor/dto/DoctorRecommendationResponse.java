package com.medifind.doctor.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DoctorRecommendationResponse {
    private Long doctorId;
    private String doctorName;
    private String specialization;
    private Integer experience;
    private Double rating;
    private String hospital;
    private String city;
    private boolean available;
    private Double recommendationScore;
}
