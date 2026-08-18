package com.medifind.doctor.repository;

import com.medifind.doctor.entity.Doctor;
import org.springframework.data.jpa.domain.Specification;

/**
 * JPA Specifications for composable, type-safe dynamic queries against the {@link Doctor} entity.
 * Each method returns a Specification that can be chained using {@code Specification.where().and()}.
 *
 * <p>Example usage in service layer:
 * <pre>
 *   Specification&lt;Doctor&gt; spec = Specification
 *       .where(DoctorSpecification.withSpecialization("Cardiology"))
 *       .and(DoctorSpecification.withCity("Mumbai"))
 *       .and(DoctorSpecification.isAvailable(true));
 * </pre>
 * </p>
 */
public class DoctorSpecification {

    /** Match doctors whose specialization contains the given string (case-insensitive). */
    public static Specification<Doctor> withSpecialization(String specialization) {
        return (root, query, cb) -> specialization == null || specialization.isBlank()
                ? null
                : cb.like(cb.lower(root.get("specialization")), "%" + specialization.toLowerCase() + "%");
    }

    /** Match doctors practicing in the given city (case-insensitive). */
    public static Specification<Doctor> withCity(String city) {
        return (root, query, cb) -> city == null || city.isBlank()
                ? null
                : cb.like(cb.lower(root.get("city")), "%" + city.toLowerCase() + "%");
    }

    /** Match doctors affiliated with a specific hospital. */
    public static Specification<Doctor> withHospitalId(Long hospitalId) {
        return (root, query, cb) -> hospitalId == null
                ? null
                : cb.equal(root.get("hospitalId"), hospitalId);
    }

    /** Filter by appointment availability. */
    public static Specification<Doctor> isAvailable(Boolean available) {
        return (root, query, cb) -> available == null
                ? null
                : cb.equal(root.get("available"), available);
    }

    /** Match doctors with a rating greater than or equal to the given minimum. */
    public static Specification<Doctor> withMinimumRating(Double minimumRating) {
        return (root, query, cb) -> minimumRating == null
                ? null
                : cb.greaterThanOrEqualTo(root.get("rating"), minimumRating);
    }

    /** Match doctors with experience greater than or equal to the given number of years. */
    public static Specification<Doctor> withMinimumExperience(Integer experience) {
        return (root, query, cb) -> experience == null
                ? null
                : cb.greaterThanOrEqualTo(root.get("experience"), experience);
    }
}
