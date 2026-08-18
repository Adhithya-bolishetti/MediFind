package com.medifind.user.repository;

import com.medifind.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    java.util.Optional<User> findByEmail(String email);
    java.util.Optional<User> findByMobileNumber(String mobileNumber);
    boolean existsByRole(com.medifind.auth.entity.Role role);
    java.util.Optional<User> findFirstByRole(com.medifind.auth.entity.Role role);
    boolean existsByEmail(String email);
    boolean existsByMobileNumber(String mobileNumber);
}
