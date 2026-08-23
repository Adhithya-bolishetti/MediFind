package com.medifind.doctor.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Rule-based symptom analysis engine.
 * <p>
 * Maps symptom text to medical specializations using a curated keyword dictionary
 * and calculates severity scores for emergency detection. No external NLP or ML
 * dependencies are required — the analysis is deterministic and fast.
 */
@Service
@Slf4j
public class SymptomAnalysisServiceImpl implements SymptomAnalysisService {

    // ─────────── Emergency severity scoring ───────────

    /** Cardiac keywords that strongly indicate an emergency (severity +80 each). */
    private static final List<String> EMERGENCY_CARDIAC_KEYWORDS = List.of(
            "heart pain", "cardiac pain", "chest pressure", "chest tightness",
            "heart discomfort", "chest discomfort", "crushing chest pain",
            "severe chest pain", "heart attack", "cardiac arrest",
            "pain radiating to arm", "jaw pain with chest pain"
    );

    /** Keywords that strongly indicate a medical emergency (severity +10 each). */
    private static final List<String> EMERGENCY_CRITICAL_KEYWORDS = List.of(
            "unconscious", "unresponsive", "seizure", "stroke", "paralysis",
            "severe bleeding", "heavy bleeding", "anaphylaxis", "overdose"
    );

    /** Keywords that indicate a moderate emergency (severity +7 each). */
    private static final List<String> EMERGENCY_HIGH_KEYWORDS = List.of(
            "chest pain", "difficulty breathing", "breathing difficulty", "can't breathe", "choking",
            "severe allergic", "severe head injury", "head trauma",
            "suicidal", "self harm", "deep wound", "major burn",
            "spinal injury", "severe burn"
    );

    /** Keywords that may indicate an emergency depending on context (severity +5 each). */
    private static final List<String> EMERGENCY_MODERATE_KEYWORDS = List.of(
            "high fever", "very high fever", "bleeding", "vomiting blood",
            "blood in stool", "severe pain", "abdominal pain",
            "fainting", "dizziness", "confusion", "dehydration",
            "swallowing difficulty", "eye injury", "throat swelling",
            "stiff neck", "purple rash", "sudden weakness"
    );

    /** Threshold at which a symptom set is classified as an emergency.
     *  A single critical keyword (10) or high keyword (7) should trigger on its own. */
    private static final int EMERGENCY_THRESHOLD = 7;

    // ─────────── Specialization keyword map ───────────
    // Each entry: specialization → list of symptom keywords (lower-case).
    // Order matters for multi-match: first match in the map wins the tie-break,
    // but the specialization with the MOST keyword hits wins overall.

    private static final Map<String, List<String>> SPECIALIZATION_KEYWORDS;

