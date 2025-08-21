import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Client {
  id: string;
  email: string;
  name: string;
  company: string;
  created_at: string;
}

export interface Application {
  id: string;
  client_id: string;
  amount: number;
  status: 'under_review' | 'approved' | 'declined' | 'funded';
  submitted_date: string;
  created_at: string;
  client?: Client;
  lender_submissions?: LenderSubmission[];
  documents?: Document[];
}

export interface LenderSubmission {
  id: string;
  application_id: string;
  lender_id: string;
  lender_name: string;
  status: 'under_review' | 'approved' | 'declined' | 'funded';
  approval_amount?: number;
  lender_email?: string;
  lender_phone?: string;
  notes?: string;
  updated_date?: string;
  created_at: string;
}

export interface Document {
  id: string;
  application_id: string;
  document_type: string;
  file_name: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface Lender {
  id: string;
  name: string;
  logo: string;
  description: string;
  email: string;
  min_amount: number;
  max_amount: number;
  time_frame: string;
  requirements: string[];
  is_default: boolean;
  created_by: string;
  created_at: string;
}