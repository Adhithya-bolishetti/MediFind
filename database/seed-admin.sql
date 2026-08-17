USE medifind_db;

INSERT INTO users (id, email, mobile_number, full_name, password, role, status, created_at, updated_at)
VALUES (
  20,
  '9392392909@medifind.com',
  '919392392909',
  'MediFind Admin',
  -- BCrypt hash of DEMO credential
  '$2a$10$E1e0FfSy/CMm6y2FWqUAXeXBnfbTkUfJy0JFaEvXs9vuC6N8jHUyK',
  'ADMIN',
  'ACTIVE',
  NOW(6),
  NOW(6)
)
ON DUPLICATE KEY UPDATE
  full_name     = 'MediFind Admin',
  email         = '9392392909@medifind.com',
  mobile_number = '919392392909',
  password      = '$2a$10$E1e0FfSy/CMm6y2FWqUAXeXBnfbTkUfJy0JFaEvXs9vuC6N8jHUyK',
  role          = 'ADMIN',
  status        = 'ACTIVE',
  updated_at    = NOW(6);
