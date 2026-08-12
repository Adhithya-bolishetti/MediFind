package com.medifind.doctor.repository;

import com.medifind.doctor.entity.DoctorReview;
import com.medifind.doctor.entity.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorReviewRepository extends JpaRepository<DoctorReview, Long> {
    
    List<DoctorReview> findByDoctorIdAndStatus(Long doctorId, ReviewStatus status);
    
    List<DoctorReview> findByDoctorId(Long doctorId);

    Optional<DoctorReview> findByAppointmentId(Long appointmentId);
    
    boolean existsByAppointmentId(Long appointmentId);
}
