package com.medifind.user.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UserProfileUpdateRequest {
    private String fullName;
    private String phone;
    private String gender;
    private LocalDate dateOfBirth;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String profileImage;
    private String emergencyContactName;
    private String emergencyContactPhone;
}
