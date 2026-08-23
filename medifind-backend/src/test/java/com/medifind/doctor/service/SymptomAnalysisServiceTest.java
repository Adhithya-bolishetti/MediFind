package com.medifind.doctor.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link SymptomAnalysisServiceImpl}.
 * Covers normal symptoms, emergency symptoms, mixed symptoms,
 * unknown symptoms, and edge cases.
 */
class SymptomAnalysisServiceTest {

    private SymptomAnalysisServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new SymptomAnalysisServiceImpl();
    }

    // ─────────── Normal symptom tests ───────────

    @Test
    @DisplayName("Fever, cold, cough → GENERAL_PHYSICIAN")
    void feverColdCoughShouldRecommendGeneralPhysician() {
        var result = service.analyse(List.of("fever", "cold", "cough"));
        assertEquals("GENERAL_PHYSICIAN", result.specialization());
        assertFalse(result.emergency());
        assertTrue(result.confidence() > 0);
        assertFalse(result.matchedSymptoms().isEmpty());
    }

    @Test
    @DisplayName("Chest discomfort is now an emergency as per new rules")
    void chestDiscomfortShouldRecommendCardiologist() {
        var result = service.analyse(List.of("chest discomfort"));
        assertEquals("CARDIOLOGIST", result.specialization());
        assertTrue(result.emergency());
    }

    @Test
    @DisplayName("Skin rash, acne → DERMATOLOGIST")
    void skinRashAcneShouldRecommendDermatologist() {
        var result = service.analyse(List.of("skin rash", "acne"));
        assertEquals("DERMATOLOGIST", result.specialization());
        assertFalse(result.emergency());
    }

    @Test
    @DisplayName("Migraine, dizziness → NEUROLOGIST")
    void migraineDizzinessShouldRecommendNeurologist() {
        var result = service.analyse(List.of("migraine", "dizziness"));
        assertEquals("NEUROLOGIST", result.specialization());
        assertFalse(result.emergency());
    }

    @Test
    @DisplayName("Knee pain, fracture → ORTHOPEDIC")
    void kneePainFractureShouldRecommendOrthopedic() {
        var result = service.analyse(List.of("knee pain", "fracture"));
        assertEquals("ORTHOPEDIC", result.specialization());
        assertFalse(result.emergency());
    }

    @Test
    @DisplayName("Child fever → PEDIATRICIAN")
    void childFeverShouldRecommendPediatrician() {
        var result = service.analyse(List.of("child fever"));
        assertEquals("PEDIATRICIAN", result.specialization());
        assertFalse(result.emergency());
    }

    @Test
    @DisplayName("Eye pain → OPHTHALMOLOGIST")
    void eyePainShouldRecommendOphthalmologist() {
        var result = service.analyse(List.of("eye pain"));
        assertEquals("OPHTHALMOLOGIST", result.specialization());
        assertFalse(result.emergency());
    }

    @Test
    @DisplayName("Ear pain → ENT_SPECIALIST")
    void earPainShouldRecommendEntSpecialist() {
        var result = service.analyse(List.of("ear pain"));
        assertEquals("ENT_SPECIALIST", result.specialization());
        assertFalse(result.emergency());
    }

    @Test
    @DisplayName("Tooth pain → DENTIST")
    void toothPainShouldRecommendDentist() {
        var result = service.analyse(List.of("tooth pain"));
        assertEquals("DENTIST", result.specialization());
        assertFalse(result.emergency());
    }

    // ─────────── Emergency symptom tests ───────────

    @Test
    @DisplayName("Severe chest pain → emergency")
    void severeChestPainShouldBeEmergency() {
        var result = service.analyse(List.of("severe chest pain"));
        assertTrue(result.emergency());
        assertTrue(result.severityScore() >= 7);
    }

    @Test
    @DisplayName("Heart attack symptoms → emergency")
    void heartAttackShouldBeEmergency() {
        var result = service.analyse(List.of("heart attack"));
        assertTrue(result.emergency());
        assertTrue(result.severityScore() >= 7);
    }

    @Test
    @DisplayName("Stroke symptoms → emergency")
    void strokeShouldBeEmergency() {
        var result = service.analyse(List.of("stroke"));
        assertTrue(result.emergency());
        assertTrue(result.severityScore() >= 7);
    }

    @Test
    @DisplayName("Unconsciousness → emergency")
    void unconsciousnessShouldBeEmergency() {
        var result = service.analyse(List.of("unconscious"));
        assertTrue(result.emergency());
        assertTrue(result.severityScore() >= 7);
    }

    @Test
    @DisplayName("Heavy bleeding → emergency")
    void heavyBleedingShouldBeEmergency() {
        var result = service.analyse(List.of("heavy bleeding"));
        assertTrue(result.emergency());
        assertTrue(result.severityScore() >= 7);
    }

    @Test
    @DisplayName("Difficulty breathing → emergency")
    void difficultyBreathingShouldBeEmergency() {
        var result = service.analyse(List.of("difficulty breathing"));
        assertTrue(result.emergency());
        assertTrue(result.severityScore() >= 7);
    }

    @Test
    @DisplayName("Seizures → emergency")
    void seizuresShouldBeEmergency() {
        var result = service.analyse(List.of("seizure"));
        assertTrue(result.emergency());
        assertTrue(result.severityScore() >= 7);
    }

    // ─────────── Mixed symptom tests ───────────

    @Test
    @DisplayName("Chest pain + fever → emergency (chest pain triggers it)")
    void mixedSymptomsEmergencyAndNormal() {
        var result = service.analyse(List.of("chest pain", "fever"));
        assertTrue(result.emergency());
        assertTrue(result.severityScore() >= 7);
    }

    @Test
    @DisplayName("Fever + breathing difficulty → emergency")
    void feverWithBreathingDifficulty() {
        var result = service.analyse(List.of("fever", "breathing difficulty"));
        assertTrue(result.emergency());
    }

    // ─────────── Unknown symptom tests ───────────

    @Test
    @DisplayName("Unknown symptom → GENERAL_PHYSICIAN with low confidence")
    void unknownSymptomShouldDefaultToGeneralPhysician() {
        var result = service.analyse(List.of("xyzabc123"));
        assertEquals("GENERAL_PHYSICIAN", result.specialization());
        assertFalse(result.emergency());
        assertTrue(result.confidence() <= 0.5);
    }

    @Test
    @DisplayName("Empty symptom list → GENERAL_PHYSICIAN")
    void emptySymptomList() {
        var result = service.analyse(List.of());
        assertEquals("GENERAL_PHYSICIAN", result.specialization());
        assertFalse(result.emergency());
    }

    @Test
    @DisplayName("Null symptom list → GENERAL_PHYSICIAN")
    void nullSymptomList() {
        var result = service.analyse(null);
        assertEquals("GENERAL_PHYSICIAN", result.specialization());
        assertFalse(result.emergency());
    }

    // ─────────── Confidence tests ───────────

    @Test
    @DisplayName("Single symptom match has moderate confidence")
    void singleSymptomHasModerateConfidence() {
        var result = service.analyse(List.of("fever"));
        assertTrue(result.confidence() > 0.0);
        assertTrue(result.confidence() <= 1.0);
    }

    @Test
    @DisplayName("Multiple matching symptoms have higher confidence")
    void multipleMatchingSymptomsHigherConfidence() {
        var single = service.analyse(List.of("fever"));
        var multiple = service.analyse(List.of("fever", "cold", "cough"));
        assertTrue(multiple.confidence() >= single.confidence());
    }

    // ─────────── Reason text tests ───────────

    @Test
    @DisplayName("Reason includes matched symptoms")
    void reasonIncludesMatchedSymptoms() {
        var result = service.analyse(List.of("fever", "cough"));
        assertNotNull(result.explanation());
        assertTrue(result.explanation().contains("Fever"));
        assertTrue(result.explanation().contains("Cough"));
    }

    @Test
    @DisplayName("Emergency reason includes severity score")
    void emergencyReasonIncludesSeverity() {
        var result = service.analyse(List.of("severe chest pain"));
        assertTrue(result.explanation().contains("Emergency"));
        assertTrue(result.explanation().contains("severity"));
    }
}
