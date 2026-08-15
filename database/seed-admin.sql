-- ============================================================
-- MediFind — Admin Account Seed
-- ============================================================
-- Creates (or resets) the ADMIN user used for the Admin Dashboard.
--
--   Email:    911234567890@medifind.com
--   Password: admin123            <-- plaintext for documentation only;
--                                     only the BCrypt hash below is stored
--
-- The login form prepends the +91 country code to the mobile number,
-- so the mobile number to type at /login is: 1234567890
--
-- To regenerate the BCrypt hash for a different password, compile and run
-- the small helper at database/GenHash.java (requires spring-security-crypto
-- on the classpath) and paste the new hash here.
-- ============================================================

USE medifind_db;

INSERT INTO users (id, email, full_name, password, role, status, created_at, updated_at)
VALUES (
  20,
  '911234567890@medifind.com',
  'MediFind Admin',
  -- BCrypt hash of "admin123"
  '$2a$10$uBeNR2YA.irvHJhXaL.58uerikDFw3YQ7mz6f5xwFeo2PS3Rkb3x2',
  'ADMIN',
  'ACTIVE',
  NOW(6),
  NOW(6)
)
ON DUPLICATE KEY UPDATE
  full_name = 'MediFind Admin',
  password  = '$2a$10$uBeNR2YA.irvHJhXaL.58uerikDFw3YQ7mz6f5xwFeo2PS3Rkb3x2',
  role      = 'ADMIN',
  status    = 'ACTIVE',
  updated_at = NOW(6);
