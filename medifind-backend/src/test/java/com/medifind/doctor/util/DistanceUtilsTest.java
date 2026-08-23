package com.medifind.doctor.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link DistanceUtils} Haversine distance calculation.
 */
class DistanceUtilsTest {

    @Test
    @DisplayName("Same point should return ~0 km")
    void samePointReturnsZero() {
        double distance = DistanceUtils.haversineKm(17.385, 78.486, 17.385, 78.486);
        assertEquals(0.0, distance, 0.001);
    }

    @Test
    @DisplayName("Known distance: Hyderabad to Bangalore ≈ 500 km")
    void hyderabadToBangalore() {
        // Hyderabad: 17.385, 78.486  Bangalore: 12.972, 77.594
        double distance = DistanceUtils.haversineKm(17.385, 78.486, 12.972, 77.594);
        assertEquals(500.0, distance, 30.0); // within 30 km tolerance
    }

    @Test
    @DisplayName("Known distance: Delhi to Mumbai ≈ 1,150 km")
    void delhiToMumbai() {
        // Delhi: 28.614, 77.209  Mumbai: 19.076, 72.878
        double distance = DistanceUtils.haversineKm(28.614, 77.209, 19.076, 72.878);
        assertEquals(1150.0, distance, 50.0);
    }

    @Test
    @DisplayName("Very close points (within 1 km)")
    void closePoints() {
        double distance = DistanceUtils.haversineKm(17.385, 78.486, 17.390, 78.490);
        assertTrue(distance < 1.0);
        assertTrue(distance > 0.0);
    }

    @Test
    @DisplayName("Antipodal points should be ~20,000 km")
    void antipodalPoints() {
        // North pole to south pole
        double distance = DistanceUtils.haversineKm(90.0, 0.0, -90.0, 0.0);
        assertEquals(20000.0, distance, 200.0);
    }

    @Test
    @DisplayName("Distance is commutative")
    void distanceIsCommutative() {
        double d1 = DistanceUtils.haversineKm(17.385, 78.486, 12.972, 77.594);
        double d2 = DistanceUtils.haversineKm(12.972, 77.594, 17.385, 78.486);
        assertEquals(d1, d2, 0.001);
    }
}
