import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AdminApp from './AdminApp';
import { SharedDataProvider } from './contexts/SharedDataContext';
import './index.css';

// Check if we're on the admin route
const isAdminRoute = window.location.pathname.startsWith('/admin');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SharedDataProvider>
      {isAdminRoute ? <AdminApp /> : <App />}
    </SharedDataProvider>
  </StrictMode>
);
