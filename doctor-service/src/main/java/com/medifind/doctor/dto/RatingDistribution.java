package com.medifind.doctor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatingDistribution {
    private Double averageRating;
    private Integer totalReviews;
    private Integer rating5;
    private Integer rating4;
    private Integer rating3;
    private Integer rating2;
    private Integer rating1;
}
