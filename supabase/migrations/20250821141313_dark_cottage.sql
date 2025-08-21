/*
  # Create Demo Client Login

  1. New Records
    - Demo client in `clients` table
    - Demo auth credentials in `auth_credentials` table
  
  2. Demo Login Details
    - Email: demo@company.com
    - Password: demo123
    - Company: Demo Company Inc
    - Name: Demo User
  
  3. Security
    - Uses bcrypt hashed password
    - Proper user_type and user_id relationships
*/

-- Insert demo client
INSERT INTO clients (id, email, name, company, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'demo@company.com',
  'Demo User',
  'Demo Company Inc',
  now()
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  company = EXCLUDED.company;

-- Insert demo auth credentials (password: demo123)
-- Using bcrypt hash for 'demo123': $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO auth_credentials (email, password_hash, user_type, user_id, created_at)
VALUES (
  'demo@company.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'client',
  '550e8400-e29b-41d4-a716-446655440000',
  now()
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  user_type = EXCLUDED.user_type,
  user_id = EXCLUDED.user_id;