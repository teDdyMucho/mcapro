import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Application, LenderSubmission, Client, Lender } from '../lib/supabase';

interface ApplicationWithDetails extends Application {
  clientName: string;
  clientEmail: string;
  company: string;
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
  applications: ApplicationWithDetails[];
  lenders: Lender[];
  loading: boolean;
  loadingLenders: boolean;
  updateLenderStatus: (applicationId: string, lenderId: string, status: string, approvalAmount?: number, lenderEmail?: string, lenderPhone?: string, notes?: string) => Promise<void>;
  addApplication: (application: Omit<Application, 'id' | 'created_at'>, lenderIds: string[], lenderNames: string[]) => Promise<string>;
  addLender: (lender: Omit<Lender, 'id' | 'created_at'>) => Promise<void>;
  updateLender: (id: string, updates: Partial<Lender>) => Promise<void>;
  deleteLender: (id: string) => Promise<void>;
  getApplicationsForClient: (clientEmail: string) => ApplicationWithDetails[];
  refreshData: () => Promise<void>;
}

const SharedDataContext = createContext<SharedDataContextType | undefined>(undefined);

export function SharedDataProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLenders, setLoadingLenders] = useState(true);

  useEffect(() => {
    loadApplications();
    loadLenders();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      
      // Fetch applications with client data and lender submissions
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select(`
          *,
          client:clients(*),
          lender_submissions(*),
          documents(*)
        `)
        .order('created_at', { ascending: false });

      if (appsError) {
        console.error('Error fetching applications:', appsError);
        return;
      }

      // Transform data to match the expected format
      const transformedApps: ApplicationWithDetails[] = (appsData || []).map(app => ({
        ...app,
        clientName: app.client?.name || '',
        clientEmail: app.client?.email || '',
        company: app.client?.company || '',
        submittedLenders: (app.lender_submissions || []).map((submission: LenderSubmission) => ({
          id: submission.lender_id,
          name: submission.lender_name,
          status: submission.status,
          approvalAmount: submission.approval_amount,
          lenderEmail: submission.lender_email,
          lenderPhone: submission.lender_phone,
          updatedDate: submission.updated_date,
          notes: submission.notes
        })),
        documents: {
          fundingApplication: app.documents?.find((d: any) => d.document_type === 'funding_application')?.file_name || '',
          bankStatement1: app.documents?.find((d: any) => d.document_type === 'bank_statement_1')?.file_name || '',
          bankStatement2: app.documents?.find((d: any) => d.document_type === 'bank_statement_2')?.file_name || '',
          bankStatement3: app.documents?.find((d: any) => d.document_type === 'bank_statement_3')?.file_name || ''
        }
      }));

      setApplications(transformedApps);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLenders = async () => {
    try {
      setLoadingLenders(true);
      
      try {
        const { data: lendersData, error } = await supabase
          .from('lenders')
          .select('*')
          .order('is_default', { ascending: false })
          .order('name');

        if (error) {
          console.error('Error fetching lenders:', error);
          // If lenders table doesn't exist, use default lenders
          if (error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.message?.includes('schema cache')) {
            console.log('Lenders table not found, using default lenders');
            setLenders(getDefaultLenders());
            return;
          }
          throw error;
        }

        setLenders(lendersData || []);
      } catch (dbError: any) {
        console.error('Database error loading lenders:', dbError);
        // If lenders table doesn't exist, use default lenders
        if (dbError.code === 'PGRST205' || dbError.message?.includes('Could not find the table') || dbError.message?.includes('schema cache')) {
          console.log('Lenders table not found, using default lenders');
          setLenders(getDefaultLenders());
        } else {
          // For other database errors, still provide fallback
          console.log('Using default lenders due to database error');
          setLenders(getDefaultLenders());
        }
      }
    } catch (error) {
      console.error('Error loading lenders:', error);
      // Fallback to default lenders on any error
      setLenders(getDefaultLenders());
    } finally {
      setLoadingLenders(false);
    }
  };

  const getDefaultLenders = () => [
    {
      id: 'rapid-advance',
      name: 'Rapid Advance',
      logo: 'RA',
      description: 'Fast funding for growing businesses with flexible terms and quick approval process.',
      min_amount: 10000,
      max_amount: 500000,
      time_frame: '24-48 hours',
      requirements: ['6+ months in business', 'Monthly revenue $10k+', 'Credit score 550+'],
      is_default: true,
      created_by: 'system',
      created_at: new Date().toISOString()
    },
    {
      id: 'business-capital',
      name: 'Business Capital Solutions',
      logo: 'BC',
      description: 'Comprehensive business funding solutions with competitive rates and personalized service.',
      min_amount: 25000,
      max_amount: 1000000,
      time_frame: '2-5 business days',
      requirements: ['12+ months in business', 'Monthly revenue $25k+', 'Credit score 600+'],
      is_default: true,
      created_by: 'system',
      created_at: new Date().toISOString()
    },
    {
      id: 'merchant-funding',
      name: 'Merchant Funding Group',
      logo: 'MF',
      description: 'Specialized in merchant cash advances with same-day approval and funding.',
      min_amount: 5000,
      max_amount: 250000,
      time_frame: 'Same day',
      requirements: ['3+ months in business', 'Monthly revenue $5k+', 'Credit score 500+'],
      is_default: true,
      created_by: 'system',
      created_at: new Date().toISOString()
    },
    {
      id: 'capital-express',
      name: 'Capital Express',
      logo: 'CE',
      description: 'Express funding solutions for small to medium businesses with minimal paperwork.',
      min_amount: 15000,
      max_amount: 750000,
      time_frame: '1-3 business days',
      requirements: ['9+ months in business', 'Monthly revenue $15k+', 'Credit score 575+'],
      is_default: true,
      created_by: 'system',
      created_at: new Date().toISOString()
    },
    {
      id: 'funding-solutions',
      name: 'Funding Solutions Inc',
      logo: 'FS',
      description: 'Tailored funding solutions with flexible repayment options and competitive rates.',
      min_amount: 20000,
      max_amount: 2000000,
      time_frame: '3-7 business days',
      requirements: ['18+ months in business', 'Monthly revenue $20k+', 'Credit score 625+'],
      is_default: true,
      created_by: 'system',
      created_at: new Date().toISOString()
    }
  ];

  const updateLenderStatus = async (
    applicationId: string, 
    lenderId: string, 
    status: string, 
    approvalAmount?: number, 
    lenderEmail?: string, 
    lenderPhone?: string,
    notes?: string
  ) => {
    try {
      // Update lender submission in database
      const { error } = await supabase
        .from('lender_submissions')
        .update({
          status,
          approval_amount: approvalAmount,
          lender_email: lenderEmail,
          lender_phone: lenderPhone,
          notes,
          updated_date: new Date().toISOString().split('T')[0]
        })
        .eq('application_id', applicationId)
        .eq('lender_id', lenderId);

      if (error) {
        console.error('Error updating lender status:', error);
        return;
      }

      // Update application status based on lender responses
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        const updatedLenders = app.submittedLenders.map(l => 
          l.id === lenderId 
            ? { ...l, status: status as any, approvalAmount, lenderEmail, lenderPhone, notes, updatedDate: new Date().toISOString().split('T')[0] }
            : l
        );

        let newAppStatus = app.status;
        if (status === 'funded') {
          newAppStatus = 'funded';
        } else if (status === 'approved' && app.status !== 'funded') {
          newAppStatus = 'approved';
        } else if (updatedLenders.every(l => l.status === 'declined')) {
          newAppStatus = 'declined';
        }

        // Update application status in database
        await supabase
          .from('applications')
          .update({ status: newAppStatus })
          .eq('id', applicationId);
      }

      // Refresh data
      await loadApplications();
    } catch (error) {
      console.error('Error updating lender status:', error);
    }
  };

  const addApplication = async (
    applicationData: Omit<Application, 'id' | 'created_at'>, 
    lenderIds: string[], 
    lenderNames: string[]
  ): Promise<string> => {
    try {
      // Generate application ID
      const year = new Date().getFullYear();
      const count = applications.filter(app => app.id.startsWith(`APP-${year}`)).length + 1;
      const applicationId = `APP-${year}-${count.toString().padStart(3, '0')}`;

      // Insert application
      const { error: appError } = await supabase
        .from('applications')
        .insert({
          id: applicationId,
          ...applicationData
        });

      if (appError) {
        console.error('Error creating application:', appError);
        throw appError;
      }

      // Insert lender submissions
      const lenderSubmissions = lenderIds.map((lenderId, index) => ({
        application_id: applicationId,
        lender_id: lenderId,
        lender_name: lenderNames[index],
        status: 'under_review'
      }));

      const { error: lenderError } = await supabase
        .from('lender_submissions')
        .insert(lenderSubmissions);

      if (lenderError) {
        console.error('Error creating lender submissions:', lenderError);
        throw lenderError;
      }

      // Insert document records (placeholder for now)
      const documents = [
        { application_id: applicationId, document_type: 'funding_application', file_name: `funding-app-${applicationId}.pdf` },
        { application_id: applicationId, document_type: 'bank_statement_1', file_name: `bank-stmt-1-${applicationId}.pdf` },
        { application_id: applicationId, document_type: 'bank_statement_2', file_name: `bank-stmt-2-${applicationId}.pdf` },
        { application_id: applicationId, document_type: 'bank_statement_3', file_name: `bank-stmt-3-${applicationId}.pdf` }
      ];

      const { error: docError } = await supabase
        .from('documents')
        .insert(documents);

      if (docError) {
        console.error('Error creating documents:', docError);
        // Don't throw here as documents are not critical
      }

      // Refresh data
      await loadApplications();
      
      return applicationId;
    } catch (error) {
      console.error('Error adding application:', error);
      throw error;
    }
  };

  const addLender = async (lenderData: Omit<Lender, 'id' | 'created_at'>) => {
    try {
      // Generate lender ID from name
      const lenderId = lenderData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      
      const { error } = await supabase
        .from('lenders')
        .insert({
          id: lenderId,
          ...lenderData
        });

      if (error) {
        console.error('Error creating lender:', error);
        throw error;
      }

      await loadLenders();
    } catch (error) {
      console.error('Error adding lender:', error);
      throw error;
    }
  };

  const updateLender = async (id: string, updates: Partial<Lender>) => {
    try {
      const { error } = await supabase
        .from('lenders')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating lender:', error);
        throw error;
      }

      await loadLenders();
    } catch (error) {
      console.error('Error updating lender:', error);
      throw error;
    }
  };

  const deleteLender = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lenders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting lender:', error);
        throw error;
      }

      await loadLenders();
    } catch (error) {
      console.error('Error deleting lender:', error);
      throw error;
    }
  };

  const getApplicationsForClient = (clientEmail: string) => {
    return applications.filter(app => app.clientEmail === clientEmail);
  };

  const refreshData = async () => {
    await loadApplications();
    await loadLenders();
  };

  return (
    <SharedDataContext.Provider value={{ 
      applications, 
      lenders,
      loading,
      loadingLenders,
      updateLenderStatus, 
      addApplication,
      addLender,
      updateLender,
      deleteLender,
      getApplicationsForClient,
      refreshData
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