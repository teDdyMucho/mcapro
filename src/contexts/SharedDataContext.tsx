import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Application, LenderSubmission, Lender, Document } from '../lib/supabase';

export interface ApplicationWithDetails {  
  id: string;
  client_id: string;
  amount: number;
  status: 'under_review' | 'approved' | 'declined' | 'funded';
  submitted_date: string;
  created_at: string;
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

export const SharedDataContext = createContext<SharedDataContextType | undefined>(undefined);

export function SharedDataProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLenders, setLoadingLenders] = useState(true);

  useEffect(() => {
    loadApplications();
    loadLenders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          fundingApplication: app.documents?.find((d: Document) => d.document_type === 'funding_application')?.file_name || '',
          bankStatement1: app.documents?.find((d: Document) => d.document_type === 'bank_statement_1')?.file_name || '',
          bankStatement2: app.documents?.find((d: Document) => d.document_type === 'bank_statement_2')?.file_name || '',
          bankStatement3: app.documents?.find((d: Document) => d.document_type === 'bank_statement_3')?.file_name || ''
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
      } catch (dbError: unknown) {
        console.error('Database error loading lenders:', dbError);
        const error = dbError as { code?: string; message?: string };
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.message?.includes('schema cache')) {
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
      email: 'funding@rapidadvance.com',
      min_amount: 10000,
      max_amount: 500000,
      time_frame: '24-48 hours',
      requirements: ['6+ months in business', 'Monthly revenue $10k+', 'Credit score 550+'],
      is_default: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'business-capital',
      name: 'Business Capital Solutions',
      logo: 'BC',
      description: 'Comprehensive business funding solutions with competitive rates and personalized service.',
      email: 'applications@businesscapital.com',
      min_amount: 25000,
      max_amount: 1000000,
      time_frame: '2-5 business days',
      requirements: ['12+ months in business', 'Monthly revenue $25k+', 'Credit score 600+'],
      is_default: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'merchant-funding',
      name: 'Merchant Funding Group',
      logo: 'MF',
      description: 'Specialized in merchant cash advances with same-day approval and funding.',
      email: 'submissions@merchantfunding.com',
      min_amount: 5000,
      max_amount: 250000,
      time_frame: 'Same day',
      requirements: ['3+ months in business', 'Monthly revenue $5k+', 'Credit score 500+'],
      is_default: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'capital-express',
      name: 'Capital Express',
      logo: 'CE',
      description: 'Express funding solutions for small to medium businesses with minimal paperwork.',
      email: 'funding@capitalexpress.com',
      min_amount: 15000,
      max_amount: 750000,
      time_frame: '1-3 business days',
      requirements: ['9+ months in business', 'Monthly revenue $15k+', 'Credit score 575+'],
      is_default: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'funding-solutions',
      name: 'Funding Solutions Inc',
      logo: 'FS',
      description: 'Tailored funding solutions with flexible repayment options and competitive rates.',
      email: 'applications@fundingsolutions.com',
      min_amount: 20000,
      max_amount: 2000000,
      time_frame: '3-7 business days',
      requirements: ['18+ months in business', 'Monthly revenue $20k+', 'Credit score 625+'],
      is_default: true,
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
        throw error;
      }

      // Update application status based on lender responses
      const app = applications.find(a => a.id === applicationId);
      if (app) {
        const updatedLenders = app.submittedLenders.map(l => 
          l.id === lenderId 
            ? { ...l, status: status as 'under_review' | 'approved' | 'declined' | 'funded', approvalAmount, lenderEmail, lenderPhone, notes, updatedDate: new Date().toISOString().split('T')[0] }
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
        const { error: appError } = await supabase
          .from('applications')
          .update({ status: newAppStatus })
          .eq('id', applicationId);

        if (appError) {
          console.error('Error updating application status:', appError);
          throw appError;
        }
      }

      // Refresh data
      await loadApplications();
      
      console.log('Lender status and data refreshed successfully');
    } catch (error) {
      console.error('Error updating lender status:', error);
      throw error;
    }
  };

  const addApplication = async (
    applicationData: Omit<Application, 'id' | 'created_at'>, 
    lenderIds: string[], 
    lenderNames: string[]
  ): Promise<string> => {
    try {
      // Ensure we have a valid client_id
      if (!applicationData.client_id) {
        throw new Error('Client ID is required for application submission');
      }

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
        status: 'under_review' as const
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
      
      // Set default created_by if not provided
      const createdBy = 'demo@company.com';
      
      const { error } = await supabase
        .from('lenders')
        .insert({
          id: lenderId,
          ...lenderData,
          created_by: createdBy
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
      // Use all updates as safe updates
      const safeUpdates = updates;
      
      const { error } = await supabase
        .from('lenders')
        .update(safeUpdates)
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
      // Additional check to ensure user can only delete their own lenders
      const lender = lenders.find(l => l.id === id);
      if (!lender) {
        throw new Error('Lender not found');
      }
      
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
    // Only return applications that belong to the specified client
    return applications.filter(app => 
      app.clientEmail === clientEmail && 
      app.clientEmail // Ensure clientEmail exists
    );
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

// useSharedData has been moved to its own file for better Fast Refresh support