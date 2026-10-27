import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Building2, 
  User, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Send, 
  Printer, 
  Share2, 
  Lock, 
  Calendar,
  Download,
  Phone,
  Mail,
  ChevronDown
} from 'lucide-react';
import { Complaint, ComplaintPriority, ComplaintStatus, UserSession } from '../types';

interface ComplaintDetailsModalProps {
  complaint: Complaint;
  onClose: () => void;
  onUpdateStatus: (
    id: string,
    params: {
      status: string;
      remarks: string;
      actor: string;
      actorRole: string;
      resolutionSummary?: string;
      actionTakenAgainstInstitute?: string;
    }
  ) => Promise<void>;
  onAddOfficerNote: (
    id: string,
    params: { author: string; authorRole: string; note: string; isConfidential: boolean }
  ) => Promise<void>;
  currentUser?: UserSession;
}

export const ComplaintDetailsModal: React.FC<ComplaintDetailsModalProps> = ({
  complaint,
  onClose,
  onUpdateStatus,
  onAddOfficerNote,
  currentUser,
}) => {
  const isOfficerOrAdmin = currentUser?.role === 'officer' || currentUser?.role === 'admin';
  // Status transition state
  const [newStatus, setNewStatus] = useState<ComplaintStatus>(complaint.status);
  const [officerRemarks, setOfficerRemarks] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [actionAgainstInstitute, setActionAgainstInstitute] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Officer notes state
  const [newNote, setNewNote] = useState('');
  const [isConfidentialNote, setIsConfidentialNote] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Active view tab in modal
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'notes' | 'resolution'>('overview');

  // Synchronize status state whenever selected complaint updates
  React.useEffect(() => {
    setNewStatus(complaint.status);
    setOfficerRemarks('');
    setResolutionSummary(complaint.resolutionDetails?.resolutionSummary || '');
    setActionAgainstInstitute(complaint.resolutionDetails?.actionTakenAgainstInstitute || '');
    setStatusFeedback(null);
  }, [complaint.id, complaint.status]);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerRemarks.trim()) {
      setStatusFeedback('Officer remarks are required to create an official audit trail.');
      return;
    }
    if (newStatus === 'Resolved' && !resolutionSummary.trim()) {
      setStatusFeedback('Summary of Relief Provided to Student is required for case resolution.');
      return;
    }

    try {
      setIsUpdatingStatus(true);
      await onUpdateStatus(complaint.id, {
        status: newStatus,
        remarks: officerRemarks,
        actor: 'Dr. Vivek S. Rathore',
        actorRole: 'AICTE Nodal In-Charge',
        resolutionSummary: newStatus === 'Resolved' ? resolutionSummary : undefined,
        actionTakenAgainstInstitute: newStatus === 'Resolved' ? actionAgainstInstitute : undefined,
      });
      setStatusFeedback('Status updated successfully and recorded in docket history.');
      setOfficerRemarks('');
    } catch (err: any) {
      setStatusFeedback('Failed to update status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setIsAddingNote(true);
      await onAddOfficerNote(complaint.id, {
        author: 'Desk Officer (Grievance Cell)',
        authorRole: 'Regional Compliance Inspector',
        note: newNote,
        isConfidential: isConfidentialNote,
      });
      setNewNote('');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-300">
        {/* Modal Header */}
        <div className="bg-[#0b1e36] text-white px-5 py-4 flex items-center justify-between border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-semibold bg-blue-900 text-blue-200 px-2 py-0.5 rounded border border-blue-700">
              {complaint.id}
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  complaint.priority === 'Critical'
                    ? 'bg-rose-500 animate-pulse'
                    : complaint.priority === 'High'
                    ? 'bg-amber-400'
                    : 'bg-blue-400'
                }`}
              />
              <span className="font-semibold text-slate-200">{complaint.priority} Priority</span>
              <span className="text-slate-400">·</span>
              <span className="text-blue-200">{complaint.status}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
              title="Print official case docket"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 flex items-center gap-2 text-xs font-medium text-slate-600 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Case Dossier
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span>Status History</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">
              {complaint.statusHistory?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span>Officer Action Notes</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">
              {complaint.officerNotes?.length || 0}
            </span>
          </button>
          {complaint.resolutionDetails && (
            <button
              onClick={() => setActiveTab('resolution')}
              className={`py-2.5 px-3 border-b-2 font-semibold text-emerald-800 transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'resolution'
                  ? 'border-emerald-700 text-emerald-900'
                  : 'border-transparent hover:text-emerald-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolution Order</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Banner Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                  Subject / Allegation
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {complaint.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600">
                  <span className="font-medium text-blue-900">{complaint.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>Lodged: {new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-rose-700 font-medium">
                    SLA Deadline: {new Date(complaint.slaDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>

              {/* Institution and Student Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Institution Profile */}
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 mb-3">
                    <Building2 className="w-4 h-4 text-blue-900" />
                    <span>Institution Particulars</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Name:</span>
                      <span className="font-semibold text-slate-900">{complaint.institutionName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 block">AICTE Permanent ID:</span>
                        <span className="font-mono text-slate-800">{complaint.institutionId}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Jurisdiction:</span>
                        <span className="text-slate-800">{complaint.region}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complainant Profile */}
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 mb-3">
                    <User className="w-4 h-4 text-blue-900" />
                    <span>Complainant Particulars</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {complaint.isAnonymous ? (
                      <div className="bg-amber-50 text-amber-900 p-2.5 rounded border border-amber-200 text-xs">
                        <div className="font-bold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Confidential Whistleblower Identity</span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-1">
                          Complainant identity protected under Supreme Court guidelines. Direct communication routed through AICTE encrypted token.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-500 block">Complainant:</span>
                            <span className="font-semibold text-slate-900">{complaint.studentName}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Roll / Reg No:</span>
                            <span className="font-mono text-slate-800">{complaint.rollNumber}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-500 block">Department:</span>
                            <span className="text-slate-800">{complaint.department}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Academic Year:</span>
                            <span className="text-slate-800">{complaint.academicYear}</span>
                          </div>
                        </div>
                        {complaint.studentEmail && (
                          <div>
                            <span className="text-slate-500 block">Contact Email:</span>
                            <span className="text-slate-800 font-mono text-[11px]">{complaint.studentEmail}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Description */}
              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 mb-3">
                  Grievance Representation Statement
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {complaint.description}
                </p>
              </div>

              {/* Evidence Documents */}
              <div className="p-4 bg-white rounded-lg border border-slate-200">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 mb-3 flex items-center justify-between">
                  <span>Attached Evidence Files ({complaint.evidenceFiles?.length || 0})</span>
                  <span className="text-[11px] font-normal text-slate-500">Official Annexures</span>
                </div>
                {!complaint.evidenceFiles || complaint.evidenceFiles.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No external attachments submitted with this petition.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(complaint.evidenceFiles || []).map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-blue-800 shrink-0" />
                          <span className="font-medium text-slate-800 truncate">{file.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 shrink-0 ml-2">{file.size}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assigned Officer Contact Box */}
              <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200 text-xs">
                <div className="font-bold text-blue-950 mb-1 flex items-center gap-2">
                  <span>Assigned AICTE Nodal Authority</span>
                </div>
                <div className="text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div>
                    <span className="font-semibold block">{complaint.assignedOfficer?.name || 'AICTE Regional Nodal Desk'}</span>
                    <span className="text-slate-600">{complaint.assignedOfficer?.designation || 'Designated Ombudsperson'}</span>
                    <span className="text-slate-500 block text-[11px]">{complaint.assignedOfficer?.office || 'AICTE Liaison Office'}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-blue-800" />
                      <span className="font-mono text-[11px]">{complaint.assignedOfficer?.email || 'grievance-cell@aicte-india.org'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-blue-800" />
                      <span>{complaint.assignedOfficer?.phone || '+91 11 2958 1000'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Transition & Officer Action Form (Restricted to Officers and Admins) */}
              {isOfficerOrAdmin ? (
                <div className="p-5 bg-white rounded-lg border-2 border-blue-900/30">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-blue-900" />
                      <span>Statutory Status Transition & Action Order</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">Officer Authority Portal</span>
                  </div>

                  {statusFeedback && (
                    <div className="p-2.5 mb-3 rounded bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium">
                      {statusFeedback}
                    </div>
                  )}

                  <form onSubmit={handleStatusSubmit} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Transition Next Status
                        </label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800"
                        >
                          <option value="Pending">Pending (Initial Intake)</option>
                          <option value="Under Review">Under Review (Desk Triage)</option>
                          <option value="In-Progress">In-Progress (Notice to College)</option>
                          <option value="Action Initiated">Action Initiated (Hearings/Committee)</option>
                          <option value="Resolved">Resolved (Redressal Order Dispatched)</option>
                          <option value="Escalated">Escalated (Referred to Standing Panel)</option>
                          <option value="Rejected">Rejected (Non-AICTE Jurisdiction)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Reviewing Officer Name
                        </label>
                        <input
                          type="text"
                          disabled
                          value={currentUser?.name || "Dr. Vivek S. Rathore (In-Charge)"}
                          className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 rounded text-slate-700"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Official Remarks & Directives (Logged to Public Audit Trail) <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Specify procedural step taken (e.g. Explanation sought from Registrar, inquiry committee convened, documents verified)..."
                        value={officerRemarks}
                        onChange={(e) => setOfficerRemarks(e.target.value)}
                        className="w-full p-2.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800"
                      />
                    </div>

                    {newStatus === 'Resolved' && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded space-y-2 text-xs">
                        <div className="font-bold text-emerald-900">
                          Resolution Order Directives (Mandatory for Closure):
                        </div>
                        <div>
                          <label className="block text-slate-700 mb-1 font-medium">Summary of Relief Provided to Student:</label>
                          <input
                            type="text"
                            placeholder="e.g. Full refund of ₹28,500 unapproved fee credited to student account."
                            value={resolutionSummary}
                            onChange={(e) => setResolutionSummary(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 mb-1 font-medium">Regulatory Action Taken Against Institution:</label>
                          <input
                            type="text"
                            placeholder="e.g. Formal warning letter placed on institute permanent record file."
                            value={actionAgainstInstitute}
                            onChange={(e) => setActionAgainstInstitute(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isUpdatingStatus}
                        className="px-4 py-2 bg-blue-900 text-white rounded font-medium text-xs hover:bg-blue-950 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isUpdatingStatus ? 'Recording Official Transition...' : 'Apply Status Transition'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block mb-0.5">
                      Official Status Triage & Orders: Controlled by Designated AICTE Authority
                    </span>
                    <span>
                      As a student complainant, your grievance is actively being investigated under the statutory 15-day SLA. You can monitor live chronological progress in the <strong className="text-blue-900">Status History</strong> tab.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                Official chronological audit trail for docket <strong>{complaint.id}</strong>. Every entry is immutably timestamped.
              </div>

              <div className="relative border-l-2 border-blue-900 ml-4 pl-6 space-y-6">
                {(!complaint.statusHistory || complaint.statusHistory.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-2">No history entries logged yet.</p>
                ) : (
                  (complaint.statusHistory || []).map((hist, idx) => (
                    <div key={hist.id || idx} className="relative group">
                      {/* Circle marker */}
                      <div className="absolute -left-[31px] top-0 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-900 group-hover:bg-blue-900 transition-colors" />

                      <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-slate-900">{hist.action}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {new Date(hist.timestamp).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 mt-0.5">
                          By: <strong className="text-slate-800">{hist.actor}</strong> ({hist.actorRole})
                        </div>

                        <p className="text-xs text-slate-700 mt-2 bg-white p-2.5 rounded border border-slate-200">
                          {hist.remarks}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                Internal investigation notes recorded by AICTE nodal investigators and desk officials.
              </div>

              {/* Add Note Form (Restricted to Officers and Admins) */}
              {isOfficerOrAdmin ? (
                <form onSubmit={handleAddNoteSubmit} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div className="font-bold text-xs text-slate-800">Record Internal Officer Note</div>
                  <textarea
                    rows={2}
                    placeholder="Record internal findings, witness remarks, telephonic follow-ups with college leadership..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isConfidentialNote}
                        onChange={(e) => setIsConfidentialNote(e.target.checked)}
                        className="h-3.5 w-3.5 text-blue-900 rounded"
                      />
                      <span>Mark as Confidential (Internal Only)</span>
                    </label>
                    <button
                      type="submit"
                      disabled={isAddingNote || !newNote.trim()}
                      className="px-3 py-1.5 bg-blue-900 text-white rounded text-xs font-medium hover:bg-blue-950 transition-colors disabled:opacity-50"
                    >
                      {isAddingNote ? 'Saving...' : 'Add Note to Docket'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Internal investigation notes are restricted to AICTE investigating authorities.</span>
                </div>
              )}

              {/* Previous Notes */}
              <div className="space-y-2.5">
                {(!complaint.officerNotes || complaint.officerNotes.length === 0) ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    No internal officer notes logged yet for this case docket.
                  </p>
                ) : (
                  (complaint.officerNotes || []).map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-lg border text-xs ${
                        n.isConfidential
                          ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 font-semibold">
                          {n.isConfidential && (
                            <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                              Confidential
                            </span>
                          )}
                          <span>{n.author}</span>
                          <span className="text-slate-400 font-normal">({n.authorRole})</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(n.timestamp).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <p className="leading-relaxed mt-1">{n.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'resolution' && complaint.resolutionDetails && (
            <div className="p-5 bg-white border border-emerald-300 rounded-lg space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Statutory AICTE Redressal Order Issued</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-emerald-50/50 p-3 rounded border border-emerald-200">
                <div>
                  <span className="text-slate-500 block">Dispatch Ref Number:</span>
                  <span className="font-mono font-bold text-slate-900">{complaint.resolutionDetails.dispatchRefNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Order Date:</span>
                  <span className="font-medium text-slate-800">
                    {new Date(complaint.resolutionDetails.resolvedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="text-xs space-y-2">
                <div>
                  <span className="font-semibold text-slate-900 block">Relief Awarded / Order Summary:</span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 mt-1">
                    {complaint.resolutionDetails.resolutionSummary}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-900 block">Institutional Compliance Advisory:</span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 mt-1">
                    {complaint.resolutionDetails.actionTakenAgainstInstitute}
                  </p>
                </div>

                <div className="pt-2 text-right text-xs">
                  <span className="text-slate-500 block">Authorized Signatory:</span>
                  <span className="font-bold text-slate-900">{complaint.resolutionDetails.signedBy}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            AICTE National Grievance Redressal Portal · Docket #{complaint.id}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium rounded hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
