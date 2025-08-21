import React, { useState } from 'react';
import { Building2, DollarSign, Clock, CheckCircle, Circle, X } from 'lucide-react';
import { ApplicationData, Lender } from '../ApplicationForm';

interface LenderSelectionStepProps {
  data: ApplicationData;
  updateData: (section: keyof ApplicationData, data: any) => void;
  onNext: () => void;
  resubmissionData?: {
    applicationId: string;
    submittedLenders: string[];
  } | null;
}

const availableLenders: Lender[] = [
  {
    id: 'rapid-capital',
    name: 'Rapid Capital Solutions',
    logo: 'RC',
    description: 'Fast approval process with competitive rates for established businesses',
    minAmount: 10000,
    maxAmount: 500000,
    timeFrame: '24-48 hours',
    requirements: ['6+ months in business', 'Min $10K monthly revenue', 'Credit score 550+'],
    selected: false
  },
  {
    id: 'business-funding',
    name: 'Business Funding Network',
    logo: 'BF',
    description: 'Flexible terms and high approval rates for various industries',
    minAmount: 5000,
    maxAmount: 750000,
    timeFrame: '1-3 business days',
    requirements: ['3+ months in business', 'Min $8K monthly revenue', 'No bankruptcies'],
    selected: false
  },
  {
    id: 'merchant-advance',
    name: 'Merchant Advance Pro',
    logo: 'MA',
    description: 'Specialized in retail and restaurant funding with same-day decisions',
    minAmount: 15000,
    maxAmount: 300000,
    timeFrame: 'Same day',
    requirements: ['12+ months in business', 'Min $15K monthly revenue', 'Credit score 600+'],
    selected: false
  },
  {
    id: 'capital-bridge',
    name: 'Capital Bridge Financial',
    logo: 'CB',
    description: 'Large funding amounts for growing businesses with excellent support',
    minAmount: 25000,
    maxAmount: 1000000,
    timeFrame: '2-5 business days',
    requirements: ['18+ months in business', 'Min $25K monthly revenue', 'Credit score 650+'],
    selected: false
  },
  {
    id: 'quick-cash',
    name: 'QuickCash Business',
    logo: 'QC',
    description: 'Emergency funding solutions with minimal documentation required',
    minAmount: 3000,
    maxAmount: 100000,
    timeFrame: '2-6 hours',
    requirements: ['3+ months in business', 'Min $5K monthly revenue', 'Active bank account'],
    selected: false
  },
  {
    id: 'premier-funding',
    name: 'Premier Funding Group',
    logo: 'PF',
    description: 'Premium lender with excellent rates for qualified businesses',
    minAmount: 50000,
    maxAmount: 2000000,
    timeFrame: '3-7 business days',
    requirements: ['24+ months in business', 'Min $50K monthly revenue', 'Credit score 700+'],
    selected: false
  }
];

export function LenderSelectionStep({ data, updateData, onNext, resubmissionData }: LenderSelectionStepProps) {
  const [lenders, setLenders] = useState<Lender[]>(
    data.selectedLenders.length > 0 ? data.selectedLenders : availableLenders
  );

  const toggleLender = (lenderId: string) => {
    // Don't allow selection of previously submitted lenders
    if (resubmissionData?.submittedLenders.includes(lenderId)) {
      return;
    }
    
    const updatedLenders = lenders.map(lender =>
      lender.id === lenderId ? { ...lender, selected: !lender.selected } : lender
    );
    setLenders(updatedLenders);
    updateData('selectedLenders', updatedLenders);
  };

  const selectedCount = lenders.filter(l => l.selected).length;
  const isValid = selectedCount > 0;

  const isLenderSubmitted = (lenderId: string) => {
    return resubmissionData?.submittedLenders.includes(lenderId) || false;
  };

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
                {resubmissionData 
                  ? 'Select additional lenders to waterfall your application. Focus on lenders with different criteria or approval processes.'
                  : 'Select 3-5 lenders for optimal results. Consider funding amounts, timeframes, and requirements that match your business profile.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Building2 className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h3 className="font-medium text-blue-900">Lender Selection Tips</h3>
            <p className="text-sm text-blue-700 mt-1">
              Select 3-5 lenders for optimal results. Consider funding amounts, timeframes, and requirements that match your business profile.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {lenders.map((lender) => {
          const isSubmitted = isLenderSubmitted(lender.id);
          
          return (
          <div
            key={lender.id}
            className={`border-2 rounded-lg p-6 transition-all ${
              isSubmitted
                ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                : lender.selected
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 cursor-pointer hover:shadow-md'
            }`}
            onClick={() => !isSubmitted && toggleLender(lender.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className={`w-12 h-12 bg-gradient-to-br ${
                  isSubmitted ? 'from-gray-400 to-gray-600' : 'from-blue-600 to-blue-800'
                } rounded-lg flex items-center justify-center mr-3`}>
                  <span className="text-white font-bold text-sm">{lender.logo}</span>
                </div>
                <div>
                  <h3 className={`font-semibold ${isSubmitted ? 'text-gray-500' : 'text-gray-900'}`}>
                    {lender.name}
                    {isSubmitted && <span className="ml-2 text-xs text-orange-600 font-medium">(Already Submitted)</span>}
                  </h3>
                  <p className={`text-sm ${isSubmitted ? 'text-gray-400' : 'text-gray-600'}`}>
                    {lender.description}
                  </p>
                </div>
              </div>
              {isSubmitted ? (
                <X className="h-6 w-6 text-gray-400 flex-shrink-0" />
              ) : lender.selected ? (
                <CheckCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
              ) : (
                <Circle className="h-6 w-6 text-gray-400 flex-shrink-0" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className={`flex items-center text-sm ${isSubmitted ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  <DollarSign className="h-4 w-4 mr-1" />
                  Funding Range
                </div>
                <p className={`font-medium ${isSubmitted ? 'text-gray-500' : 'text-gray-900'}`}>
                  ${lender.minAmount.toLocaleString()} - ${lender.maxAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <div className={`flex items-center text-sm ${isSubmitted ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                  <Clock className="h-4 w-4 mr-1" />
                  Decision Time
                </div>
                <p className={`font-medium ${isSubmitted ? 'text-gray-500' : 'text-gray-900'}`}>
                  {lender.timeFrame}
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