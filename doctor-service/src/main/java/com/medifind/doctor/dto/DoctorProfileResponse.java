package com.medifind.doctor.dto;

import com.medifind.doctor.entity.Specialization;
import com.medifind.doctor.entity.VerificationStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class DoctorProfileResponse {
    private Long id;
    private String doctorName;
    private String email;
    private String phoneNumber;
    private String gender;
    private LocalDate dateOfBirth;
    private String profileImage;
    private Specialization specialization;
    private String subSpecialization;
    private String qualification;
    private String medicalCollege;
    private String medicalLicenseNumber;
    private Integer experience;
    private String about;
    private Double consultationFee;
    private String languages;
    private String clinicName;
    private String clinicAddress;
    private String city;
    private String state;
    private String country;
    private String pincode;
    private Double latitude;
    private Double longitude;
    private String workingDays;
    private String consultationStartTime;
    private String consultationEndTime;
    private Integer appointmentDuration;
    private boolean availableForOnlineConsultation;
    private boolean availableForEmergency;
    private VerificationStatus verificationStatus;
    private String licenseCertificatePath;
    private String rejectionReason;
    
    private Double rating;
    private Integer totalReviews;
    private RatingDistribution ratingDistribution;
}
