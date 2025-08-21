import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { AdminUser } from '../lib/supabase';

interface AdminContextType {
  adminUser: AdminUser | null;
  login: (email: string, password: string) => Promise<boolean>;
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
      // For demo purposes, we'll use a simple email check
      // In production, you'd use proper Supabase auth
      if (email === 'admin@mcaportal.com' && password === 'admin123') {
        // Get admin user
        let { data: admin, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (error) {
          console.error('Error fetching admin:', error);
          setLoading(false);
          return false;
        }

        // If admin user doesn't exist, create it
        if (!admin) {
          const { data: newAdmin, error: insertError } = await supabase
            .from('admin_users')
            .insert({
              email: email,
              name: 'Demo Admin',
              role: 'admin'
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating admin user:', insertError);
            setLoading(false);
            return false;
          }

          admin = newAdmin;
        }

        setAdminUser(admin);
        setLoading(false);
        return true;
      }
      
      setLoading(false);
      return false;
    } catch (error) {
      console.error('Admin login error:', error);
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