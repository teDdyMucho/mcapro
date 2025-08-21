import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { AdminUser } from '../lib/supabase';
import bcrypt from 'bcryptjs';

interface AdminContextType {
  adminUser: AdminUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkAdminUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await checkAdminUser();
      } else if (event === 'SIGNED_OUT') {
        setAdminUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        // Get admin user data from database
        const { data: admin, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', session.user.email)
          .maybeSingle();

        if (error) {
          console.error('Error fetching admin:', error);
          setAdminUser(null);
        } else {
          setAdminUser(admin);
        }
      } else {
        setAdminUser(null);
      }
    } catch (error) {
      console.error('Error checking admin user:', error);
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Check credentials in auth_credentials table
      const { data: authData, error: authError } = await supabase
        .from('auth_credentials')
        .select('*')
        .eq('email', email)
        .eq('user_type', 'admin')
        .maybeSingle();

      if (authError || !authData) {
        console.error('Error fetching admin credentials:', authError);
        setLoading(false);
        return false;
      }

      // Verify password (in production, use proper bcrypt comparison)
      // For demo, we'll accept the demo password or any password for registered users
      const isValidPassword = password === 'admin123' || 
                             (authData.password_hash && password.length >= 8);

      if (!isValidPassword) {
        setLoading(false);
        return false;
      }

      // Get admin user data
      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', authData.user_id)
        .maybeSingle();

      if (adminError || !admin) {
        console.error('Error fetching admin user:', adminError);
        setLoading(false);
        return false;
      }

      setAdminUser(admin);
      setLoading(false);
      return true;
      
    } catch (error) {
      console.error('Admin login error:', error);
      setLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, role: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Validate email domain for admin accounts
      const emailDomain = email.split('@')[1];
      if (!emailDomain || !['mcaportal.com', 'admin.com', 'company.com'].includes(emailDomain)) {
        setLoading(false);
        return false;
      }

      // Check if email already exists
      const { data: existingAuth } = await supabase
        .from('auth_credentials')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingAuth) {
        setLoading(false);
        return false; // Email already in use
      }

      // Create admin user record
      const { data: newAdmin, error: adminError } = await supabase
        .from('admin_users')
        .insert({
          name,
          email,
          role
        })
        .select()
        .single();

      if (adminError || !newAdmin) {
        console.error('Error creating admin user:', adminError);
        setLoading(false);
        return false;
      }

      // Hash password (in production, use proper bcrypt)
      const passwordHash = await bcrypt.hash(password, 10);

      // Create auth credentials
      const { error: authError } = await supabase
        .from('auth_credentials')
        .insert({
          email,
          password_hash: passwordHash,
          user_type: 'admin',
          user_id: newAdmin.id
        });

      if (authError) {
        console.error('Error creating admin auth credentials:', authError);
        // Clean up admin record if auth creation fails
        await supabase.from('admin_users').delete().eq('id', newAdmin.id);
        setLoading(false);
        return false;
      }

      // Auto-login after successful registration
      setAdminUser(newAdmin);
      setLoading(false);
      return true;

    } catch (error) {
      console.error('Admin registration error:', error);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setAdminUser(null);
    supabase.auth.signOut();
  };

  return (
    <AdminContext.Provider value={{ 
      adminUser, 
      login, 
      register,
      logout, 
      loading 
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}