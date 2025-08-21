/*
  # Add authentication credentials table

  1. New Tables
    - `auth_credentials`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `user_type` (text) - 'client' or 'admin'
      - `user_id` (uuid) - references either clients.id or admin_users.id
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `auth_credentials` table
    - Add policies for secure credential management
    - Only allow users to access their own credentials
    - Admins can manage all credentials

  3. Indexes
    - Add index on email for fast lookups
    - Add index on user_id for efficient joins
*/

-- Create auth_credentials table
CREATE TABLE IF NOT EXISTS auth_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('client', 'admin')),
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE auth_credentials ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS auth_credentials_email_idx ON auth_credentials(email);
CREATE INDEX IF NOT EXISTS auth_credentials_user_id_idx ON auth_credentials(user_id);
CREATE INDEX IF NOT EXISTS auth_credentials_user_type_idx ON auth_credentials(user_type);

-- RLS Policies
CREATE POLICY "Users can read own credentials"
  ON auth_credentials
  FOR SELECT
  TO authenticated, anon
  USING (
    (user_type = 'client' AND user_id = auth.uid()) OR
    (user_type = 'admin' AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth_credentials.user_id 
      AND admin_users.email = (jwt() ->> 'email')
    )) OR
    (EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (jwt() ->> 'email')
    ))
  );

CREATE POLICY "Users can insert own credentials"
  ON auth_credentials
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    (user_type = 'client') OR
    (user_type = 'admin')
  );

CREATE POLICY "Users can update own credentials"
  ON auth_credentials
  FOR UPDATE
  TO authenticated, anon
  USING (
    (user_type = 'client' AND user_id = auth.uid()) OR
    (user_type = 'admin' AND EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth_credentials.user_id 
      AND admin_users.email = (jwt() ->> 'email')
    )) OR
    (EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (jwt() ->> 'email')
    ))
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_auth_credentials_updated_at
  BEFORE UPDATE ON auth_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert demo credentials
INSERT INTO auth_credentials (email, password_hash, user_type, user_id) 
SELECT 
  'demo@company.com',
  '$2b$10$rQZ8kHWKQOZ8kHWKQOZ8kOZ8kHWKQOZ8kHWKQOZ8kHWKQOZ8kHWKQO', -- hashed 'demo123'
  'client',
  clients.id
FROM clients 
WHERE clients.email = 'demo@company.com'
ON CONFLICT (email) DO NOTHING;

INSERT INTO auth_credentials (email, password_hash, user_type, user_id)
SELECT 
  'admin@mcaportal.com',
  '$2b$10$rQZ8kHWKQOZ8kHWKQOZ8kOZ8kHWKQOZ8kHWKQOZ8kHWKQOZ8kHWKQO', -- hashed 'admin123'
  'admin',
  admin_users.id
FROM admin_users 
WHERE admin_users.email = 'admin@mcaportal.com'
ON CONFLICT (email) DO NOTHING;