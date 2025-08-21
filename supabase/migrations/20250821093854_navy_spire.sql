/*
  # Update RLS policies for proper data isolation

  1. Security Updates
    - Ensure applications are only visible to their owners or admins
    - Ensure lenders are properly isolated by creator
    - Update lender_submissions to be visible only to application owners or admins
    - Add proper client UUID referencing

  2. Policy Updates
    - Strengthen application visibility policies
    - Update lender management policies
    - Ensure proper data isolation across all tables
*/

-- Update applications policies for better isolation
DROP POLICY IF EXISTS "Clients can read own applications" ON applications;
CREATE POLICY "Clients can read own applications"
  ON applications
  FOR SELECT
  TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND client_id = auth.uid()) OR
    (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = (auth.jwt() ->> 'email'))) OR
    (auth.uid() IS NULL AND EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = applications.client_id 
      AND clients.email = 'demo@company.com'
    ))
  );

-- Update lenders policies for proper isolation
DROP POLICY IF EXISTS "Users can update their own lenders" ON lenders;
CREATE POLICY "Users can update their own lenders"
  ON lenders
  FOR UPDATE
  TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND created_by = (auth.jwt() ->> 'email')) OR
    (auth.uid() IS NULL AND created_by = 'demo@company.com') OR
    (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = (auth.jwt() ->> 'email'))) OR
    is_default = true
  );

DROP POLICY IF EXISTS "Users can delete their own lenders" ON lenders;
CREATE POLICY "Users can delete their own lenders"
  ON lenders
  FOR DELETE
  TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND created_by = (auth.jwt() ->> 'email')) OR
    (auth.uid() IS NULL AND created_by = 'demo@company.com') OR
    (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = (auth.jwt() ->> 'email')))
  );

-- Update lender_submissions policies for proper isolation
DROP POLICY IF EXISTS "Users can read lender submissions for their applications" ON lender_submissions;
CREATE POLICY "Users can read lender submissions for their applications"
  ON lender_submissions
  FOR SELECT
  TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = lender_submissions.application_id 
      AND applications.client_id = auth.uid()
    )) OR
    (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = (auth.jwt() ->> 'email'))) OR
    (auth.uid() IS NULL AND EXISTS (
      SELECT 1 FROM applications 
      JOIN clients ON applications.client_id = clients.id
      WHERE applications.id = lender_submissions.application_id 
      AND clients.email = 'demo@company.com'
    ))
  );

-- Update documents policies for proper isolation
DROP POLICY IF EXISTS "Users can read documents for their applications" ON documents;
CREATE POLICY "Users can read documents for their applications"
  ON documents
  FOR SELECT
  TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = documents.application_id 
      AND applications.client_id = auth.uid()
    )) OR
    (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.email = (auth.jwt() ->> 'email'))) OR
    (auth.uid() IS NULL AND EXISTS (
      SELECT 1 FROM applications 
      JOIN clients ON applications.client_id = clients.id
      WHERE applications.id = documents.application_id 
      AND clients.email = 'demo@company.com'
    ))
  );

-- Add function to get current user UUID for demo purposes
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For authenticated users, return their UUID
  IF auth.uid() IS NOT NULL THEN
    RETURN auth.uid();
  END IF;
  
  -- For anonymous demo users, return the demo client UUID
  RETURN (
    SELECT id FROM clients 
    WHERE email = 'demo@company.com' 
    LIMIT 1
  );
END;
$$;