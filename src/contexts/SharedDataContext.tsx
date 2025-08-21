import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Application, LenderSubmission, Client } from '../lib/supabase';

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
  loading: boolean;
  updateLenderStatus: (applicationId: string, lenderId: string, status: string, approvalAmount?: number, lenderEmail?: string, lenderPhone?: string, notes?: string) => Promise<void>;
  addApplication: (application: Omit<Application, 'id' | 'created_at'>, lenderIds: string[], lenderNames: string[]) => Promise<string>;
  getApplicationsForClient: (clientEmail: string) => ApplicationWithDetails[];
  refreshData: () => Promise<void>;
}

const SharedDataContext = createContext<SharedDataContextType | undefined>(undefined);

export function SharedDataProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
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

  const getApplicationsForClient = (clientEmail: string) => {
    return applications.filter(app => app.clientEmail === clientEmail);
  };

  const refreshData = async () => {
    await loadApplications();
  };

  return (
    <SharedDataContext.Provider value={{ 
      applications, 
      loading,
      updateLenderStatus, 
      addApplication,
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