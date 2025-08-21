/*
  # MCA Portal Database Schema

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `company` (text)
      - `created_at` (timestamp)
    - `applications`
      - `id` (text, primary key) - Custom format like APP-2024-001
      - `client_id` (uuid, foreign key)
      - `amount` (integer)
      - `status` (text)
      - `submitted_date` (date)
      - `created_at` (timestamp)
    - `lender_submissions`
      - `id` (uuid, primary key)
      - `application_id` (text, foreign key)
      - `lender_id` (text)
      - `lender_name` (text)
      - `status` (text)
      - `approval_amount` (integer, nullable)
      - `lender_email` (text, nullable)
      - `lender_phone` (text, nullable)
      - `notes` (text, nullable)
      - `updated_date` (date, nullable)
      - `created_at` (timestamp)
    - `documents`
      - `id` (uuid, primary key)
      - `application_id` (text, foreign key)
      - `document_type` (text)
      - `file_name` (text)
      - `created_at` (timestamp)
    - `admin_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `role` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Clients can only access their own data
    - Admins can access all data
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  company text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id text PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'under_review',
  submitted_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create lender_submissions table
CREATE TABLE IF NOT EXISTS lender_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id text NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  lender_id text NOT NULL,
  lender_name text NOT NULL,
  status text NOT NULL DEFAULT 'under_review',
  approval_amount integer,
  lender_email text,
  lender_phone text,
  notes text,
  updated_date date,
  created_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id text NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policies for clients table
CREATE POLICY "Clients can read own data"
  ON clients
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text OR EXISTS (
    SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'
  ));

CREATE POLICY "Clients can update own data"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Policies for applications table
CREATE POLICY "Clients can read own applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Clients can insert own applications"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Admins can update applications"
  ON applications
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'));

-- Policies for lender_submissions table
CREATE POLICY "Users can read lender submissions for their applications"
  ON lender_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = lender_submissions.application_id 
      AND (applications.client_id = auth.uid() OR EXISTS (
        SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'
      ))
    )
  );

CREATE POLICY "Clients can insert lender submissions for their applications"
  ON lender_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = lender_submissions.application_id 
      AND applications.client_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update lender submissions"
  ON lender_submissions
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'));

-- Policies for documents table
CREATE POLICY "Users can read documents for their applications"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = documents.application_id 
      AND (applications.client_id = auth.uid() OR EXISTS (
        SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'
      ))
    )
  );

CREATE POLICY "Clients can insert documents for their applications"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = documents.application_id 
      AND applications.client_id = auth.uid()
    )
  );

-- Policies for admin_users table
CREATE POLICY "Admins can read admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email'));

-- Insert demo admin user
INSERT INTO admin_users (email, name, role) 
VALUES ('admin@mcaportal.com', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert demo client
INSERT INTO clients (email, name, company) 
VALUES ('demo@company.com', 'John Smith', 'Smith Enterprises LLC')
ON CONFLICT (email) DO NOTHING;