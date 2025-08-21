import React from 'react';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminProvider, useAdmin } from './contexts/AdminContext';

function AdminAppContent() {
  const { adminUser } = useAdmin();

  if (!adminUser) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
}

function AdminApp() {
  return (
    <AdminProvider>
      <AdminAppContent />
    </AdminProvider>
  );
}

export default AdminApp;