    static {
        Map<String, List<String>> map = new LinkedHashMap<>();

        map.put("GENERAL_PHYSICIAN", List.of(
                "fever", "cold", "cough", "flu", "influenza", "sore throat",
                "runny nose", "sneezing", "fatigue", "tired", "weakness",
                "body ache", "general pain", "malaise", "headache",
                "nausea", "vomiting", "diarrhea", "general", "checkup",
                "check-up", "routine", "wellness", "not feeling well",
                "feeling sick", "unwell", "temperature", "chills",
                "stuffy nose", "congestion", "watery eyes", "sinus",
                "stomach", "stomach pain", "abdominal discomfort",
                "indigestion", "loss of appetite", "weight loss"
        ));

        map.put("CARDIOLOGIST", List.of(
                "chest pain", "chest discomfort", "heart", "palpitation",
                "palpitations", "irregular heartbeat", "arrhythmia",
                "high blood pressure", "hypertension", "low blood pressure",
                "hypotension", "shortness of breath", "breathlessness",
                "edema", "swollen legs", "swollen ankles", "heart murmur",
                "angina", "dizziness", "fainting", "syncope",
                "blood pressure", "cholesterol", "cardiac"
        ));

        map.put("DERMATOLOGIST", List.of(
                "skin rash", "rash", "acne", "pimple", "eczema",
                "dermatitis", "psoriasis", "fungal infection", "ringworm",
                "itching", "itchy skin", "hives", "urticaria", "melanoma",
                "skin lesion", "wart", "mole", "dry skin", "oily skin",
                "hair loss", "balding", "dandruff", "nail problem",
                "skin allergy", "blister", "boil", "abscess",
                "sunburn", "pigmentation", "dark spots", "wrinkles",
                "skin infection", "cellulitis", "shingles"
        ));

        map.put("NEUROLOGIST", List.of(
                "migraine", "headache", "severe headache", "cluster headache",
                "epilepsy", "seizure", "numbness", "tingling",
                "paralysis", "weakness in arm", "weakness in leg",
                "memory loss", "forgetfulness", "concussion",
                "neuropathy", "sciatica", "tremor", "parkinson",
                "multiple sclerosis", "stroke symptoms", "brain",
                "spinal cord", "nerve pain", "neuralgia", "vertigo",
                "dizziness", "loss of balance", "slurred speech"
        ));

        map.put("ORTHOPEDIC", List.of(
                "knee pain", "back pain", "neck pain", "joint pain",
                "fracture", "broken bone", "sprain", "strain",
                "arthritis", "rheumatoid", "osteoporosis", "scoliosis",
                "torn ligament", "tendon", "rotator cuff", "frozen shoulder",
                "carpal tunnel", "heel pain", "ankle pain", "hip pain",
                "shoulder pain", "wrist pain", "muscle pain", "bone pain",
                "dislocation", "bursitis", "plantar fasciitis",
                "ligament tear", "meniscus", "ACL"
        ));

        map.put("PEDIATRICIAN", List.of(
                "child", "baby", "infant", "toddler", "kid",
                "pediatric", "child fever", "child cough",
                "child cold", "child vomiting", "child diarrhea",
                "child rash", "growth", "development", "vaccination",
                "immunization", "breastfeeding", "child pain",
                "child stomach", "newborn", "teenager", "adolescent"
        ));

        map.put("GYNECOLOGIST", List.of(
                "period", "menstrual", "menstruation", "pregnancy",
                "pregnant", "prenatal", "postnatal", "miscarriage",
                "fibroid", "ovarian", "cervical", "vaginal",
                "breast pain", "breast lump", "pelvic pain",
                "endometriosis", "pcos", "polycystic", "contraception",
                "fertility", "infertility", "menopause", "gynecological"
        ));

        map.put("PSYCHIATRIST", List.of(
                "depression", "anxiety", "panic attack", "bipolar",
                "schizophrenia", "ptsd", "insomnia", "sleep disorder",
                "eating disorder", "ocd", "adhd", "addiction",
                "substance abuse", "alcoholism", "suicidal thoughts",
                "mental health", "mood disorder", "stress",
                "counseling", "therapy", "psychological", "hallucination",
                "paranoia", "phobia", "behavioral"
        ));

        map.put("OPHTHALMOLOGIST", List.of(
                "eye pain", "eye irritation", "eye infection",
                "blurry vision", "vision loss", "double vision",
                "glaucoma", "cataract", "conjunctivitis", "pink eye",
                "dry eyes", "red eyes", "eye injury", "eye swelling",
                "eyelid", "retina", "refractive error", "myopia",
                "hyperopia", "astigmatism", "squint", "lazy eye"
        ));

        map.put("ENT_SPECIALIST", List.of(
                "ear pain", "earache", "ear infection", "hearing loss",
                "tinnitus", "nosebleed", "sinusitis", "tonsillitis",
                "sore throat", "throat infection", "voice hoarseness",
                "swollen throat", "adenoid", "nasal congestion",
                "deviated septum", "snoring", "sleep apnea",
                "vertigo", "ear discharge", "ear blockage",
                "thyroid", "neck lump", "salivary gland"
        ));

        map.put("DENTIST", List.of(
                "tooth pain", "toothache", "dental", "cavity",
                "tooth decay", "gum disease", "gingivitis",
                "bleeding gums", "swollen gums", "broken tooth",
                "tooth fracture", "wisdom tooth", "teeth whitening",
                "dental implant", "root canal", "oral pain",
                "jaw pain", "tmj", "teething", "dental filling",
                "plaque", "tartar", "bad breath", "halitosis"
        ));

        map.put("GASTROENTEROLOGIST", List.of(
                "acid reflux", "heartburn", "gerd", "ulcer",
                "stomach ulcer", "gastritis", "ibs", "irritable bowel",
                "crohn", "colitis", "liver", "hepatitis", "gallstone",
                "pancreatitis", "bloating", "constipation", "hemorrhoid",
                "rectal bleeding", "esophagus", "celiac",
                "swallowing difficulty", "dysphagia", "jaundice"
        ));

        map.put("PULMONOLOGIST", List.of(
                "asthma", "copd", "bronchitis", "pneumonia",
                "pulmonary", "lung", "wheezing", "chronic cough",
                "tuberculosis", "tb", "pleurisy", "pulmonary embolism",
                "sleep apnea", "respiratory", "breathing problem",
                "shortness of breath", "breathlessness"
        ));

        map.put("UROLOGIST", List.of(
                "kidney stone", "urinary", "urination", "dysuria",
                "frequent urination", "blood in urine", "hematuria",
                "bladder", "prostate", "erectile dysfunction",
                "kidney infection", "uti", "urinary tract infection",
                "incontinence", "enlarged prostate", "bph",
                "testicular pain", "penile"
        ));

        map.put("ONCOLOGIST", List.of(
                "tumor", "cancer", "lump", "unexplained weight loss",
                "chemotherapy", "radiation", "malignant", "metastasis",
                "leukemia", "lymphoma", "biopsy", "oncology",
                "benign tumor", "suspicious growth", "abnormal cells"
        ));

        map.put("ENDOCRINOLOGIST", List.of(
                "diabetes", "thyroid", "hormone", "insulin",
                "blood sugar", "hyperthyroidism", "hypothyroidism",
                "goiter", "cushing", "addison", "osteoporosis",
                "metabolic", "obesity", "weight gain",
                "excessive thirst", "frequent urination"
        ));

        map.put("NEPHROLOGIST", List.of(
                "kidney", "renal", "dialysis", "chronic kidney",
                "kidney failure", "proteinuria", "albuminuria",
                "kidney infection", "nephritis", "polycystic kidney",
                "electrolyte imbalance", "creatinine"
        ));

        SPECIALIZATION_KEYWORDS = Collections.unmodifiableMap(map);
    }

