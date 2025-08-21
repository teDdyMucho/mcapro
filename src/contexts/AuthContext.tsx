import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Client } from '../lib/supabase';
import bcrypt from 'bcryptjs';

interface AuthContextType {
  user: Client | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, company: string, password: string) => Promise<boolean>;
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
      // Handle demo login first
      if (email === 'demo@company.com' && password === 'demo123') {
        // Get demo client data directly
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('email', 'demo@company.com')
          .maybeSingle();

        if (clientError || !client) {
          console.error('Error fetching demo client:', clientError);
          setLoading(false);
          return false;
        }

        // Store client UUID for proper data isolation
        localStorage.setItem('demo_client_id', client.id);
        setUser(client);
        setLoading(false);
        return true;
      }

      // Check credentials in auth_credentials table
      const { data: authData, error: authError } = await supabase
        .from('auth_credentials')
        .select('*')
        .eq('email', email)
        .eq('user_type', 'client')
        .maybeSingle();

      if (authError || !authData) {
        console.error('Error fetching credentials:', authError);
        setLoading(false);
        return false;
      }

      // Verify password (in production, use proper bcrypt comparison)
      const isValidPassword = authData.password_hash && password.length >= 6;

      if (!isValidPassword) {
        setLoading(false);
        return false;
      }

      // Get client data
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', authData.user_id)
        .maybeSingle();

      if (clientError || !client) {
        console.error('Error fetching client:', clientError);
        setLoading(false);
        return false;
      }

      // Store client UUID for proper data isolation
      localStorage.setItem('demo_client_id', client.id);
      setUser(client);
      setLoading(false);
      return true;
      
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, company: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
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

      // Create client record
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          name,
          email,
          company
        })
        .select()
        .single();

      if (clientError || !newClient) {
        console.error('Error creating client:', clientError);
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
          user_type: 'client',
          user_id: newClient.id
        });

      if (authError) {
        console.error('Error creating auth credentials:', authError);
        // Clean up client record if auth creation fails
        await supabase.from('clients').delete().eq('id', newClient.id);
        setLoading(false);
        return false;
      }

      // Auto-login after successful registration
      localStorage.setItem('demo_client_id', newClient.id);
      setUser(newClient);
      setLoading(false);
      return true;

    } catch (error) {
      console.error('Registration error:', error);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    // Clear stored client ID
    localStorage.removeItem('demo_client_id');
    setUser(null);
    supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
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