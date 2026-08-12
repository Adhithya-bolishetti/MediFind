package com.medifind.hospital.repository;

import com.medifind.hospital.entity.HospitalReview;
import com.medifind.hospital.entity.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HospitalReviewRepository extends JpaRepository<HospitalReview, Long> {
    
    List<HospitalReview> findByHospitalId(Long hospitalId);
    
    Optional<HospitalReview> findByAppointmentId(Long appointmentId);
    
    boolean existsByAppointmentId(Long appointmentId);
}
