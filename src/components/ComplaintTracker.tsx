import React, { useState, useEffect } from 'react';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  Hourglass, 
  AlertCircle, 
  Building2, 
  User, 
  ShieldAlert, 
  Printer, 
  PhoneCall, 
  Mail, 
  ExternalLink,
  ChevronRight,
  FileCheck,
  Lock
} from 'lucide-react';
import { Complaint } from '../types';

interface ComplaintTrackerProps {
  onSearch: (id: string, pin?: string) => Promise<Complaint | null>;
  initialId?: string;
  onOpenDetails: (complaint: Complaint) => void;
}

export const ComplaintTracker: React.FC<ComplaintTrackerProps> = ({
  onSearch,
  initialId,
  onOpenDetails,
}) => {
  const [complaintId, setComplaintId] = useState(initialId || '');
  const [accessPin, setAccessPin] = useState('');
  const [searchedRecord, setSearchedRecord] = useState<Complaint | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Quick sample IDs for demo testing
  const sampleTestIds = [
    { id: 'AICTE-GRV-2026-1042', label: 'DTU Ragging Case', status: 'In-Progress', priority: 'Critical' },
    { id: 'AICTE-GRV-2026-2189', label: 'COEP Fee Refund', status: 'Resolved', priority: 'High' },
    { id: 'AICTE-GRV-2026-3918', label: 'HBTU Certificate', status: 'Action Initiated', priority: 'High' },
    { id: 'AICTE-GRV-2026-5211', label: 'NITK Faculty Shortage', status: 'Escalated', priority: 'Critical' },
  ];

  const handleTrackSubmit = async (e?: React.FormEvent, customId?: string) => {
    if (e) e.preventDefault();
    const query = customId || complaintId;
    if (!query.trim()) {
      setErrorNotice('Please enter a valid AICTE Complaint Docket ID (e.g. AICTE-GRV-2026-1042).');
      return;
    }

    try {
      setIsSearching(true);
      setErrorNotice(null);
      setHasSearched(true);
      const result = await onSearch(query.trim(), accessPin.trim() || undefined);
      if (result) {
        setSearchedRecord(result);
        setComplaintId(result.id);
      } else {
        setSearchedRecord(null);
        setErrorNotice(`No grievance found with Docket ID '${query}'. Please check the reference number on your acknowledgment slip.`);
      }
    } catch (err: any) {
      setErrorNotice('Error retrieving grievance record. Please verify server connection.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      handleTrackSubmit(undefined, initialId);
    }
  }, [initialId]);

  // Determine timeline steps state
  const getTimelineSteps = (complaint: Complaint) => {
    const isResolved = complaint.status === 'Resolved';
    const isInquiry = ['In-Progress', 'Action Initiated', 'Under Review', 'Resolved', 'Escalated'].includes(complaint.status);
    const isHearing = ['Action Initiated', 'Resolved', 'Escalated'].includes(complaint.status);

    return [
      {
        title: 'Grievance Registered',
        desc: 'Docketed in Central Portal with 15-day SLA guarantee',
        completed: true,
        current: false,
      },
      {
        title: 'Initial Scrutiny & Triage',
        desc: 'Jurisdiction verified & assigned to Regional Desk Officer',
        completed: isInquiry,
        current: complaint.status === 'Pending',
      },
      {
        title: 'Institutional Notice Issued',
        desc: 'Explanation sought from Principal / Registrar',
        completed: isInquiry && complaint.status !== 'Under Review',
        current: complaint.status === 'Under Review' || complaint.status === 'In-Progress',
      },
      {
        title: 'Fact Finding & Examination',
        desc: 'Evidence cross-verified with State Regulating Authority',
        completed: isHearing,
        current: complaint.status === 'Action Initiated',
      },
      {
        title: isResolved ? 'Redressal Order Issued' : complaint.status === 'Escalated' ? 'Escalated to Apex Panel' : 'Final Redressal Order',
        desc: isResolved ? 'Compliance directive executed and documented' : 'Official order dispatch',
        completed: isResolved,
        current: isResolved || complaint.status === 'Escalated',
        isEscalated: complaint.status === 'Escalated',
      },
    ];
  };

  return (
    <div className="max-w-4xl mx-auto my-4 sm:my-6 space-y-6">
      {/* Search Bar Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 text-blue-900 text-xs font-bold uppercase tracking-wider mb-1">
          <Search className="w-4 h-4" />
          <span>Student Public Tracking Portal</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Track Your Grievance Petition
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 mb-4">
          Enter your unique AICTE Complaint Docket ID to view live progress, officer hearing remarks, and download official orders.
        </p>

        <form onSubmit={(e) => handleTrackSubmit(e)} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Enter Complaint ID (e.g. AICTE-GRV-2026-1042)..."
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800 focus:border-blue-800"
            />
          </div>

          <div className="relative w-full sm:w-44">
            <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="password"
              maxLength={4}
              placeholder="Access PIN (Opt)"
              value={accessPin}
              onChange={(e) => setAccessPin(e.target.value.replace(/\D/g, ''))}
              title="4-digit confidential Security Access PIN from acknowledgment receipt"
              className="w-full pl-8 pr-3 py-2.5 text-xs sm:text-sm font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800 focus:border-blue-800"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-2.5 bg-blue-900 text-white rounded font-medium text-xs hover:bg-blue-950 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
          >
            {isSearching ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Locating Docket...</span>
              </>
            ) : (
              <>
                <span>Track Status</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Sample Selector for Evaluators */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
            <span>Test sample records (Click to evaluate instant live tracking):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sampleTestIds.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTrackSubmit(undefined, item.id)}
                className="text-left text-xs bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 px-2.5 py-1.5 rounded transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="font-mono text-blue-950 font-semibold">{item.id}</span>
                <span className="text-[11px] text-slate-500">· {item.label}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.status === 'Resolved' ? 'bg-emerald-500' : item.status === 'Escalated' ? 'bg-rose-500' : 'bg-blue-500'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {errorNotice && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{errorNotice}</div>
          </div>
        )}
      </div>

      {/* Searched Record Display */}
      {searchedRecord && (
        <div className="space-y-6">
          {/* Main Status Header Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-wider font-mono font-bold bg-blue-100 text-blue-950 px-2.5 py-0.5 rounded">
                    {searchedRecord.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    {searchedRecord.category}
                  </span>
                  {searchedRecord.isDemo ? (
                    <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      Demo Sample
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Official Docket
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {searchedRecord.title}
                </h3>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                  <span>{searchedRecord.institutionName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[11px]">ID: {searchedRecord.institutionId}</span>
                </div>

                {/* Privacy Badge */}
                {searchedRecord.studentName === 'Confidential Complainant (PIN Protected)' ? (
                  <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded inline-flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Complainant identity protected. Provide your 4-digit Security Access PIN above to view identity.</span>
                  </div>
                ) : searchedRecord.studentName && searchedRecord.studentName !== 'Anonymous Student' ? (
                  <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Identity Verified: <strong>{searchedRecord.studentName}</strong> ({searchedRecord.studentEmail})</span>
                  </div>
                ) : null}
              </div>

              {/* Status Pill & Action */}
              <div className="flex flex-col sm:items-end gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      searchedRecord.status === 'Resolved'
                        ? 'bg-emerald-500'
                        : searchedRecord.status === 'Escalated'
                        ? 'bg-rose-600 animate-pulse'
                        : 'bg-blue-600'
                    }`}
                  />
                  <span>Status: {searchedRecord.status}</span>
                </div>

                <button
                  onClick={() => onOpenDetails(searchedRecord)}
                  className="text-xs font-medium text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Official Dossier</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stepper Progress */}
            <div className="mt-6 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
                Statutory Redressal Progression
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {getTimelineSteps(searchedRecord).map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs transition-all ${
                      step.completed
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        : step.current
                        ? 'bg-blue-50 border-blue-400 text-blue-950 ring-2 ring-blue-800 ring-offset-1'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px] shrink-0 font-mono">
                          {idx + 1}
                        </span>
                      )}
                      <span className="line-clamp-1">{step.title}</span>
                    </div>
                    <p className="text-[11px] leading-tight text-slate-600 mt-1 line-clamp-2">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution Highlight Box if Resolved */}
            {searchedRecord.status === 'Resolved' && searchedRecord.resolutionDetails && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Redressal Directives Formally Executed</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Ref: {searchedRecord.resolutionDetails.dispatchRefNumber}
                  </span>
                </div>
                <p className="text-emerald-950 leading-relaxed">
                  <strong>Outcome:</strong> {searchedRecord.resolutionDetails.resolutionSummary}
                </p>
                <div className="text-emerald-800 text-[11px] pt-1 border-t border-emerald-200 flex justify-between">
                  <span>Authorized by: <strong>{searchedRecord.resolutionDetails.signedBy}</strong></span>
                  <span>Date: {new Date(searchedRecord.resolutionDetails.resolvedAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Assigned Officer & Direct Contacts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs">
              <div className="font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 mb-2">
                Assigned Investigating Officer
              </div>
              <div className="space-y-1.5">
                <div className="font-semibold text-slate-900 text-sm">
                  {searchedRecord.assignedOfficer?.name || 'AICTE Regional Nodal Desk'}
                </div>
                <div className="text-slate-600">
                  {searchedRecord.assignedOfficer?.designation || 'Designated Ombudsperson'}
                </div>
                <div className="text-slate-500 text-[11px]">
                  {searchedRecord.assignedOfficer?.office || 'AICTE Liaison Office'}
                </div>
                <div className="pt-2 flex flex-col gap-1 text-[11px] font-mono text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-800" /> {searchedRecord.assignedOfficer?.email || 'grievance-cell@aicte-india.org'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-blue-800" /> {searchedRecord.assignedOfficer?.phone || '+91 11 2958 1000'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs">
              <div className="font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 mb-2">
                Statutory Timelines & Rights
              </div>
              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between pb-1 border-b border-slate-100">
                  <span>Lodged On:</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(searchedRecord.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between pb-1 border-b border-slate-100">
                  <span>Mandated Redressal Deadline:</span>
                  <span className="font-semibold text-rose-700">
                    {new Date(searchedRecord.slaDeadline).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })} (15 Days)
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 pt-1 leading-snug">
                  If the institution fails to provide satisfactory redressal within the stipulated 15-day period, the matter is auto-referred to the AICTE Standing Grievance Committee.
                </div>
              </div>
            </div>
          </div>

          {/* Action Log History */}
          <div className="bg-white p-5 rounded-lg border border-slate-200">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Official Hearing & Communication Log
            </h4>
            <div className="space-y-3">
              {(!searchedRecord.statusHistory || searchedRecord.statusHistory.length === 0) ? (
                <p className="text-xs text-slate-400 italic">No communication entries recorded yet.</p>
              ) : (
                (searchedRecord.statusHistory || []).map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-blue-900">{item.action}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(item.timestamp).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mb-1">
                      By: <strong>{item.actor}</strong> ({item.actorRole})
                    </div>
                    <p className="text-slate-700 bg-white p-2 rounded border border-slate-100">
                      {item.remarks}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
