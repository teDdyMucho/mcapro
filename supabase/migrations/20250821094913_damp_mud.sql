/*
  # Fix clients table RLS policy for registration

  1. Security Updates
    - Update clients table RLS policies to allow anonymous registration
    - Ensure anonymous users can create client accounts
    - Maintain security for existing operations
*/

-- Drop existing restrictive INSERT policy if it exists
DROP POLICY IF EXISTS "Allow anonymous client creation for demo" ON clients;

-- Create new policy that allows anonymous users to insert client records during registration
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
    -- Allow if user is authenticated and owns the record
    (auth.uid() IS NOT NULL AND auth.uid()::text = id::text) OR
    -- Allow admins to read all client data
    (EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )) OR
    -- Allow anonymous demo user access
    (auth.uid() IS NULL AND email = 'demo@company.com')
  );

-- Update the UPDATE policy to be consistent
DROP POLICY IF EXISTS "Clients can update own data" ON clients;

CREATE POLICY "Clients can update own data"
  ON clients
  FOR UPDATE
  TO anon, authenticated
  USING (
    -- Allow if user is authenticated and owns the record
    (auth.uid() IS NOT NULL AND auth.uid()::text = id::text) OR
    -- Allow anonymous demo user access
    (auth.uid() IS NULL AND email = 'demo@company.com')
  );