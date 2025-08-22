import { useRef } from 'react';
import { Upload, FileText, CheckCircle, X } from 'lucide-react';
import { ApplicationData } from '../ApplicationForm';

interface DocumentUploadStepProps {
  data: ApplicationData;
  updateData: (section: keyof ApplicationData, data: { fundingApplication?: File | null; bankStatement1?: File | null; bankStatement2?: File | null; bankStatement3?: File | null; } | string[]) => void;
  onNext: () => void;
}

export function DocumentUploadStep({ data, updateData, onNext }: DocumentUploadStepProps) {
  const applicationRef = useRef<HTMLInputElement>(null);
  const bankStatement1Ref = useRef<HTMLInputElement>(null);
  const bankStatement2Ref = useRef<HTMLInputElement>(null);
  const bankStatement3Ref = useRef<HTMLInputElement>(null);

  const handleFileUpload = (field: keyof typeof data.documents, file: File | null) => {
    updateData('documents', { [field]: file });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const DocumentUploadBox = ({ 
    title, 
    description, 
    file, 
    inputRef, 
    field,
    required = false
  }: {
    title: string;
    description: string;
    file: File | null;
    inputRef: React.RefObject<HTMLInputElement>;
    field: keyof typeof data.documents;
    required?: boolean;
  }) => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={(e) => handleFileUpload(field, e.target.files?.[0] || null)}
        className="hidden"
      />
      
      {file ? (
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-2">
            {file.name} ({formatFileSize(file.size)})
          </p>
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Replace
            </button>
            <button
              onClick={() => handleFileUpload(field, null)}
              className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {title} {required && <span className="text-red-500">*</span>}
          </h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          <button
            onClick={() => inputRef.current?.click()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4 inline mr-2" />
            Upload File
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
          </p>
        </div>
      )}
    </div>
  );

  const isValid = () => {
    return data.documents.fundingApplication && 
           data.documents.bankStatement1 && 
           data.documents.bankStatement2 && 
           data.documents.bankStatement3;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Document Upload</h2>
        <p className="text-gray-600">Please upload your completed funding application PDF and three most recent business bank statements</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <FileText className="h-5 w-5 text-yellow-400 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Document Requirements</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc pl-4 space-y-1">
                <li>Funding application must be a completed PDF form with all business and financial information</li>
                <li>All documents must be clearly readable and complete</li>
                <li>Bank statements must be consecutive months (most recent 3 months)</li>
                <li>Files must be under 10MB each</li>
                <li>Accepted formats: PDF, DOC, DOCX, JPG, PNG</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DocumentUploadBox
          title="Funding Application PDF"
          description="Upload your completed funding application form (PDF format preferred)"
          file={data.documents.fundingApplication}
          inputRef={applicationRef}
          field="fundingApplication"
          required={true}
        />

        <DocumentUploadBox
          title="Bank Statement #1"
          description="Most recent business bank statement"
          file={data.documents.bankStatement1}
          inputRef={bankStatement1Ref}
          field="bankStatement1"
          required={true}
        />

        <DocumentUploadBox
          title="Bank Statement #2"
          description="Second most recent business bank statement"
          file={data.documents.bankStatement2}
          inputRef={bankStatement2Ref}
          field="bankStatement2"
          required={true}
        />

        <DocumentUploadBox
          title="Bank Statement #3"
          description="Third most recent business bank statement"
          file={data.documents.bankStatement3}
          inputRef={bankStatement3Ref}
          field="bankStatement3"
          required={true}
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Security & Privacy</h3>
        <p className="text-sm text-blue-700">
          All uploaded documents are encrypted and stored securely. Your information is protected 
          with bank-level security and will only be used for processing your funding application.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!isValid()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Review
        </button>
      </div>
    </div>
  );
}