    @Override
    public SymptomAnalysis analyse(List<String> symptoms) {
        if (symptoms == null || symptoms.isEmpty()) {
            return new SymptomAnalysis("GENERAL_PHYSICIAN", false, "NORMAL", 0.0,
                    List.of(), 0, "No symptoms provided — consider a general consultation.");
        }

        // Normalise symptoms (lowercase, trim, remove punctuation)
        List<String> normalised = symptoms.stream()
                .filter(s -> s != null && !s.isBlank())
                .map(s -> s.trim().toLowerCase(Locale.ENGLISH).replaceAll("\\p{Punct}", ""))
                .collect(Collectors.toList());

        if (normalised.isEmpty()) {
            return new SymptomAnalysis("GENERAL_PHYSICIAN", false, "NORMAL", 0.0,
                    List.of(), 0, "No valid symptoms provided — consider a general consultation.");
        }

        // 1. Emergency detection
        int severityScore = calculateSeverityScore(normalised);
        boolean emergency = severityScore >= EMERGENCY_THRESHOLD;
        String conditionType = emergency ? "EMERGENCY" : "NORMAL";

        log.info("Symptoms: {}", symptoms);
        log.info("Severity Score: {}", severityScore);
        log.info("Condition Type: {}", conditionType);

        // 2. Specialization matching
        Map<String, Long> specScores = new LinkedHashMap<>();
        List<String> matchedSymptoms = new ArrayList<>();

        for (String symptom : normalised) {
            for (Map.Entry<String, List<String>> entry : SPECIALIZATION_KEYWORDS.entrySet()) {
                for (String keyword : entry.getValue()) {
                    if (symptom.contains(keyword) || keyword.contains(symptom)) {
                        specScores.merge(entry.getKey(), 1L, Long::sum);
                        if (!matchedSymptoms.contains(symptom)) {
                            matchedSymptoms.add(symptom);
                        }
                    }
                }
            }
        }

        // Find best specialization
        String bestSpec = "GENERAL_PHYSICIAN";
        long bestScore = 0;

        // Sort by score descending, then by map order (first = more common) for tie-breaking
        for (Map.Entry<String, List<String>> entry : SPECIALIZATION_KEYWORDS.entrySet()) {
            long score = specScores.getOrDefault(entry.getKey(), 0L);
            if (score > bestScore) {
                bestScore = score;
                bestSpec = entry.getKey();
            }
        }

        // If no symptoms matched any specialization, default to GENERAL_PHYSICIAN
        if (bestScore == 0) {
            matchedSymptoms = normalised; // treat all as unmatched
            bestSpec = "GENERAL_PHYSICIAN";
        }

        // Calculate confidence (0.0 – 1.0)
        double confidence;
        if (emergency) {
            // Emergency confidence should reflect the severity strongly.
            if (severityScore >= 100) {
                confidence = 0.99;
            } else if (severityScore >= 90) {
                confidence = 0.95;
            } else if (severityScore >= 80) {
                confidence = 0.85;
            } else {
                confidence = 0.80 + (Math.min(severityScore, 100) / 100.0) * 0.10;
            }
            // Ensure appropriate specialist for severe cardiac emergencies if it defaulted to GP
            if (severityScore >= 80 && "GENERAL_PHYSICIAN".equals(bestSpec)) {
                String combined = String.join(" ", normalised);
                boolean isCardiac = EMERGENCY_CARDIAC_KEYWORDS.stream().anyMatch(combined::contains);
                if (isCardiac) {
                    bestSpec = "CARDIOLOGIST";
                }
            }
        } else {
            confidence = normalised.isEmpty() ? 0.0
                    : Math.min(1.0, (double) bestScore / normalised.size());
            // Boost confidence slightly for multi-symptom matches
            if (bestScore > 1) {
                confidence = Math.min(1.0, confidence + 0.1);
            }
            if (bestScore == 0) {
                confidence = 0.3; // low confidence if we fell back to GP
            }
        }
        confidence = Math.round(confidence * 100.0) / 100.0;

        // Build matched symptoms display
        String matchedDisplay = matchedSymptoms.stream()
                .map(s -> capitalize(s))
                .collect(Collectors.joining(", "));

        // Build explanation
        String explanation;
        if (emergency) {
            explanation = "Emergency condition detected (severity: " + severityScore + "/100). "
                    + "Symptoms matched: " + matchedDisplay + ". "
                    + "Seek immediate medical attention.";
        } else {
            explanation = "Normal condition detected (severity: " + severityScore + "/100). "
                    + "Symptoms matched: " + matchedDisplay + ". "
                    + "Recommended specialist: " + formatSpecialization(bestSpec) + ". "
                    + "Book an appointment with a specialist.";
        }

        log.info("Classification complete: conditionType={}, specialization={}, confidence={}, severity={}",
                conditionType, bestSpec, confidence, severityScore);

        return new SymptomAnalysis(bestSpec, emergency, conditionType, confidence,
                matchedSymptoms, severityScore, explanation);
    }

