/*
  # Fix RLS policies for demo authentication

  1. Security Updates
    - Allow anonymous users to insert clients for demo purposes
    - Update client policies to handle demo authentication
    - Ensure proper access control for applications and lender submissions

  2. Changes
    - Add INSERT policy for anonymous users on clients table
    - Update existing policies to handle demo flow
    - Maintain security for other operations
*/

-- Allow anonymous users to insert clients (for demo purposes only)
CREATE POLICY "Allow anonymous client creation for demo"
  ON clients
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Update the existing client read policy to work with demo auth
DROP POLICY IF EXISTS "Clients can read own data" ON clients;
CREATE POLICY "Clients can read own data"
  ON clients
  FOR SELECT
  TO authenticated, anon
  USING (
    -- Allow if user is authenticated and owns the record
    (auth.uid() IS NOT NULL AND (auth.uid())::text = (id)::text) OR
    -- Allow if admin user
    (EXISTS ( SELECT 1 FROM admin_users WHERE admin_users.email = (auth.jwt() ->> 'email'::text))) OR
    -- Allow for demo purposes (temporary)
    (auth.uid() IS NULL AND email = 'demo@company.com')
  );

-- Update client update policy
DROP POLICY IF EXISTS "Clients can update own data" ON clients;
CREATE POLICY "Clients can update own data"
  ON clients
  FOR UPDATE
  TO authenticated, anon
  USING (
    -- Allow if user is authenticated and owns the record
    (auth.uid() IS NOT NULL AND (auth.uid())::text = (id)::text) OR
    -- Allow for demo purposes (temporary)
    (auth.uid() IS NULL AND email = 'demo@company.com')
  );

-- Update applications policies to handle demo auth
DROP POLICY IF EXISTS "Clients can insert own applications" ON applications;
CREATE POLICY "Clients can insert own applications"
  ON applications
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Allow if user is authenticated and owns the client record
    (auth.uid() IS NOT NULL AND client_id = auth.uid()) OR
    -- Allow for demo purposes
    (auth.uid() IS NULL AND EXISTS (SELECT 1 FROM clients WHERE clients.id = applications.client_id AND clients.email = 'demo@company.com'))
  );

DROP POLICY IF EXISTS "Clients can read own applications" ON applications;
CREATE POLICY "Clients can read own applications"
  ON applications
  FOR SELECT
  TO authenticated, anon
  USING (
    -- Allow if user is authenticated and owns the application
    (auth.uid() IS NOT NULL AND client_id = auth.uid()) OR
    -- Allow if admin user
    (EXISTS ( SELECT 1 FROM admin_users WHERE admin_users.email = (auth.jwt() ->> 'email'::text))) OR
    -- Allow for demo purposes
    (auth.uid() IS NULL AND EXISTS (SELECT 1 FROM clients WHERE clients.id = applications.client_id AND clients.email = 'demo@company.com'))
  );

-- Update lender submissions policies
DROP POLICY IF EXISTS "Clients can insert lender submissions for their applications" ON lender_submissions;
CREATE POLICY "Clients can insert lender submissions for their applications"
  ON lender_submissions
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Allow if user is authenticated and owns the application
    (auth.uid() IS NOT NULL AND EXISTS ( SELECT 1 FROM applications WHERE applications.id = lender_submissions.application_id AND applications.client_id = auth.uid())) OR
    -- Allow for demo purposes
    (auth.uid() IS NULL AND EXISTS ( 
      SELECT 1 FROM applications 
      JOIN clients ON applications.client_id = clients.id 
      WHERE applications.id = lender_submissions.application_id AND clients.email = 'demo@company.com'
    ))
  );

DROP POLICY IF EXISTS "Users can read lender submissions for their applications" ON lender_submissions;
CREATE POLICY "Users can read lender submissions for their applications"
  ON lender_submissions
  FOR SELECT
  TO authenticated, anon
  USING (
    -- Allow if user is authenticated and owns the application
    (auth.uid() IS NOT NULL AND EXISTS ( SELECT 1 FROM applications WHERE applications.id = lender_submissions.application_id AND applications.client_id = auth.uid())) OR
    -- Allow if admin user
    (EXISTS ( SELECT 1 FROM admin_users WHERE admin_users.email = (auth.jwt() ->> 'email'::text))) OR
    -- Allow for demo purposes
    (auth.uid() IS NULL AND EXISTS ( 
      SELECT 1 FROM applications 
      JOIN clients ON applications.client_id = clients.id 
      WHERE applications.id = lender_submissions.application_id AND clients.email = 'demo@company.com'
    ))
  );

-- Update documents policies
DROP POLICY IF EXISTS "Clients can insert documents for their applications" ON documents;
CREATE POLICY "Clients can insert documents for their applications"
  ON documents
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Allow if user is authenticated and owns the application
    (auth.uid() IS NOT NULL AND EXISTS ( SELECT 1 FROM applications WHERE applications.id = documents.application_id AND applications.client_id = auth.uid())) OR
    -- Allow for demo purposes
    (auth.uid() IS NULL AND EXISTS ( 
      SELECT 1 FROM applications 
      JOIN clients ON applications.client_id = clients.id 
      WHERE applications.id = documents.application_id AND clients.email = 'demo@company.com'
    ))
  );

DROP POLICY IF EXISTS "Users can read documents for their applications" ON documents;
CREATE POLICY "Users can read documents for their applications"
  ON documents
  FOR SELECT
  TO authenticated, anon
  USING (
    -- Allow if user is authenticated and owns the application
    (auth.uid() IS NOT NULL AND EXISTS ( SELECT 1 FROM applications WHERE applications.id = documents.application_id AND applications.client_id = auth.uid())) OR
    -- Allow if admin user
    (EXISTS ( SELECT 1 FROM admin_users WHERE admin_users.email = (auth.jwt() ->> 'email'::text))) OR
    -- Allow for demo purposes
    (auth.uid() IS NULL AND EXISTS ( 
      SELECT 1 FROM applications 
      JOIN clients ON applications.client_id = clients.id 
      WHERE applications.id = documents.application_id AND clients.email = 'demo@company.com'
    ))
  );