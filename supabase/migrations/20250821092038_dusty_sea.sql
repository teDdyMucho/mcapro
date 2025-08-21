/*
  # Create lenders table

  1. New Tables
    - `lenders`
      - `id` (text, primary key) - unique identifier for lender
      - `name` (text) - lender name
      - `logo` (text) - logo/initials for display
      - `description` (text) - lender description
      - `min_amount` (integer) - minimum funding amount
      - `max_amount` (integer) - maximum funding amount
      - `time_frame` (text) - decision timeframe
      - `requirements` (text array) - list of requirements
      - `is_default` (boolean) - whether this is a system default lender
      - `created_by` (text) - email of user who created this lender
      - `created_at` (timestamp) - creation timestamp

  2. Security
    - Enable RLS on `lenders` table
    - Add policies for reading, inserting, updating, and deleting lenders
    - Allow authenticated users and anonymous demo users to manage lenders

  3. Default Data
    - Insert 5 default system lenders with comprehensive details
*/

-- Create lenders table
CREATE TABLE IF NOT EXISTS lenders (
  id text PRIMARY KEY,
  name text NOT NULL,
  logo text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  min_amount integer NOT NULL DEFAULT 0,
  max_amount integer NOT NULL DEFAULT 0,
  time_frame text NOT NULL DEFAULT '',
  requirements text[] NOT NULL DEFAULT '{}',
  is_default boolean NOT NULL DEFAULT false,
  created_by text NOT NULL DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE lenders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read lenders"
  ON lenders
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert lenders"
  ON lenders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NOT NULL AND created_by = (auth.jwt() ->> 'email')) OR
    (auth.uid() IS NULL AND created_by = 'demo@company.com') OR
    created_by = 'system'
  );

CREATE POLICY "Users can update their own lenders"
  ON lenders
  FOR UPDATE
  TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND created_by = (auth.jwt() ->> 'email')) OR
    (auth.uid() IS NULL AND created_by = 'demo@company.com') OR
    (EXISTS (SELECT 1 FROM admin_users WHERE email = (auth.jwt() ->> 'email')))
  );

CREATE POLICY "Users can delete their own lenders"
  ON lenders
  FOR DELETE
  TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND created_by = (auth.jwt() ->> 'email')) OR
    (auth.uid() IS NULL AND created_by = 'demo@company.com') OR
    (EXISTS (SELECT 1 FROM admin_users WHERE email = (auth.jwt() ->> 'email')))
  );

-- Insert default system lenders
INSERT INTO lenders (id, name, logo, description, min_amount, max_amount, time_frame, requirements, is_default, created_by) VALUES
(
  'rapid-advance',
  'Rapid Advance',
  'RA',
  'Fast funding for growing businesses with flexible terms and quick approval process.',
  10000,
  500000,
  '24-48 hours',
  ARRAY['6+ months in business', 'Monthly revenue $10k+', 'Credit score 550+'],
  true,
  'system'
),
(
  'business-capital',
  'Business Capital Solutions',
  'BC',
  'Comprehensive business funding solutions with competitive rates and personalized service.',
  25000,
  1000000,
  '2-5 business days',
  ARRAY['12+ months in business', 'Monthly revenue $25k+', 'Credit score 600+'],
  true,
  'system'
),
(
  'merchant-funding',
  'Merchant Funding Group',
  'MF',
  'Specialized in merchant cash advances with same-day approval and funding.',
  5000,
  250000,
  'Same day',
  ARRAY['3+ months in business', 'Monthly revenue $5k+', 'Credit score 500+'],
  true,
  'system'
),
(
  'capital-express',
  'Capital Express',
  'CE',
  'Express funding solutions for small to medium businesses with minimal paperwork.',
  15000,
  750000,
  '1-3 business days',
  ARRAY['9+ months in business', 'Monthly revenue $15k+', 'Credit score 575+'],
  true,
  'system'
),
(
  'funding-solutions',
  'Funding Solutions Inc',
  'FS',
  'Tailored funding solutions with flexible repayment options and competitive rates.',
  20000,
  2000000,
  '3-7 business days',
  ARRAY['18+ months in business', 'Monthly revenue $20k+', 'Credit score 625+'],
  true,
  'system'
);