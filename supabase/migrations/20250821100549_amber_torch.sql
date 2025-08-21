/*
  # Create auth_credentials table for user authentication

  1. New Tables
    - `auth_credentials`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `user_type` (text, either 'client' or 'admin')
      - `user_id` (uuid, references the actual user record)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `auth_credentials` table
    - Add policy for anonymous credential creation during registration
    - Add policy for credential lookup during login

  3. Indexes
    - Index on email for fast lookups
    - Index on user_id for joins
*/

CREATE TABLE IF NOT EXISTS auth_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('client', 'admin')),
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_credentials_email ON auth_credentials(email);
CREATE INDEX IF NOT EXISTS idx_auth_credentials_user_id ON auth_credentials(user_id);

-- Enable RLS
ALTER TABLE auth_credentials ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to create credentials during registration
CREATE POLICY "Allow anonymous credential creation"
  ON auth_credentials
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow credential lookup for login (both anon and authenticated users)
CREATE POLICY "Allow credential lookup for login"
  ON auth_credentials
  FOR SELECT
  TO anon, authenticated
  USING (true);