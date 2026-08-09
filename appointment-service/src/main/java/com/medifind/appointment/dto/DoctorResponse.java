package com.medifind.appointment.dto;

import lombok.Data;

@Data
public class DoctorResponse {
    private Long id;
    private String doctorName;
    private String specialization;
    private String qualification;
    private Integer experience;
    private Double consultationFee;
    private Double rating;
    private Long hospitalId;
    private String city;
    private String state;
    private String phoneNumber;
    private String email;
    private String profileImage;
    private boolean available;
}
