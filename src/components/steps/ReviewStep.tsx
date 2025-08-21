import React from 'react';
import { CheckCircle, FileText, DollarSign, Building2, Users } from 'lucide-react';
import { ApplicationData } from '../ApplicationForm';

interface ReviewStepProps {
  data: ApplicationData;
  onSubmit: () => void;
  resubmissionData?: {
    applicationId: string;
    submittedLenders: string[];
  } | null;
}

export function ReviewStep({ data, onSubmit, resubmissionData }: ReviewStepProps) {
  const { selectedLenders, documents } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {resubmissionData ? 'Review & Waterfall' : 'Review & Submit'}
        </h2>
        <p className="text-gray-600">
          {resubmissionData 
            ? `Please review the additional lenders selected for waterfalling application ${resubmissionData.applicationId}`
            : 'Please review all information before submitting your application'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected Lenders */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              {resubmissionData ? 'Additional Lenders' : 'Selected Lenders'}
            </h3>
          </div>
          <div className="space-y-3">
            {selectedLenders.filter(l => l.selected).map((lender) => (
              <div key={lender.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-xs">{lender.logo}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{lender.name}</p>
                    <p className="text-xs text-gray-600">{lender.timeFrame}</p>
                  </div>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            ))}
            {selectedLenders.filter(l => l.selected).length === 0 && (
              <p className="text-gray-500 italic">No lenders selected</p>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Funding Application PDF:</span>
              {documents.fundingApplication ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Uploaded</span>
                </div>
              ) : (
                <span className="text-sm text-red-600">Missing</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Bank Statement #1:</span>
              {documents.bankStatement1 ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Uploaded</span>
                </div>
              ) : (
                <span className="text-sm text-red-600">Missing</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Bank Statement #2:</span>
              {documents.bankStatement2 ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Uploaded</span>
                </div>
              ) : (
                <span className="text-sm text-red-600">Missing</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Bank Statement #3:</span>
              {documents.bankStatement3 ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Uploaded</span>
                </div>
              ) : (
                <span className="text-sm text-red-600">Missing</span>
              )}
            </div>
          </div>
        </div>

        {/* Submission Summary */}
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Building2 className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              {resubmissionData ? 'Waterfall Summary' : 'Submission Summary'}
            </h3>
          </div>
          <div className="space-y-2">
            {resubmissionData && (
              <p className="text-sm text-blue-700 font-medium mb-2">
                Application ID: {resubmissionData.applicationId}
              </p>
            )}
            <p className="text-sm text-gray-700">
              Your application will be {resubmissionData ? 'waterfalled' : 'submitted'} to <strong>{selectedLenders.filter(l => l.selected).length}</strong> {resubmissionData ? 'additional' : 'selected'} lenders.
            </p>
            <p className="text-sm text-gray-700">
              Each lender will receive your funding application PDF and bank statements for review.
            </p>
            <p className="text-sm text-blue-700 font-medium">
              You will receive notifications as lenders respond to your application.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Terms & Conditions</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            By submitting this application, you acknowledge and agree that:
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>All information provided is accurate and complete to the best of your knowledge</li>
            <li>You authorize us to verify the information and run credit checks as necessary</li>
            <li>You understand this is an application and not a guarantee of funding</li>
            <li>Terms and conditions may vary based on your business profile and creditworthiness</li>
            <li>You agree to our privacy policy and data handling practices</li>
            <li>Your application will be shared with the selected lenders for review and processing</li>
          </ul>
        </div>
        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              required
            />
            <span className="ml-2 text-sm text-blue-800">
              I agree to the terms and conditions above
            </span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSubmit}
          className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
        >
          {resubmissionData ? 'Waterfall to Additional Lenders' : 'Submit to Selected Lenders'}
        </button>
      </div>
    </div>
  );
}