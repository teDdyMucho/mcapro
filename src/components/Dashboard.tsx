import { useState } from 'react';
import { Plus, FileText, Clock, CheckCircle, AlertTriangle, DollarSign, Calendar, Building2, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSharedData } from '../contexts/useSharedData';
import type { ApplicationWithDetails } from '../contexts/SharedDataContext';

interface DashboardProps {
  onStartApplication: () => void;
  onResubmitApplication: (applicationId: string, submittedLenders: string[]) => void;
}

export function Dashboard({ onStartApplication, onResubmitApplication }: DashboardProps) {
  const { user } = useAuth();
  const { getApplicationsForClient, loading } = useSharedData();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Get applications for the current user
  const applications = user ? getApplicationsForClient(user.email).map(app => ({
    ...app,
    businessName: app.company,
    submittedDate: app.submitted_date // Map the property name for consistency
  })) : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'under_review':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'funded':
        return <DollarSign className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'funded':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getLenderStatusColor = (status: string) => {
    switch (status) {
      case 'under_review':
        return 'text-yellow-600';
      case 'approved':
        return 'text-green-600';
      case 'funded':
        return 'text-blue-600';
      case 'declined':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // We're using handleResubmit directly for all applications

  const handleResubmit = (app: ApplicationWithDetails) => {
    const submittedLenderIds = app.submittedLenders.map(l => l.id);
    onResubmitApplication(app.id, submittedLenderIds);
  };

  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  const getFilterCount = (status: string) => {
    if (status === 'all') return applications.length;
    return applications.filter(app => app.status === status).length;
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}</h1>
            <p className="text-blue-100 text-lg">{user?.company}</p>
            <p className="text-blue-200 mt-1">Manage your funding applications and track progress</p>
          </div>
          <Building2 className="h-16 w-16 text-blue-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Your Applications</h2>
              <button
                onClick={onStartApplication}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Application</span>
              </button>
            </div>

            {/* Filter Section */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-3">
                <Filter className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="font-medium text-gray-900">Filter by Status</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  All ({getFilterCount('all')})
                </button>
                <button
                  onClick={() => setStatusFilter('under_review')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === 'under_review'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Under Review ({getFilterCount('under_review')})
                </button>
                <button
                  onClick={() => setStatusFilter('approved')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === 'approved'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Approved ({getFilterCount('approved')})
                </button>
                <button
                  onClick={() => setStatusFilter('funded')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === 'funded'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Funded ({getFilterCount('funded')})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading applications...</p>
              </div>
            ) : (
              <div className="space-y-4">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleResubmit(app)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(app.status)}
                      <div>
                        <h3 className="font-medium text-gray-900">{app.id}</h3>
                        <p className="text-sm text-gray-600">{app.businessName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${app.amount.toLocaleString()}
                      </p>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}
                      >
                        {app.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Lender Submission History */}
                  <div className="mt-4 border-t pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Submitted to:</h4>
                    <div className="flex flex-wrap gap-2">
                      {app.submittedLenders.map((lender) => (
                        <div
                          key={lender.id}
                          className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-md text-xs"
                        >
                          <span className="text-gray-700">{lender.name}</span>
                          <span className={`font-medium ${getLenderStatusColor(lender.status)}`}>
                            ({lender.status.replace('_', ' ')})
                          </span>
                        </div>
                      ))}
                    </div>
                    {app.status !== 'funded' && (
                      <div className="mt-2">
                        <span className="text-xs text-blue-600 font-medium cursor-pointer hover:text-blue-800">
                          Click to waterfall to additional lenders →
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    Submitted: {new Date(app.submittedDate || app.submitted_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {filteredApplications.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No applications found.</p>
                </div>
              )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Applications</span>
                <span className="font-semibold">{applications.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Approved Amount</span>
                <span className="font-semibold text-green-600">$75,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Funded Amount</span>
                <span className="font-semibold text-blue-600">$25,000</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Next Steps</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Submit New Application</p>
                  <p className="text-sm text-gray-600">Apply for additional funding</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Review Pending</p>
                  <p className="text-sm text-gray-600">APP-2024-001 under review</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}