import React, { useState } from 'react';
import { 
  Building2, 
  AlertCircle, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  HelpCircle,
  Copy,
  Printer,
  Search,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Link2,
  Key
} from 'lucide-react';
import { AICTE_INSTITUTIONS } from '../data/institutions';
import { Complaint, ComplaintCategory, ComplaintPriority, EvidenceFile, DuplicateMatch } from '../types';
import { api } from '../services/api';

interface ComplaintFormProps {
  onSubmit: (formData: any) => Promise<Complaint | null>;
  onNavigateToTrack: (complaintId: string) => void;
}

export const ComplaintForm: React.FC<ComplaintFormProps> = ({ onSubmit, onNavigateToTrack }) => {
  // Form State
  const [institutionName, setInstitutionName] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Ragging & Harassment');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [academicYear, setAcademicYear] = useState('2nd Year (B.Tech / B.E.)');
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [declarationAgreed, setDeclarationAgreed] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  // Duplicate Warning Modal State
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // Institutions auto-suggest
  const [instSearch, setInstSearch] = useState('');
  const [showInstDropdown, setShowInstDropdown] = useState(false);

  const filteredInstitutions = AICTE_INSTITUTIONS.filter(
    (i) =>
      i.name.toLowerCase().includes(instSearch.toLowerCase()) ||
      i.city.toLowerCase().includes(instSearch.toLowerCase()) ||
      i.state.toLowerCase().includes(instSearch.toLowerCase()) ||
      i.aicteId.includes(instSearch)
  );

  const handleSelectInstitution = (inst: typeof AICTE_INSTITUTIONS[0]) => {
    setInstitutionName(inst.name);
    setInstitutionId(inst.aicteId);
    setInstSearch(inst.name);
    setShowInstDropdown(false);
  };

  const handleSimulateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr = `${sizeInMb} MB`;

    setEvidenceFiles([
      ...evidenceFiles,
      {
        name: file.name,
        size: sizeStr,
        type: file.type || 'application/pdf',
      },
    ]);
  };

  const handleRemoveFile = (index: number) => {
    setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index));
  };

  // Validate form fields
  const validateForm = () => {
    if (!institutionName.trim()) {
      setErrorMessage('Please select or enter the AICTE Approved Institution name.');
      return false;
    }
    if (!title.trim() || title.length < 5) {
      setErrorMessage('Please provide a descriptive subject/title for your grievance (minimum 5 characters).');
      return false;
    }
    if (!description.trim() || description.length < 25) {
      setErrorMessage('Please describe the grievance in adequate detail (minimum 25 characters).');
      return false;
    }
    if (!isAnonymous) {
      if (!studentName.trim()) {
        setErrorMessage('Complainant name is required unless submitting in anonymous mode.');
        return false;
      }
      if (!studentEmail.trim() || !studentEmail.includes('@')) {
        setErrorMessage('A valid email address is required for official hearing notifications and status updates.');
        return false;
      }
      if (!rollNumber.trim()) {
        setErrorMessage('Student Roll Number / Enrollment ID is required for institutional verification.');
        return false;
      }
    }
    if (!declarationAgreed) {
      setErrorMessage('You must confirm the statutory declaration to proceed with submission.');
      return false;
    }
    return true;
  };

  // Form submit handler - checks for duplicates first
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) return;

    // Check for similar active complaints before submission
    try {
      setIsSubmitting(true);
      const duplicateRes = await api.checkDuplicate({
        institutionName,
        category,
        title,
        description,
      });

      if (duplicateRes.hasDuplicate && duplicateRes.matches.length > 0) {
        setDuplicateMatches(duplicateRes.matches);
        setSelectedParentId(duplicateRes.matches[0].id);
        setShowDuplicateModal(true);
        setIsSubmitting(false);
        return;
      }
    } catch {
      // Proceed on network check error
    }

    // Direct submit if no duplicates
    await executeSubmission(undefined);
  };

  // Core execution of submission with optional linked parent ID
  const executeSubmission = async (linkedParentId?: string) => {
    try {
      setIsSubmitting(true);
      setShowDuplicateModal(false);

      const payload = {
        institutionName,
        institutionId: institutionId || '1-77352793',
        category,
        priority,
        title,
        description,
        isAnonymous,
        studentName: isAnonymous ? 'Anonymous Complainant' : studentName,
        studentEmail: isAnonymous ? '' : studentEmail,
        studentPhone: isAnonymous ? '' : studentPhone,
        rollNumber: isAnonymous ? 'CONFIDENTIAL' : rollNumber,
        department: department || 'General Technical Stream',
        academicYear,
        evidenceFiles,
        linkedParentId,
        submissionToken: `sub-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      };

      const result = await onSubmit(payload);
      if (result) {
        setSubmittedComplaint(result);
      } else {
        setErrorMessage('Server failed to record grievance. Please verify connection and retry.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (!submittedComplaint) return;
    navigator.clipboard.writeText(submittedComplaint.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyPin = () => {
    if (!submittedComplaint?.accessPin) return;
    navigator.clipboard.writeText(submittedComplaint.accessPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  // If complaint was submitted successfully, show acknowledgment docket
  if (submittedComplaint) {
    return (
      <div className="max-w-2xl mx-auto my-6 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Success Header */}
        <div className="bg-[#0b1e36] text-white p-6 text-center border-b border-blue-900">
          <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Grievance Successfully Registered</h2>
          <p className="text-xs text-blue-200 mt-1 max-w-md mx-auto">
            Your complaint has been docketed in the AICTE Institutional Complaint Monitoring System under statutory 15-day resolution SLA.
          </p>
        </div>

        {/* Acknowledgment Slip Details */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-xs uppercase tracking-wider text-blue-900 font-semibold mb-1">
              Statutory Grievance Tracking ID
            </div>
            <div className="text-2xl font-mono font-bold text-blue-950 flex items-center justify-center gap-2">
              <span>{submittedComplaint.id}</span>
              <button
                onClick={handleCopyId}
                className="p-1.5 text-blue-800 hover:text-blue-950 hover:bg-blue-200/50 rounded transition-colors cursor-pointer"
                title="Copy Docket ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copiedId && (
              <span className="text-[11px] font-semibold text-emerald-700 animate-fadeIn block mt-1">
                Copied Docket ID!
              </span>
            )}

            {/* Confidential Access Security PIN */}
            {submittedComplaint.accessPin && (
              <div className="mt-3 pt-3 border-t border-blue-200/60 flex items-center justify-center gap-2 text-xs">
                <Key className="w-4 h-4 text-amber-700" />
                <span className="text-slate-600">Your Private Security PIN:</span>
                <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-blue-300 text-blue-950">
                  {submittedComplaint.accessPin}
                </span>
                <button
                  onClick={handleCopyPin}
                  className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                  title="Copy Security PIN"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {copiedPin && (
                  <span className="text-[10px] font-bold text-emerald-700">Copied PIN!</span>
                )}
              </div>
            )}

            <p className="text-[11px] text-slate-500 mt-2">
              Save your Tracking ID and Security PIN. They allow you to view official hearing notices and verify case closure securely.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs border border-slate-200 rounded-lg p-3 bg-slate-50">
            <div>
              <span className="text-slate-500 block">Institution:</span>
              <span className="font-semibold text-slate-900 line-clamp-1">{submittedComplaint.institutionName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Category:</span>
              <span className="font-semibold text-slate-900">{submittedComplaint.category}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Assigned Nodal Desk:</span>
              <span className="font-semibold text-slate-900">{submittedComplaint.assignedOfficer?.name || 'AICTE Regional Nodal Desk'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Statutory SLA Deadline:</span>
              <span className="font-semibold text-rose-700">
                {new Date(submittedComplaint.slaDeadline).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })} (15 Days)
              </span>
            </div>
          </div>

          {submittedComplaint.linkedParentId && (
            <div className="p-2.5 bg-blue-50 rounded border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
              <Link2 className="w-4 h-4 shrink-0 text-blue-700" />
              <span>
                Linked as a collective grievance cluster to Docket <strong>{submittedComplaint.linkedParentId}</strong>.
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={() => onNavigateToTrack(submittedComplaint.id)}
              className="flex-1 py-2.5 px-4 bg-blue-900 text-white rounded font-medium text-xs hover:bg-blue-950 flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <span>Track Investigation Progress</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrintSlip}
              className="py-2.5 px-4 bg-white border border-slate-300 text-slate-700 rounded font-medium text-xs hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Acknowledgment Slip</span>
            </button>
            <button
              onClick={() => setSubmittedComplaint(null)}
              className="py-2.5 px-4 bg-white border border-slate-300 text-slate-700 rounded font-medium text-xs hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-colors"
            >
              Lodge Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-6 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Duplicate Warning Dialog (Non-blocking, allows student choice) */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-amber-300 text-slate-800">
            <div className="bg-amber-500 text-amber-950 p-4 flex items-center gap-2.5 border-b border-amber-600/30">
              <AlertTriangle className="w-5 h-5 text-amber-950 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Similar Active Campus Grievance Detected</h4>
                <p className="text-[11px] text-amber-950/80">
                  A similar issue was recently reported for {institutionName}
                </p>
              </div>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-slate-700 leading-relaxed">
                To streamline investigation and prevent fragmented inquiries, please review the similar ongoing complaint(s) below.
                You may either <strong>link your grievance as a collective campus issue</strong> or <strong>proceed with an independent petition</strong>.
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50">
                {duplicateMatches.map((m) => (
                  <label
                    key={m.id}
                    className={`block p-2.5 rounded border transition-colors cursor-pointer ${
                      selectedParentId === m.id
                        ? 'border-blue-900 bg-blue-50/70 ring-1 ring-blue-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="parentComplaint"
                        checked={selectedParentId === m.id}
                        onChange={() => setSelectedParentId(m.id)}
                        className="mt-0.5 text-blue-900"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 text-xs">{m.title}</span>
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-semibold">
                            {m.similarityScore}% Match
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Docket: <strong className="font-mono text-blue-900">{m.id}</strong> · Status: {m.status} · {m.category}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => executeSubmission(selectedParentId || duplicateMatches[0]?.id)}
                  className="w-full py-2.5 px-3 bg-blue-900 hover:bg-blue-950 text-white rounded font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  <span>Link as Collective Campus Grievance (Recommended)</span>
                </button>

                <button
                  type="button"
                  onClick={() => executeSubmission(undefined)}
                  className="w-full py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded font-semibold text-xs transition-colors cursor-pointer"
                >
                  Submit as My Own Independent Petition
                </button>

                <button
                  type="button"
                  onClick={() => setShowDuplicateModal(false)}
                  className="w-full py-1.5 text-slate-500 hover:text-slate-800 text-[11px] text-center cursor-pointer"
                >
                  Cancel & Review My Grievance Text
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Header */}
      <div className="bg-[#0b1e36] text-white p-5 sm:p-6 border-b border-blue-900">
        <div className="flex items-center gap-2.5 mb-1.5">
          <Building2 className="w-5 h-5 text-blue-300" />
          <h2 className="text-base sm:text-lg font-bold tracking-tight">
            Lodge Institutional Grievance Petition
          </h2>
        </div>
        <p className="text-xs text-blue-200 leading-relaxed max-w-3xl">
          Pursuant to AICTE (Establishment of Mechanism for Grievance Redressal) Regulations. Every registered petition is protected by a 15-day statutory turnaround deadline monitored by regional nodal ombudspersons.
        </p>
      </div>

      {errorMessage && (
        <div className="m-5 p-3.5 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2.5 text-xs text-rose-800 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Validation Notice: </span>
            {errorMessage}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
        {/* Section 1: Target Institution */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-blue-900 uppercase tracking-wider pb-1.5 border-b border-slate-200 flex items-center justify-between">
            <span>1. AICTE Approved Institution Particulars</span>
            <span className="text-[11px] font-normal text-slate-500">Required Field</span>
          </div>

          <div className="relative">
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Select or Search Institution <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Type college name, AICTE Permanent ID (e.g. 1-10492819), or city..."
                value={instSearch || institutionName}
                onChange={(e) => {
                  setInstSearch(e.target.value);
                  setInstitutionName(e.target.value);
                  setShowInstDropdown(true);
                }}
                onFocus={() => setShowInstDropdown(true)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Auto-suggest dropdown */}
            {showInstDropdown && filteredInstitutions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-56 overflow-y-auto text-xs">
                {filteredInstitutions.map((inst) => (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => handleSelectInstitution(inst)}
                    className="w-full text-left p-2.5 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-slate-900">{inst.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>ID: <strong className="font-mono text-blue-900">{inst.aicteId}</strong></span>
                      <span>·</span>
                      <span>{inst.city}, {inst.state}</span>
                      <span>·</span>
                      <span className="text-blue-800">{inst.region}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Grievance Classification */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-blue-900 uppercase tracking-wider pb-1.5 border-b border-slate-200">
            2. Grievance Classification & Urgency
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Statutory Category <span className="text-rose-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800 bg-white"
              >
                <option value="Ragging & Harassment">Ragging & Physical Harassment</option>
                <option value="Fee & Financial Irregularity">Fee & Financial Irregularity</option>
                <option value="Infrastructure & Facilities">Infrastructure & Laboratory Facilities</option>
                <option value="Faculty & Academic Standards">Faculty Shortage & Academic Standards</option>
                <option value="Examination & Evaluation">Examination, Marks & Evaluation Discrepancy</option>
                <option value="Scholarship & DBT Disbursement">Scholarship & DBT Stipend Non-Disbursement</option>
                <option value="Admission & Certificate Withholding">Unlawful Retention of Original Certificates</option>
                <option value="Discrimination & Grievance Cell">Caste / Gender Discrimination & Grievance Cell Inaction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Priority Severity
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800 bg-white"
              >
                <option value="Critical">Critical Priority (Immediate intervention within 48h)</option>
                <option value="High">High Priority (Urgent hearing within 5 days)</option>
                <option value="Medium">Medium Priority (Standard 15-day resolution SLA)</option>
                <option value="Low">Low Priority (General administrative inquiry)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Grievance Representation */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-blue-900 uppercase tracking-wider pb-1.5 border-b border-slate-200">
            3. Detailed Representation Statement
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Petition Subject / Title <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Unlawful retention of B.Tech Original Marksheets after fee settlement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Comprehensive Statement of Facts <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="State chronological facts, specific dates, persons involved, communications with institution, and specific relief demanded under AICTE regulations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800"
            />
          </div>

          {/* Evidence Upload Simulator */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Attach Supporting Evidence (Receipts, Fee Slips, Official Letters)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-3 text-center bg-slate-50/60 hover:bg-slate-50 transition-colors">
              <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <div className="text-xs text-slate-600">
                <label className="font-semibold text-blue-900 hover:underline cursor-pointer">
                  <span>Browse PDF / Image files</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleSimulateFileUpload}
                  />
                </label>{' '}
                (Max 10 MB per attachment)
              </div>
            </div>

            {evidenceFiles.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {evidenceFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-slate-100 rounded text-xs border border-slate-200"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{file.name}</span>
                      <span className="text-[11px] text-slate-500">({file.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-rose-600 hover:text-rose-800 font-semibold text-xs cursor-pointer ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Complainant Identity */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-blue-900 uppercase tracking-wider pb-1.5 border-b border-slate-200">
            4. Complainant Identity & Whistleblower Shield
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-blue-900 rounded border-slate-300 focus:ring-blue-800"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Submit Anonymously (Whistleblower Mode - Identity Shielded from College)
                </span>
                <span className="text-[11px] text-slate-600 leading-normal block mt-0.5">
                  Check this box if reporting ragging, sexual harassment, or cases where college authorities may retaliate. Your personal identity will be shielded with an encrypted docket token.
                </span>
              </div>
            </label>
          </div>

          {!isAnonymous && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Student Roll / Enrollment No. <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2024/CSE/089"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Department / Branch
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Academic Year
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800"
                >
                  <option value="1st Year (B.Tech / B.E.)">1st Year (UG)</option>
                  <option value="2nd Year (B.Tech / B.E.)">2nd Year (UG)</option>
                  <option value="3rd Year (B.Tech / B.E.)">3rd Year (UG)</option>
                  <option value="4th Year (B.Tech / B.E.)">4th Year (UG)</option>
                  <option value="Post-Graduate (M.Tech / MBA / MCA)">Post-Graduate (PG)</option>
                  <option value="Doctoral Scholar (Ph.D)">Ph.D Scholar</option>
                  <option value="Alumni / Course Withdrawn">Alumni / Withdrawn</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Statutory Undertaking */}
        <div className="pt-2 border-t border-slate-200">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={declarationAgreed}
              onChange={(e) => setDeclarationAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 text-blue-900 rounded border-slate-300 focus:ring-blue-800"
            />
            <span className="text-[11px] text-slate-600 leading-normal">
              I solemnly declare that the facts stated in this grievance petition are true and verifiable to the best of my knowledge. I understand that submitting false or malicious accusations is punishable under institutional disciplinary codes and relevant laws.
            </span>
          </label>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-800" />
            <span>End-to-end encrypted AICTE docket transmission with private security PIN</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-900 text-white rounded font-medium text-xs hover:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-1 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Checking Duplicates & Submitting...</span>
              </>
            ) : (
              <>
                <span>Submit Grievance Petition</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
