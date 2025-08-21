import React, { useState } from 'react';
import { TrendingUp, DollarSign, Mail, Building2, Calendar, CheckCircle, Filter, Search, Phone, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSharedData } from '../contexts/SharedDataContext';

export function ApprovalsView() {
  const { user } = useAuth();
  const { getApplicationsForClient } = useSharedData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'lender'>('date');

  // Get applications for the current user from shared data
  const applications = getApplicationsForClient(user?.email || '').map(app => ({
    ...app,
    businessName: app.company,
    clientName: app.clientName
  }));

  // Get all approved lender submissions
  const approvedSubmissions = applications.flatMap(app =>
    app.submittedLenders
      .filter(lender => lender.status === 'approved' || lender.status === 'funded')
      .map(lender => ({
        ...lender,
        applicationId: app.id,
        requestedAmount: app.amount,
        submittedDate: app.submittedDate,
        clientName: app.businessName,
        submittedDateFormatted: new Date(app.submittedDate).toLocaleDateString()
      }))
  );

  // Group approvals by lender
  const approvalsByLender = approvedSubmissions.reduce((acc, submission) => {
    const lenderName = submission.name;
    if (!acc[lenderName]) {
      acc[lenderName] = [];
    }
    acc[lenderName].push(submission);
    return acc;
  }, {} as Record<string, typeof approvedSubmissions>);

  // Filter and sort approved submissions
  const filteredSubmissions = approvedSubmissions
    .filter(submission =>
      submission.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return (b.approvalAmount || 0) - (a.approvalAmount || 0);
        case 'lender':
          return a.name.localeCompare(b.name);
        case 'date':
        default:
          return new Date(b.updatedDate || b.submittedDate).getTime() - new Date(a.updatedDate || a.submittedDate).getTime();
      }
    });

  // Filter lender groups based on search
  const filteredLenderGroups = Object.entries(approvalsByLender)
    .filter(([lenderName, submissions]) => 
      lenderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submissions.some(sub => sub.applicationId.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort(([a], [b]) => a.localeCompare(b));

  const totalApprovedAmount = approvedSubmissions.reduce((sum, submission) => 
    sum + (submission.approvalAmount || 0), 0
  );

  const fundedSubmissions = approvedSubmissions.filter(s => s.status === 'funded');
  const totalFundedAmount = fundedSubmissions.reduce((sum, submission) => 
    sum + (submission.approvalAmount || 0), 0
  );

  // Group approvals by application
  const approvalsByApplication = applications
    .filter(app => app.submittedLenders.some(lender => 
      lender.status === 'approved' || lender.status === 'funded'
    ))
    .map(app => ({
      ...app,
      approvedLenders: app.submittedLenders.filter(lender => 
        lender.status === 'approved' || lender.status === 'funded'
      )
    }));

  // Filter applications based on search
  const filteredApplications = approvalsByApplication
    .filter(app =>
      app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.approvedLenders.some(lender => 
        lender.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          const aTotal = a.approvedLenders.reduce((sum, l) => sum + (l.approvalAmount || 0), 0);
          const bTotal = b.approvedLenders.reduce((sum, l) => sum + (l.approvalAmount || 0), 0);
          return bTotal - aTotal;
        case 'lender':
          return a.approvedLenders[0]?.name.localeCompare(b.approvedLenders[0]?.name) || 0;
        case 'date':
        default:
          return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
      }
    });

  const totalApplicationsWithApprovals = approvalsByApplication.length;
  const totalLenders = new Set(approvedSubmissions.map(s => s.name)).size;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Approved Offers</h1>
            <p className="text-green-100 text-lg">{user?.company}</p>
            <p className="text-green-200 mt-1">Track your approved funding offers organized by lender</p>
          </div>
          <TrendingUp className="h-16 w-16 text-green-200" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Apps with Approvals</p>
              <p className="text-2xl font-semibold text-gray-900">{totalApplicationsWithApprovals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Approvals</p>
              <p className="text-2xl font-semibold text-gray-900">{approvedSubmissions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Lenders</p>
              <p className="text-2xl font-semibold text-gray-900">{totalLenders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Approved</p>
              <p className="text-2xl font-semibold text-green-600">${totalApprovedAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Funded</p>
              <p className="text-2xl font-semibold text-blue-600">${totalFundedAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Approved Applications</h2>
        </div>

        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by application ID, client name, or lender..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="lender">Sort by Application</option>
            </select>
          </div>
        </div>

        {/* Approved Applications */}
        <div className="space-y-6">
          {filteredApplications.map((app) => (
            <div key={app.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Application Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-800 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{app.id}</h3>
                      <p className="text-green-100 text-lg">{app.clientName} - {app.company}</p>
                      <p className="text-green-200">
                        {app.approvedLenders.length} approval{app.approvedLenders.length !== 1 ? 's' : ''} • 
                        Requested: ${app.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">
                      ${app.approvedLenders.reduce((sum, l) => sum + (l.approvalAmount || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-green-100 text-sm">Total Approved</div>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="bg-green-50 p-4 border-b">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-900">Submitted Date</p>
                    <p className="text-green-700">{new Date(app.submittedDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Requested Amount</p>
                    <p className="text-green-700">${app.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Approval Rate</p>
                    <p className="text-green-700">
                      {((app.approvedLenders.reduce((sum, l) => sum + (l.approvalAmount || 0), 0) / app.amount) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Approved Lenders */}
              <div className="divide-y divide-gray-200">
                {app.approvedLenders
                  .sort((a, b) => new Date(b.updatedDate || app.submittedDate).getTime() - new Date(a.updatedDate || app.submittedDate).getTime())
                  .map((lender, index) => (
                  <div key={`${app.id}-${lender.id}-${index}`} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          lender.status === 'funded' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {lender.status === 'funded' ? (
                            <DollarSign className="h-6 w-6 text-blue-600" />
                          ) : (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{lender.name}</h4>
                          <p className="text-sm text-gray-600">Lender Approval</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${(lender.approvalAmount || 0).toLocaleString()}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lender.status === 'funded' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {lender.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Lender Contact Information */}
                    {(lender.lenderEmail || lender.lenderPhone) && (
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h5 className="font-medium text-blue-900 mb-2">Lender Contact Information</h5>
                        <div className="flex flex-col sm:flex-row gap-4">
                          {lender.lenderEmail && (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-blue-600" />
                              <a 
                                href={`mailto:${lender.lenderEmail}`}
                                className="text-blue-600 hover:text-blue-800 font-medium underline"
                              >
                                {lender.lenderEmail}
                              </a>
                            </div>
                          )}
                          {lender.lenderPhone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-blue-600" />
                              <a 
                                href={`tel:${lender.lenderPhone}`}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {lender.lenderPhone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {lender.updatedDate && (
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            Approval Date
                          </div>
                          <p className="font-medium text-gray-900">
                            {new Date(lender.updatedDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Approval Rate
                        </div>
                        <p className="font-medium text-gray-900">
                          {((lender.approvalAmount || 0) / app.amount * 100).toFixed(1)}%
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          Application Submitted
                        </div>
                        <p className="font-medium text-gray-900">{new Date(app.submittedDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {lender.notes && (
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <h6 className="font-medium text-yellow-900 mb-1">Approval Details</h6>
                        <p className="text-sm text-yellow-800">{lender.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No approved offers yet</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Your approved applications will appear here once lenders approve your submissions.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}