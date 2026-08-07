package com.medifind.hospital.repository;

import com.medifind.hospital.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for {@link Hospital} entities.
 */
@Repository
public interface HospitalRepository extends JpaRepository<Hospital, Long> {

    /** Check whether a hospital with the given email already exists. */
    boolean existsByEmail(String email);

    /** Find a hospital by its unique email address. */
    Optional<Hospital> findByEmail(String email);
}