    /**
     * Calculate a severity score from the given symptom strings.
     * Higher scores indicate more severe / emergency situations.
     */
    private int calculateSeverityScore(List<String> symptoms) {
        int score = 0;

        String combined = String.join(" ", symptoms);

        for (String keyword : EMERGENCY_CARDIAC_KEYWORDS) {
            if (combined.contains(keyword)) {
                score += 80;
            }
        }
        for (String keyword : EMERGENCY_CRITICAL_KEYWORDS) {
            if (combined.contains(keyword)) {
                score += 10;
            }
        }
        for (String keyword : EMERGENCY_HIGH_KEYWORDS) {
            if (combined.contains(keyword)) {
                score += 7;
            }
        }
        for (String keyword : EMERGENCY_MODERATE_KEYWORDS) {
            if (combined.contains(keyword)) {
                score += 5;
            }
        }

        return Math.min(score, 100); // cap at 100
    }

    /** Capitalize first letter of each word. */
    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Arrays.stream(s.split("\\s+"))
                .map(word -> word.substring(0, 1).toUpperCase(Locale.ENGLISH) + word.substring(1))
                .collect(Collectors.joining(" "));
    }

    /** Format enum-style name to human-readable. */
    private String formatSpecialization(String spec) {
        return Arrays.stream(spec.split("_"))
                .map(word -> word.substring(0, 1).toUpperCase(Locale.ENGLISH) + word.substring(1).toLowerCase(Locale.ENGLISH))
                .collect(Collectors.joining(" "));
    }
}
