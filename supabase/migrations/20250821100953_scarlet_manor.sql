/*
  # Fix clients table RLS policy for registration

  1. Security Updates
    - Update INSERT policy to allow anonymous users to create client accounts
    - Maintain data isolation for existing users
    - Keep admin access intact

  2. Changes
    - Modified "Allow client registration" policy to properly allow anonymous inserts
    - Ensures registration works while maintaining security
*/

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Allow client registration" ON clients;

-- Create a new policy that allows anonymous users to insert client records
CREATE POLICY "Allow client registration"
  ON clients
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Ensure the existing SELECT policy allows proper access
DROP POLICY IF EXISTS "Clients can read own data" ON clients;

CREATE POLICY "Clients can read own data"
  ON clients
  FOR SELECT
  TO anon, authenticated
  USING (
    -- User can read their own data if authenticated
    (auth.uid() IS NOT NULL AND auth.uid()::text = id::text) OR
    -- Admins can read all data
    (EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )) OR
    -- Demo user access (for anonymous demo)
    (auth.uid() IS NULL AND email = 'demo@company.com')
  );

-- Ensure UPDATE policy allows users to update their own data
DROP POLICY IF EXISTS "Clients can update own data" ON clients;

CREATE POLICY "Clients can update own data"
  ON clients
  FOR UPDATE
  TO anon, authenticated
  USING (
    -- User can update their own data if authenticated
    (auth.uid() IS NOT NULL AND auth.uid()::text = id::text) OR
    -- Demo user access (for anonymous demo)
    (auth.uid() IS NULL AND email = 'demo@company.com')
  );