/*
  # Fix clients table RLS policies for registration

  1. Policy Updates
    - Update INSERT policy to allow anonymous client creation during registration
    - Maintain existing security for other operations
    - Ensure demo user support continues to work

  2. Security
    - Anonymous users can create client records during registration
    - Users can only access their own data after authentication
    - Admin users can access all client data
    - Demo users have special access patterns
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Allow anonymous client creation for demo" ON clients;

-- Create new INSERT policy that allows registration
CREATE POLICY "Allow anonymous client creation for demo"
  ON clients
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Ensure the SELECT policy allows proper access patterns
DROP POLICY IF EXISTS "Clients can read own data" ON clients;

CREATE POLICY "Clients can read own data"
  ON clients
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Authenticated users can read their own data (by UUID)
    (uid() IS NOT NULL AND (uid())::text = (id)::text) OR
    -- Admins can read all data
    (EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = (jwt() ->> 'email')
    )) OR
    -- Anonymous demo user can read demo data
    (uid() IS NULL AND email = 'demo@company.com')
  );

-- Ensure UPDATE policy allows proper updates
DROP POLICY IF EXISTS "Clients can update own data" ON clients;

CREATE POLICY "Clients can update own data"
  ON clients
  FOR UPDATE
  TO anon, authenticated
  USING (
    -- Authenticated users can update their own data
    (uid() IS NOT NULL AND (uid())::text = (id)::text) OR
    -- Anonymous demo user can update demo data
    (uid() IS NULL AND email = 'demo@company.com')
  );