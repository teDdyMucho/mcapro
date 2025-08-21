/*
  # Add email field to lenders table

  1. Changes
    - Add `email` column to `lenders` table
    - Set default empty string for existing records
    - Allow null values for flexibility

  2. Purpose
    - Support direct communication with lenders
    - Enable automated email notifications
    - Facilitate lender submission workflows
*/

-- Add email field to lenders table
ALTER TABLE lenders ADD COLUMN email text DEFAULT '';

-- Add comment for documentation
COMMENT ON COLUMN lenders.email IS 'Contact email for the lender';