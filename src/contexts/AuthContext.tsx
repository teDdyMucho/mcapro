import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Client } from '../lib/supabase';

interface AuthContextType {
  user: Client | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await checkUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        // Get client data from database
        const { data: client, error } = await supabase
          .from('clients')
          .select('*')
          .eq('email', session.user.email)
          .maybeSingle();

        if (error) {
          console.error('Error fetching client:', error);
          setUser(null);
        } else if (client) {
          setUser(client);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      // For demo purposes, we'll use a simple email check
      // In production, you'd use proper Supabase auth
      if (email === 'demo@company.com' && password === 'demo123') {
        // Get or create client
        let { data: client, error } = await supabase
          .from('clients')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (!client && !error) {
          // Client doesn't exist, create one
          const { data: newClient, error: createError } = await supabase
            .from('clients')
            .insert({
              email: 'demo@company.com',
              name: 'John Smith',
              company: 'Smith Enterprises LLC'
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating client:', createError);
            setLoading(false);
            return false;
          }
          client = newClient;
        } else if (error) {
          console.error('Error fetching client:', error);
          setLoading(false);
          return false;
        }

        if (client) {
          setUser(client);
        }
        setLoading(false);
        return true;
      }
      
      setLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}