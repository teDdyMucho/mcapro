import React, { useState } from 'react';
import { Search, Filter, Eye, FileText, Calendar, Building2, Edit, Save, X, DollarSign, Mail } from 'lucide-react';
import { useSharedData } from '../../../contexts/SharedDataContext';
import { supabase } from '../../../lib/supabase';

export function ApplicationsTab() {
  const { applications, updateLenderStatus, loading } = useSharedData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [editingLender, setEditingLender] = useState<{
    applicationId: string;
    lenderId: string;
  } | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    approvalAmount: '',
    lenderEmail: '',
    notes: ''
  });

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'funded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const handleEditLender = (applicationId: string, lenderId: string, lender: any) => {
    setEditingLender({ applicationId, lenderId });
    setEditForm({
      status: lender.status,
      approvalAmount: lender.approvalAmount?.toString() || '',
      lenderEmail: lender.lenderEmail || '',
      notes: lender.notes || ''
    });
  };

  const handleSaveLender = () => {
    if (!editingLender) return;

    updateLenderStatus(
      editingLender.applicationId,
      editingLender.lenderId,
      editForm.status,
      editForm.approvalAmount ? parseInt(editForm.approvalAmount) : undefined,
      editForm.lenderEmail || undefined,
      undefined, // lenderPhone - we'll add this field later if needed
      editForm.notes || undefined
    );

    // Send webhook notification
    sendWebhookNotification();

    setEditingLender(null);
    setEditForm({ status: '', approvalAmount: '', lenderEmail: '', notes: '' });
  };

  const sendWebhookNotification = async () => {
    if (!editingLender) return;

    try {
      const application = applications.find(app => app.id === editingLender.applicationId);
      const lender = application?.submittedLenders.find(l => l.id === editingLender.lenderId);

      // Fetch the lender submission ID from database
      const { data: submissionData, error } = await supabase
        .from('lender_submissions')
        .select('id')
        .eq('application_id', editingLender.applicationId)
        .eq('lender_id', editingLender.lenderId)
        .single();

      if (error) {
        console.error('Error fetching submission ID:', error);
      }

      const webhookData = {
        submissionId: submissionData?.id || null,
        applicationId: editingLender.applicationId,
        lenderId: editingLender.lenderId,
        lenderName: lender?.name || 'Unknown',
        status: editForm.status,
        approvalAmount: editForm.approvalAmount ? parseInt(editForm.approvalAmount) : null,
        lenderEmail: editForm.lenderEmail || null,
        notes: editForm.notes || null,
        clientName: application?.clientName || '',
        company: application?.company || '',
        requestedAmount: application?.amount || 0,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('https://primary-production-c8d0.up.railway.app/webhook/approvalAdmin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        console.error('Webhook failed:', response.status, response.statusText);
      } else {
        console.log('Webhook sent successfully');
      }
    } catch (error) {
      console.error('Error sending webhook:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingLender(null);
    setEditForm({ status: '', approvalAmount: '', lenderEmail: '', notes: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Application Management</h2>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by client name, company, or application ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
          >
            <option value="all">All Status</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="funded">Funded</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading applications...</p>
        </div>
      ) : (
        <div className="space-y-4">
        {filteredApplications.map((app) => (
          <div
            key={app.id}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{app.id}</h3>
                    <p className="text-sm text-gray-600">{app.clientName} - {app.company}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${app.amount.toLocaleString()}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                    {app.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedApplication(selectedApplication === app.id ? null : app.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                Submitted: {new Date(app.submittedDate).toLocaleDateString()}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="h-4 w-4 mr-2" />
                Documents: {Object.values(app.documents).filter(Boolean).length}/4 uploaded
              </div>
            </div>

            {/* Lender Status */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Lender Submissions:</h4>
              <div className="space-y-2">
                {app.submittedLenders.map((lender) => (
                  <div key={lender.id} className="bg-gray-50 p-3 rounded-lg">
                    {editingLender?.applicationId === app.id && editingLender?.lenderId === lender.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-900">{lender.name}</h5>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveLender}
                              className="text-green-600 hover:text-green-800 p-1"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-800 p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="under_review">Under Review</option>
                              <option value="approved">Approved</option>
                              <option value="declined">Declined</option>
                              <option value="funded">Funded</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Approval Amount</label>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                              <input
                                type="number"
                                value={editForm.approvalAmount}
                                onChange={(e) => setEditForm({ ...editForm, approvalAmount: e.target.value })}
                                className="w-full text-sm border border-gray-300 rounded pl-6 pr-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Amount"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Lender Email</label>
                            <div className="relative">
                              <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                              <input
                                type="email"
                                value={editForm.lenderEmail}
                                onChange={(e) => setEditForm({ ...editForm, lenderEmail: e.target.value })}
                                className="w-full text-sm border border-gray-300 rounded pl-6 pr-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="lender@example.com"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                              value={editForm.notes}
                              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                              rows={2}
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Add notes..."
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{lender.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                lender.status === 'approved' ? 'bg-green-100 text-green-800' :
                                lender.status === 'declined' ? 'bg-red-100 text-red-800' :
                                lender.status === 'funded' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {lender.status.replace('_', ' ').toUpperCase()}
                              </span>
                              <button
                                onClick={() => handleEditLender(app.id, lender.id, lender)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          
                          {(lender.approvalAmount || lender.lenderEmail || lender.notes) && (
                            <div className="text-xs text-gray-600 space-y-1">
                              {lender.approvalAmount && (
                                <div>Approved: ${lender.approvalAmount.toLocaleString()}</div>
                              )}
                              {lender.lenderEmail && (
                                <div>Contact: {lender.lenderEmail}</div>
                              )}
                              {lender.notes && (
                                <div>Notes: {lender.notes}</div>
                              )}
                              {lender.updatedDate && (
                                <div>Updated: {new Date(lender.updatedDate).toLocaleDateString()}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Expanded Details */}
            {selectedApplication === app.id && (
              <div className="mt-4 border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Client Information</h5>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Name: {app.clientName}</p>
                      <p>Email: {app.clientEmail}</p>
                      <p>Company: {app.company}</p>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Documents</h5>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Funding Application: {app.documents.fundingApplication}</p>
                      <p>Bank Statement 1: {app.documents.bankStatement1}</p>
                      <p>Bank Statement 2: {app.documents.bankStatement2}</p>
                      <p>Bank Statement 3: {app.documents.bankStatement3}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        </div>
      )}

      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}