import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { ApplicationForm } from './components/ApplicationForm';
import { ApprovalsView } from './components/ApprovalsView';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, login, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'application' | 'approvals'>('dashboard');
  const [resubmissionData, setResubmissionData] = useState<{
    applicationId: string;
    submittedLenders: string[];
  } | null>(null);

  const handleResubmitApplication = (applicationId: string, submittedLenders: string[]) => {
    setResubmissionData({ applicationId, submittedLenders });
    setCurrentView('application');
  };

  const handleApplicationComplete = () => {
    setResubmissionData(null);
    setCurrentView('dashboard');
  };

  if (!user) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MC</span>
              </div>
              <h1 className="ml-3 text-xl font-semibold text-gray-900">MCA Client Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                currentView === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('application')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                currentView === 'application'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              New Application
            </button>
            <button
              onClick={() => setCurrentView('approvals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                currentView === 'approvals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Approvals
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' ? (
          <Dashboard 
            onStartApplication={() => setCurrentView('application')} 
            onResubmitApplication={handleResubmitApplication}
          />
        ) : currentView === 'approvals' ? (
          <ApprovalsView />
        ) : (
          <ApplicationForm 
            onComplete={handleApplicationComplete}
            resubmissionData={resubmissionData}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;