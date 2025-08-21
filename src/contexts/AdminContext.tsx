import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSharedData } from './SharedDataContext';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'support';
}

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
    const savedAdmin = localStorage.getItem('mcaAdmin');
    if (savedAdmin) {
      setAdminUser(JSON.parse(savedAdmin));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Demo admin credentials
    if (email === 'admin@mcaportal.com' && password === 'admin123') {
      const adminData = {
        id: '1',
        email: 'admin@mcaportal.com',
        name: 'Admin User',
        role: 'admin' as const
      };
      
      setAdminUser(adminData);
      localStorage.setItem('mcaAdmin', JSON.stringify(adminData));
      setLoading(false);
      return true;
    }
    
    setLoading(false);
    return false;
  };

  const logout = () => {
    setAdminUser(null);
    localStorage.removeItem('mcaAdmin');
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