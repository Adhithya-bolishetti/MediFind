package com.medifind.doctor.repository;

import com.medifind.doctor.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for {@link Doctor} entities.
 * Extends {@link JpaSpecificationExecutor} to enable dynamic search via Specifications.
 */
@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long>, JpaSpecificationExecutor<Doctor> {

    /** Check if a doctor with the given email already exists. */
    boolean existsByEmail(String email);

    /** Find a doctor by their unique email address. */
    Optional<Doctor> findByEmail(String email);
}
