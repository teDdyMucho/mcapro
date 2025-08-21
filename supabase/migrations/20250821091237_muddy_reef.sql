/*
  # Create lenders table and migrate hardcoded data

  1. New Tables
    - `lenders`
      - `id` (text, primary key) - unique lender identifier
      - `name` (text) - lender display name
      - `logo` (text) - lender logo/initials
      - `description` (text) - lender description
      - `min_amount` (integer) - minimum funding amount
      - `max_amount` (integer) - maximum funding amount
      - `time_frame` (text) - decision timeframe
      - `requirements` (text array) - lender requirements
      - `is_default` (boolean) - whether this is a default system lender
      - `created_by` (text) - who created this lender (client email or 'system')
      - `created_at` (timestamp) - creation timestamp

  2. Security
    - Enable RLS on `lenders` table
    - Add policies for reading, creating, updating, and deleting lenders
    - Allow clients to manage their own custom lenders
    - Allow admins to manage all lenders

  3. Data Migration
    - Insert all hardcoded lenders as default system lenders
*/

-- Create lenders table
CREATE TABLE IF NOT EXISTS lenders (
  id text PRIMARY KEY,
  name text NOT NULL,
  logo text NOT NULL,
  description text NOT NULL,
  min_amount integer NOT NULL,
  max_amount integer NOT NULL,
  time_frame text NOT NULL,
  requirements text[] NOT NULL DEFAULT '{}',
  is_default boolean DEFAULT false,
  created_by text DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lenders ENABLE ROW LEVEL SECURITY;

-- Policies for lenders table
CREATE POLICY "Anyone can read lenders"
  ON lenders
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Clients can create custom lenders"
  ON lenders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (uid() IS NOT NULL AND created_by = (SELECT email FROM clients WHERE id = uid())) OR
    (uid() IS NULL AND created_by = 'demo@company.com') OR
    (EXISTS (SELECT 1 FROM admin_users WHERE email = (jwt() ->> 'email'::text)))
  );

CREATE POLICY "Users can update their own lenders or admins can update any"
  ON lenders
  FOR UPDATE
  TO anon, authenticated
  USING (
    (uid() IS NOT NULL AND created_by = (SELECT email FROM clients WHERE id = uid())) OR
    (uid() IS NULL AND created_by = 'demo@company.com') OR
    (EXISTS (SELECT 1 FROM admin_users WHERE email = (jwt() ->> 'email'::text)))
  );

CREATE POLICY "Users can delete their own lenders or admins can delete any"
  ON lenders
  FOR DELETE
  TO anon, authenticated
  USING (
    (uid() IS NOT NULL AND created_by = (SELECT email FROM clients WHERE id = uid())) OR
    (uid() IS NULL AND created_by = 'demo@company.com') OR
    (EXISTS (SELECT 1 FROM admin_users WHERE email = (jwt() ->> 'email'::text)))
  );

-- Insert default lenders (migrated from hardcoded data)
INSERT INTO lenders (id, name, logo, description, min_amount, max_amount, time_frame, requirements, is_default, created_by) VALUES
(
  'rapid-capital',
  'Rapid Capital Solutions',
  'RC',
  'Fast approval process with competitive rates for established businesses',
  10000,
  500000,
  '24-48 hours',
  ARRAY['6+ months in business', 'Min $10K monthly revenue', 'Credit score 550+'],
  true,
  'system'
),
(
  'business-funding',
  'Business Funding Network',
  'BF',
  'Flexible terms and high approval rates for various industries',
  5000,
  750000,
  '1-3 business days',
  ARRAY['3+ months in business', 'Min $8K monthly revenue', 'No bankruptcies'],
  true,
  'system'
),
(
  'merchant-advance',
  'Merchant Advance Pro',
  'MA',
  'Specialized in retail and restaurant funding with same-day decisions',
  15000,
  300000,
  'Same day',
  ARRAY['12+ months in business', 'Min $15K monthly revenue', 'Credit score 600+'],
  true,
  'system'
),
(
  'capital-bridge',
  'Capital Bridge Financial',
  'CB',
  'Large funding amounts for growing businesses with excellent support',
  25000,
  1000000,
  '2-5 business days',
  ARRAY['18+ months in business', 'Min $25K monthly revenue', 'Credit score 650+'],
  true,
  'system'
),
(
  'quick-cash',
  'QuickCash Business',
  'QC',
  'Emergency funding solutions with minimal documentation required',
  3000,
  100000,
  '2-6 hours',
  ARRAY['3+ months in business', 'Min $5K monthly revenue', 'Active bank account'],
  true,
  'system'
),
(
  'premier-funding',
  'Premier Funding Group',
  'PF',
  'Premium lender with excellent rates for qualified businesses',
  50000,
  2000000,
  '3-7 business days',
  ARRAY['24+ months in business', 'Min $50K monthly revenue', 'Credit score 700+'],
  true,
  'system'
);