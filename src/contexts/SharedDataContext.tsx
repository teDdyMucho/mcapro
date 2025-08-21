import React, { createContext, useContext, useState, useEffect } from 'react';

interface Application {
  id: string;
  clientName: string;
  clientEmail: string;
  company: string;
  amount: number;
  status: 'under_review' | 'approved' | 'declined' | 'funded';
  submittedDate: string;
  submittedLenders: {
    id: string;
    name: string;
    status: 'under_review' | 'approved' | 'declined' | 'funded';
    approvalAmount?: number;
    lenderEmail?: string;
    lenderPhone?: string;
    updatedDate?: string;
    notes?: string;
  }[];
  documents: {
    fundingApplication: string;
    bankStatement1: string;
    bankStatement2: string;
    bankStatement3: string;
  };
}

interface SharedDataContextType {
  applications: Application[];
  updateLenderStatus: (applicationId: string, lenderId: string, status: string, approvalAmount?: number, lenderEmail?: string, lenderPhone?: string, notes?: string) => void;
  addApplication: (application: Application) => void;
  getApplicationsForClient: (clientEmail: string) => Application[];
}

const SharedDataContext = createContext<SharedDataContextType | undefined>(undefined);

const STORAGE_KEY = 'mca_applications_data';

export function SharedDataProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplications] = useState<Application[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setApplications(parsedData);
      } catch (error) {
        console.error('Error loading saved data:', error);
        // Initialize with default data if parsing fails
        initializeDefaultData();
      }
    } else {
      // Initialize with default data if no saved data exists
      initializeDefaultData();
    }
  }, []);

  // Save data to localStorage whenever applications change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  }, [applications]);

  const initializeDefaultData = () => {
    const defaultApplications: Application[] = [
      {
        id: 'APP-2024-001',
        clientName: 'John Smith',
        clientEmail: 'demo@company.com',
        company: 'Smith Enterprises LLC',
        amount: 50000,
        status: 'under_review',
        submittedDate: '2024-01-15',
        submittedLenders: [
          { id: 'rapid-capital', name: 'Rapid Capital Solutions', status: 'under_review' },
          { id: 'business-funding', name: 'Business Funding Network', status: 'declined', notes: 'Credit score too low' },
          { id: 'merchant-advance', name: 'Merchant Advance Pro', status: 'under_review' }
        ],
        documents: {
          fundingApplication: 'funding-app-001.pdf',
          bankStatement1: 'bank-stmt-1-001.pdf',
          bankStatement2: 'bank-stmt-2-001.pdf',
          bankStatement3: 'bank-stmt-3-001.pdf'
        }
      },
      {
        id: 'APP-2024-002',
        clientName: 'John Smith',
        clientEmail: 'demo@company.com',
        company: 'Smith Enterprises LLC',
        amount: 75000,
        status: 'approved',
        submittedDate: '2024-01-10',
        submittedLenders: [
          { 
            id: 'capital-bridge', 
            name: 'Capital Bridge Financial', 
            status: 'approved',
            approvalAmount: 65000,
            lenderEmail: 'approvals@capitalbridge.com',
            lenderPhone: '(555) 123-4567',
            updatedDate: '2024-01-12',
            notes: 'Approved with conditions - 18 month term'
          },
          { id: 'premier-funding', name: 'Premier Funding Group', status: 'declined', notes: 'Insufficient revenue' }
        ],
        documents: {
          fundingApplication: 'funding-app-002.pdf',
          bankStatement1: 'bank-stmt-1-002.pdf',
          bankStatement2: 'bank-stmt-2-002.pdf',
          bankStatement3: 'bank-stmt-3-002.pdf'
        }
      },
      {
        id: 'APP-2023-045',
        clientName: 'John Smith',
        clientEmail: 'demo@company.com',
        company: 'Smith Enterprises LLC',
        amount: 25000,
        status: 'funded',
        submittedDate: '2023-12-08',
        submittedLenders: [
          { 
            id: 'quick-cash', 
            name: 'QuickCash Business', 
            status: 'funded',
            approvalAmount: 25000,
            lenderEmail: 'funding@quickcash.com',
            lenderPhone: '(555) 987-6543',
            updatedDate: '2023-12-10',
            notes: 'Funded successfully - 12 month term'
          }
        ],
        documents: {
          fundingApplication: 'funding-app-045.pdf',
          bankStatement1: 'bank-stmt-1-045.pdf',
          bankStatement2: 'bank-stmt-2-045.pdf',
          bankStatement3: 'bank-stmt-3-045.pdf'
        }
      }
    ];
    setApplications(defaultApplications);
  };

  const updateLenderStatus = (
    applicationId: string, 
    lenderId: string, 
    status: string, 
    approvalAmount?: number, 
    lenderEmail?: string, 
    lenderPhone?: string,
    notes?: string
  ) => {
    setApplications(prev => prev.map(app => {
      if (app.id === applicationId) {
        const updatedLenders = app.submittedLenders.map(lender => {
          if (lender.id === lenderId) {
            return {
              ...lender,
              status: status as any,
              approvalAmount,
              lenderEmail,
              lenderPhone,
              notes,
              updatedDate: new Date().toISOString().split('T')[0]
            };
          }
          return lender;
        });

        // Update overall application status
        let newAppStatus = app.status;
        if (status === 'funded') {
          newAppStatus = 'funded';
        } else if (status === 'approved' && app.status !== 'funded') {
          newAppStatus = 'approved';
        } else if (updatedLenders.every(l => l.status === 'declined')) {
          newAppStatus = 'declined';
        }

        return {
          ...app,
          submittedLenders: updatedLenders,
          status: newAppStatus as any
        };
      }
      return app;
    }));
  };

  const addApplication = (application: Application) => {
    setApplications(prev => [...prev, application]);
  };

  const getApplicationsForClient = (clientEmail: string) => {
    return applications.filter(app => app.clientEmail === clientEmail);
  };

  return (
    <SharedDataContext.Provider value={{ 
      applications, 
      updateLenderStatus, 
      addApplication,
      getApplicationsForClient
    }}>
      {children}
    </SharedDataContext.Provider>
  );
}

export function useSharedData() {
  const context = useContext(SharedDataContext);
  if (context === undefined) {
    throw new Error('useSharedData must be used within a SharedDataProvider');
  }
  return context;
}