import React, { useState } from 'react';
import { Building2, DollarSign, Clock, CheckCircle, Circle, X, Plus, Edit, Trash2 } from 'lucide-react';
import { ApplicationData } from '../ApplicationForm';
import { useSharedData } from '../../contexts/SharedDataContext';
import { useAuth } from '../../contexts/AuthContext';
import type { Lender } from '../../lib/supabase';

interface LenderSelectionStepProps {
  data: ApplicationData;
  updateData: (section: keyof ApplicationData, data: any) => void;
  onNext: () => void;
  resubmissionData?: {
    applicationId: string;
    submittedLenders: string[];
  } | null;
}

export function LenderSelectionStep({ data, updateData, onNext, resubmissionData }: LenderSelectionStepProps) {
  const { user } = useAuth();
  const { lenders, loadingLenders, addLender, updateLender, deleteLender } = useSharedData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLender, setEditingLender] = useState<string | null>(null);
  const [lenderForm, setLenderForm] = useState({
    name: '',
    logo: '',
    description: '',
    email: '',
    min_amount: '',
    max_amount: '',
    time_frame: '',
    requirements: ['']
  });

  const toggleLender = (lenderId: string) => {
    // Don't allow selection of previously submitted lenders
    if (resubmissionData?.submittedLenders.includes(lenderId)) {
      return;
    }
    
    const updatedSelection = data.selectedLenders.includes(lenderId)
      ? data.selectedLenders.filter(id => id !== lenderId)
      : [...data.selectedLenders, lenderId];
    
    updateData('selectedLenders', updatedSelection);
  };

  const selectedCount = data.selectedLenders.length;
  const isValid = selectedCount > 0;

  const isLenderSubmitted = (lenderId: string) => {
    return resubmissionData?.submittedLenders.includes(lenderId) || false;
  };

  const handleAddLender = async () => {
    try {
      const requirements = lenderForm.requirements.filter(req => req.trim() !== '');
      
      await addLender({
        name: lenderForm.name,
        logo: lenderForm.logo || lenderForm.name.substring(0, 2).toUpperCase(),
        description: lenderForm.description,
        email: lenderForm.email,
        min_amount: parseInt(lenderForm.min_amount),
        max_amount: parseInt(lenderForm.max_amount),
        time_frame: lenderForm.time_frame,
        requirements,
        is_default: false,
        created_by: user?.email || 'demo@company.com'
      });

      setShowAddForm(false);
      setLenderForm({
        name: '',
        logo: '',
        description: '',
        email: '',
        min_amount: '',
        max_amount: '',
        time_frame: '',
        requirements: ['']
      });
    } catch (error) {
      console.error('Error adding lender:', error);
      alert('Error adding lender. Please try again.');
    }
  };

  const handleEditLender = (lender: Lender) => {
    setEditingLender(lender.id);
    setLenderForm({
      name: lender.name,
      logo: lender.logo,
      description: lender.description,
      email: lender.email,
      min_amount: lender.min_amount.toString(),
      max_amount: lender.max_amount.toString(),
      time_frame: lender.time_frame,
      requirements: [...lender.requirements, '']
    });
  };

  const handleUpdateLender = async () => {
    if (!editingLender) return;
    
    try {
      const requirements = lenderForm.requirements.filter(req => req.trim() !== '');
      
      await updateLender(editingLender, {
        name: lenderForm.name,
        logo: lenderForm.logo || lenderForm.name.substring(0, 2).toUpperCase(),
        description: lenderForm.description,
        email: lenderForm.email,
        min_amount: parseInt(lenderForm.min_amount),
        max_amount: parseInt(lenderForm.max_amount),
        time_frame: lenderForm.time_frame,
        requirements
      });

      setEditingLender(null);
      setLenderForm({
        name: '',
        logo: '',
        description: '',
        email: '',
        min_amount: '',
        max_amount: '',
        time_frame: '',
        requirements: ['']
      });
    } catch (error) {
      console.error('Error updating lender:', error);
      alert('Error updating lender. Please try again.');
    }
  };

  const handleDeleteLender = async (lenderId: string) => {
    if (!confirm('Are you sure you want to delete this lender?')) return;
    
    try {
      await deleteLender(lenderId);
    } catch (error) {
      console.error('Error deleting lender:', error);
      alert('Error deleting lender. Please try again.');
    }
  };

  const addRequirement = () => {
    setLenderForm({
      ...lenderForm,
      requirements: [...lenderForm.requirements, '']
    });
  };

  const updateRequirement = (index: number, value: string) => {
    const newRequirements = [...lenderForm.requirements];
    newRequirements[index] = value;
    setLenderForm({
      ...lenderForm,
      requirements: newRequirements
    });
  };

  const removeRequirement = (index: number) => {
    setLenderForm({
      ...lenderForm,
      requirements: lenderForm.requirements.filter((_, i) => i !== index)
    });
  };

  const canEditLender = (lender: Lender) => {
    return !lender.is_default || lender.created_by === user?.email || lender.created_by === 'demo@company.com';
  };

  if (loadingLenders) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading lenders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {resubmissionData ? 'Waterfall to Additional Lenders' : 'Select Lenders'}
        </h2>
        <p className="text-gray-600">
          {resubmissionData 
            ? `Waterfalling application ${resubmissionData.applicationId} to additional lenders. Previously submitted lenders are grayed out and cannot be selected again.`
            : 'Choose which lenders you\'d like to submit your application to. You can select multiple lenders to increase your chances of approval.'
          }
        </p>
      </div>

      {resubmissionData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Building2 className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h3 className="font-medium text-blue-900">Waterfall Mode</h3>
              <p className="text-sm text-blue-700 mt-1">
                Select additional lenders to waterfall your application. Focus on lenders with different criteria or approval processes.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Building2 className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h3 className="font-medium text-blue-900">Lender Selection Tips</h3>
              <p className="text-sm text-blue-700 mt-1">
                Select 3-5 lenders for optimal results. Consider funding amounts, timeframes, and requirements that match your business profile.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Lender</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Lender Form */}
      {(showAddForm || editingLender) && (
        <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingLender ? 'Edit Lender' : 'Add New Lender'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lender Name</label>
              <input
                type="text"
                value={lenderForm.name}
                onChange={(e) => setLenderForm({ ...lenderForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter lender name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo/Initials</label>
              <input
                type="text"
                value={lenderForm.logo}
                onChange={(e) => setLenderForm({ ...lenderForm, logo: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., ABC (auto-generated if empty)"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={lenderForm.description}
                onChange={(e) => setLenderForm({ ...lenderForm, description: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the lender"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={lenderForm.email}
                onChange={(e) => setLenderForm({ ...lenderForm, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contact@lender.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Amount</label>
              <input
                type="number"
                value={lenderForm.min_amount}
                onChange={(e) => setLenderForm({ ...lenderForm, min_amount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 10000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Amount</label>
              <input
                type="number"
                value={lenderForm.max_amount}
                onChange={(e) => setLenderForm({ ...lenderForm, max_amount: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 500000"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Decision Timeframe</label>
              <input
                type="text"
                value={lenderForm.time_frame}
                onChange={(e) => setLenderForm({ ...lenderForm, time_frame: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 24-48 hours"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
            {lenderForm.requirements.map((req, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => updateRequirement(index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter requirement"
                />
                {lenderForm.requirements.length > 1 && (
                  <button
                    onClick={() => removeRequirement(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addRequirement}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add Requirement</span>
            </button>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingLender(null);
                setLenderForm({
                  name: '',
                  logo: '',
                  description: '',
                  email: '',
                  min_amount: '',
                  max_amount: '',
                  time_frame: '',
                  requirements: ['']
                });
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={editingLender ? handleUpdateLender : handleAddLender}
              disabled={!lenderForm.name || !lenderForm.description || !lenderForm.email || !lenderForm.min_amount || !lenderForm.max_amount || !lenderForm.time_frame}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {editingLender ? 'Update Lender' : 'Add Lender'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {lenders.map((lender) => {
          const isSubmitted = isLenderSubmitted(lender.id);
          const isSelected = data.selectedLenders.includes(lender.id);
          
          return (
            <div
              key={lender.id}
              className={`border-2 rounded-lg p-6 transition-all ${
                isSubmitted
                  ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 cursor-pointer hover:shadow-md'
              }`}
              onClick={() => !isSubmitted && toggleLender(lender.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-1">
                  <div className={`w-12 h-12 bg-gradient-to-br ${
                    isSubmitted ? 'from-gray-400 to-gray-600' : 'from-blue-600 to-blue-800'
                  } rounded-lg flex items-center justify-center mr-3`}>
                    <span className="text-white font-bold text-sm">{lender.logo}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold ${isSubmitted ? 'text-gray-500' : 'text-gray-900'}`}>
                        {lender.name}
                        {isSubmitted && <span className="ml-2 text-xs text-orange-600 font-medium">(Already Submitted)</span>}
                        {!lender.is_default && <span className="ml-2 text-xs text-blue-600 font-medium">(Custom)</span>}
                      </h3>
                      {canEditLender(lender) && !isSubmitted && (
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditLender(lender);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLender(lender.id);
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className={`text-sm ${isSubmitted ? 'text-gray-400' : 'text-gray-600'}`}>
                      {lender.description}
                    </p>
                    {lender.email && (
                      <p className={`text-xs ${isSubmitted ? 'text-gray-400' : 'text-gray-500'}`}>
                        📧 {lender.email}
                      </p>
                    )}
                  </div>
                </div>
                {isSubmitted ? (
                  <X className="h-6 w-6 text-gray-400 flex-shrink-0 ml-2" />
                ) : isSelected ? (
                  <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0 ml-2" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-400 flex-shrink-0 ml-2" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className={`flex items-center text-sm ${isSubmitted ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    <DollarSign className="h-4 w-4 mr-1" />
                    Funding Range
                  </div>
                  <p className={`font-medium ${isSubmitted ? 'text-gray-500' : 'text-gray-900'}`}>
                    ${lender.min_amount.toLocaleString()} - ${lender.max_amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <div className={`flex items-center text-sm ${isSubmitted ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    <Clock className="h-4 w-4 mr-1" />
                    Decision Time
                  </div>
                  <p className={`font-medium ${isSubmitted ? 'text-gray-500' : 'text-gray-900'}`}>
                    {lender.time_frame}
                  </p>
                </div>
              </div>

              <div>
                <h4 className={`text-sm font-medium ${isSubmitted ? 'text-gray-500' : 'text-gray-700'} mb-2`}>
                  Requirements:
                </h4>
                <ul className={`text-sm ${isSubmitted ? 'text-gray-400' : 'text-gray-600'} space-y-1`}>
                  {lender.requirements.map((req, index) => (
                    <li key={index} className="flex items-center">
                      <span className={`w-1.5 h-1.5 ${isSubmitted ? 'bg-gray-300' : 'bg-gray-400'} rounded-full mr-2`}></span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Selected Lenders</h3>
            <p className="text-sm text-gray-600">
              {selectedCount} lender{selectedCount !== 1 ? 's' : ''} selected
            </p>
          </div>
          {selectedCount > 0 && (
            <div className="text-sm text-green-600 font-medium">
              Ready to proceed
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!isValid}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Document Upload
        </button>
      </div>
    </div>
  );
}