package com.medifind.hospital.repository;

import com.medifind.hospital.entity.HospitalImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HospitalImageRepository extends JpaRepository<HospitalImage, Long> {

    List<HospitalImage> findByHospitalIdOrderByDisplayOrderAsc(Long hospitalId);

    long countByHospitalId(Long hospitalId);

    void deleteByHospitalId(Long hospitalId);
}
