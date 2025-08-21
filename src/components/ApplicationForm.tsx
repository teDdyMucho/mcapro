import React, { useState } from 'react';
import { LenderSelectionStep } from './steps/LenderSelectionStep';
import { FundingDetailsStep } from './steps/FundingDetailsStep';
import { DocumentUploadStep } from './steps/DocumentUploadStep';
import { ReviewStep } from './steps/ReviewStep';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface ApplicationFormProps {
  onComplete: () => void;
  resubmissionData?: {
    applicationId: string;
    submittedLenders: string[];
  } | null;
}

export interface Lender {
  id: string;
  name: string;
  logo: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  timeFrame: string;
  requirements: string[];
  selected: boolean;
}

export interface ApplicationData {
  selectedLenders: Lender[];
  documents: {
    fundingApplication: File | null;
    bankStatement1: File | null;
    bankStatement2: File | null;
    bankStatement3: File | null;
  };
}

export function ApplicationForm({ onComplete, resubmissionData }: ApplicationFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    selectedLenders: [],
    documents: {
      fundingApplication: null,
      bankStatement1: null,
      bankStatement2: null,
      bankStatement3: null
    }
  });

  const steps = [
    { title: 'Select Lenders', component: LenderSelectionStep },
    { title: 'Document Upload', component: DocumentUploadStep },
    { title: 'Review & Submit', component: ReviewStep }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // In a real app, this would submit to your backend
    const message = resubmissionData 
      ? `Application ${resubmissionData.applicationId} resubmitted successfully to new lenders!`
      : 'Application submitted successfully!';
    alert(message);
    onComplete();
  };

  const updateApplicationData = (section: keyof ApplicationData, data: any) => {
    setApplicationData(prev => ({
      ...prev,
      [section]: section === 'selectedLenders' ? data : { ...prev[section], ...data }
    }));
  };

  const CurrentStepComponent = steps[currentStep].component;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Progress Bar */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    index < currentStep
                      ? 'bg-green-100 text-green-800'
                      : index === currentStep
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`ml-4 h-0.5 w-16 ${
                      index < currentStep ? 'bg-green-200' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          <CurrentStepComponent
            data={applicationData}
            updateData={updateApplicationData}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isLastStep={isLastStep}
            resubmissionData={resubmissionData}
          />
        </div>

        {/* Navigation */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          {!isLastStep ? (
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Submit Application
            </button>
          )}
        </div>
      </div>
    </div>
  );
}