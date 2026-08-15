-- ============================================================
-- MediFind — Admin Account Seed
-- ============================================================
-- Creates (or resets) the ADMIN user used for the Admin Dashboard.
--
--   Email:    9392392909@medifind.com
--   Password: Admin@232470        <-- plaintext for documentation only;
--                                     only the BCrypt hash below is stored
--
-- The login form prepends the +91 country code to the mobile number,
-- so the mobile number to type at /login is: 9392392909
--
-- To regenerate the BCrypt hash for a different password, compile and run
-- the small helper at database/GenHash.java (requires spring-security-crypto
-- on the classpath) and paste the new hash here.
-- ============================================================

USE medifind_db;

INSERT INTO users (id, email, mobile_number, full_name, password, role, status, created_at, updated_at)
VALUES (
  20,
  '9392392909@medifind.com',
  '919392392909',
  'MediFind Admin',
  -- BCrypt hash of "Admin@232470"
  '$2a$10$Hdy2iUsQm2eqLaYMKeyhueR3cJHkEUyQ2gBX5jrB39fkIrP7gFIea',
  'ADMIN',
  'ACTIVE',
  NOW(6),
  NOW(6)
)
ON DUPLICATE KEY UPDATE
  full_name     = 'MediFind Admin',
  email         = '9392392909@medifind.com',
  mobile_number = '919392392909',
  password      = '$2a$10$Hdy2iUsQm2eqLaYMKeyhueR3cJHkEUyQ2gBX5jrB39fkIrP7gFIea',
  role          = 'ADMIN',
  status        = 'ACTIVE',
  updated_at    = NOW(6);
