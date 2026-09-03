-- ══════════════════════════════════════════════════════════════════════
-- MediFind — DEV-ONLY seed accounts
--
-- Creates a patient, a doctor (with a doctor profile) and a CONFIRMED
-- online appointment scheduled for *right now*, so the video consultation
-- can be exercised end to end without clicking through booking.
--
-- All accounts share the DEMO password:  Test@12345
-- NEVER run this against anything but a local database.
--
-- Run AFTER the backend has started once (Hibernate creates the tables):
--   mysql -u root -p medifind_db < database/seed-dev-users.sql
-- ══════════════════════════════════════════════════════════════════════

USE medifind_db;

-- BCrypt hash of the DEMO credential "Test@12345".
SET @dev_password = '$2a$10$LyamFyjACjj.I3uEtrWueeAqz8aTtGz.cAgnN1efqGKbCVxNXB89i';

-- ── Patient ─────────────────────────────────────────────────────────
-- Login: mobile 5555555555 (+91) or dev.patient@medifind.com
INSERT INTO users (id, full_name, email, mobile_number, password, role, status,
                   phone, gender, date_of_birth, address, city, state, pincode,
                   emergency_contact_name, emergency_contact_phone,
                   created_at, updated_at)
VALUES (101, 'Dev Patient', 'dev.patient@medifind.com', '915555555555', @dev_password,
        'PATIENT', 'ACTIVE',
        '5555555555', 'MALE', '1995-04-12', '12 MG Road', 'Bengaluru', 'Karnataka', '560001',
        'Dev Contact', '5555500000',
        NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE password = @dev_password, status = 'ACTIVE', updated_at = NOW(6);

-- ── Doctor (user account) ───────────────────────────────────────────
-- Login: mobile 4444444444 (+91) or dev.doctor@medifind.com
INSERT INTO users (id, full_name, email, mobile_number, password, role, status,
                   phone, gender, date_of_birth, address, city, state, pincode,
                   created_at, updated_at)
VALUES (102, 'Dr. Dev Sharma', 'dev.doctor@medifind.com', '914444444444', @dev_password,
        'DOCTOR', 'ACTIVE',
        '4444444444', 'FEMALE', '1985-09-30', '4 Residency Road', 'Bengaluru', 'Karnataka', '560025',
        NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE password = @dev_password, status = 'ACTIVE', updated_at = NOW(6);

-- ── Doctor profile ──────────────────────────────────────────────────
-- APPROVED so the doctor is searchable, and open to online consultation
-- so the booking flow offers the "Online" mode.
INSERT INTO doctors (id, user_id, doctor_name, email, phone_number, gender, date_of_birth,
                     specialization, sub_specialization, qualification, medical_college,
                     medical_license_number, experience, about, consultation_fee, languages,
                     clinic_name, clinic_address, city, state, country, pincode,
                     available, working_days, consultation_start_time, consultation_end_time,
                     appointment_duration, available_for_online_consultation, available_for_emergency,
                     verification_status, rating, total_reviews,
                     rating5, rating4, rating3, rating2, rating1,
                     created_at, updated_at)
VALUES (101, 102, 'Dr. Dev Sharma', 'dev.doctor@medifind.com', '4444444444', 'FEMALE', '1985-09-30',
        'GENERAL_PHYSICIAN', 'Family Medicine', 'MBBS, MD', 'Bangalore Medical College',
        'KA-DEV-0001', 12, 'Seeded development doctor account.', 500.0, 'English,Hindi,Kannada',
        'Dev Care Clinic', '4 Residency Road', 'Bengaluru', 'Karnataka', 'India', '560025',
        TRUE, 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY', '09:00', '21:00',
        30, TRUE, FALSE,
        'APPROVED', 4.6, 12,
        8, 3, 1, 0, 0,
        NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
        verification_status = 'APPROVED',
        available = TRUE,
        available_for_online_consultation = TRUE,
        updated_at = NOW(6);

-- ── A CONFIRMED online appointment, scheduled for now ───────────────
-- The room opens 15 min before and closes 60 min after this time, so
-- re-run this statement whenever the window has lapsed.
INSERT INTO appointments (id, user_id, doctor_id, appointment_date, appointment_time,
                          reason, consultation_type, status, notes, created_at, updated_at)
VALUES (101, 101, 101, CURDATE(), CURTIME(),
        'Video consultation smoke test', 'Online', 'CONFIRMED',
        'Seeded by database/seed-dev-users.sql', NOW(6), NOW(6))
ON DUPLICATE KEY UPDATE
        appointment_date  = CURDATE(),
        appointment_time  = CURTIME(),
        consultation_type = 'Online',
        status            = 'CONFIRMED',
        updated_at        = NOW(6);

-- A fresh room is minted on first join; drop any stale one for this appointment.
DELETE FROM video_sessions WHERE appointment_id = 101;
