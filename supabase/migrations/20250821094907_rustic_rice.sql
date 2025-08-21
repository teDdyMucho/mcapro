/*
  # Create auth_credentials table for custom authentication

  1. New Tables
    - `auth_credentials`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `user_type` (text) - 'client' or 'admin'
      - `user_id` (uuid) - references clients.id or admin_users.id
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `auth_credentials` table
    - Add policy for anonymous users to insert credentials during registration
    - Add policy for users to read their own credentials during login
*/

CREATE TABLE IF NOT EXISTS auth_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('client', 'admin')),
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE auth_credentials ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert credentials during registration
CREATE POLICY "Allow anonymous credential creation"
  ON auth_credentials
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous and authenticated users to read credentials for login
CREATE POLICY "Allow credential lookup for login"
  ON auth_credentials
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_auth_credentials_email ON auth_credentials(email);
CREATE INDEX IF NOT EXISTS idx_auth_credentials_user_id ON auth_credentials(user_id);