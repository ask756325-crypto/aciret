import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Building,
  RotateCcw,
  Sparkles,
  Database
} from 'lucide-react';
import { Complaint, ComplaintPriority, ComplaintStatus, UserSession } from '../types';

interface ComplaintTableProps {
  complaints: Complaint[];
  isLoading: boolean;
  onSelectComplaint: (complaint: Complaint) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sourceFilter: 'all' | 'real' | 'demo';
  setSourceFilter: (source: 'all' | 'real' | 'demo') => void;
  onResetFilters: () => void;
  currentUser?: UserSession;
  myComplaintsOnly?: boolean;
  setMyComplaintsOnly?: (val: boolean) => void;
}

export const ComplaintTable: React.FC<ComplaintTableProps> = ({
  complaints,
  isLoading,
  onSelectComplaint,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  priorityFilter,
  setPriorityFilter,
  searchQuery,
  setSearchQuery,
  sourceFilter,
  setSourceFilter,
  onResetFilters,
  currentUser,
  myComplaintsOnly,
  setMyComplaintsOnly,
}) => {
  const [sortField, setSortField] = useState<'createdAt' | 'priority' | 'status'>('createdAt');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  // Sorting
  const sortedComplaints = [...safeComplaints].sort((a, b) => {
    if (sortField === 'createdAt') {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortAsc ? -diff : diff;
    }
    if (sortField === 'priority') {
      const weight: Record<ComplaintPriority, number> = {
        Critical: 4,
        High: 3,
        Medium: 2,
        Low: 1,
      };
      const diff = (weight[b.priority] || 0) - (weight[a.priority] || 0);
      return sortAsc ? -diff : diff;
    }
    if (sortField === 'status') {
      return sortAsc
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    return 0;
  });

  const toggleSort = (field: 'createdAt' | 'priority' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Official CSV Export
  const handleExportCSV = () => {
    const exportItems = safeComplaints;

    if (!exportItems.length) return;
    const headers = [
      'Complaint ID',
      'Record Type',
      'Date Lodged',
      'Institution Name',
      'AICTE ID',
      'Region',
      'Category',
      'Priority',
      'Status',
      'Complainant',
      'Subject',
    ];
    const rows = exportItems.map((c) => [
      `"${c.id}"`,
      `"Official AICTE Filing"`,
      `"${new Date(c.createdAt).toLocaleDateString('en-IN')}"`,
      `"${c.institutionName.replace(/"/g, '""')}"`,
      `"${c.institutionId}"`,
      `"${c.region}"`,
      `"${c.category}"`,
      `"${c.priority}"`,
      `"${c.status}"`,
      `"${c.isAnonymous ? 'Confidential' : c.studentName}"`,
      `"${c.title.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AICTE_Official_Grievance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = [
    'All',
    'Ragging & Harassment',
    'Fee & Financial Irregularity',
    'Infrastructure & Facilities',
    'Faculty & Academic Standards',
    'Examination & Evaluation',
    'Scholarship & DBT Disbursement',
    'Admission & Certificate Withholding',
    'Discrimination & Grievance Cell',
  ];

  const statuses = [
    'All',
    'Pending',
    'Under Review',
    'In-Progress',
    'Action Initiated',
    'Resolved',
    'Escalated',
  ];

  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      {/* Search and Filters Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Institutional Grievance Management Register
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {complaints.length} official grievances across AICTE accredited institutions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={complaints.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-40"
              title="Download CSV report of official grievance records"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {(statusFilter !== 'All' || categoryFilter !== 'All' || priorityFilter !== 'All' || searchQuery) && (
              <button
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded bg-white transition-colors cursor-pointer"
                title="Clear all active filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ID, college, roll no, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800 focus:border-blue-800"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800 focus:border-blue-800 text-slate-700"
            >
              <option value="All">All Categories ({categories.length - 1})</option>
              {categories.slice(1).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800 focus:border-blue-800 text-slate-700"
            >
              <option value="All">All Statuses</option>
              {statuses.slice(1).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Dropdown */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-800 focus:border-blue-800 text-slate-700"
            >
              <option value="All">All Priorities</option>
              {priorities.slice(1).map((p) => (
                <option key={p} value={p}>
                  {p} Priority
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
              <th className="py-3 px-4">Grievance ID & Type</th>
              <th className="py-3 px-4">Institution & Region</th>
              <th className="py-3 px-4">Grievance Subject & Category</th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => toggleSort('priority')}>
                <div className="flex items-center gap-1">
                  <span>Priority</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => toggleSort('createdAt')}>
                <div className="flex items-center gap-1">
                  <span>Lodged Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => toggleSort('status')}>
                <div className="flex items-center gap-1">
                  <span>Current Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>Synchronizing with complaint monitoring server...</span>
                  </div>
                </td>
              </tr>
            ) : sortedComplaints.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="max-w-md mx-auto">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-800">No matching grievances found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      No complaints match the specified search query or filter criteria. Try adjusting the filter parameters.
                    </p>
                    <button
                      onClick={onResetFilters}
                      className="mt-3 px-3 py-1.5 text-xs text-blue-900 font-medium hover:underline cursor-pointer"
                    >
                      Clear active filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              sortedComplaints.map((c) => {
                // Priority color indicator text
                let priorityTextClass = 'text-slate-700 font-semibold';
                if (c.priority === 'Critical') priorityTextClass = 'text-rose-700 font-bold';
                else if (c.priority === 'High') priorityTextClass = 'text-amber-700 font-semibold';
                else if (c.priority === 'Medium') priorityTextClass = 'text-blue-700 font-medium';

                // Status formatting
                let statusColor = 'text-slate-700';
                if (c.status === 'Resolved') statusColor = 'text-emerald-700 font-semibold';
                else if (c.status === 'Pending') statusColor = 'text-amber-700 font-semibold';
                else if (c.status === 'Escalated') statusColor = 'text-rose-700 font-bold';
                else if (c.status === 'In-Progress' || c.status === 'Action Initiated') statusColor = 'text-blue-700 font-medium';

                const formattedDate = new Date(c.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelectComplaint(c)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    {/* Complaint ID & Type Badge */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-medium text-blue-900 group-hover:underline">
                        {c.id}
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Official AICTE Filing
                        </span>
                      </div>
                    </td>

                    {/* Institution */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 line-clamp-1 max-w-[200px]" title={c.institutionName}>
                        {c.institutionName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{c.region}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{c.institutionId}</span>
                      </div>
                    </td>

                    {/* Subject & Category */}
                    <td className="py-3 px-4 max-w-[280px]">
                      <div className="font-medium text-slate-900 line-clamp-1" title={c.title}>
                        {c.title}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="text-slate-600 font-medium">{c.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{c.isAnonymous ? 'Confidential' : c.studentName}</span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4">
                      <div className={`flex items-center gap-1.5 ${priorityTextClass}`}>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            c.priority === 'Critical'
                              ? 'bg-rose-600 animate-pulse'
                              : c.priority === 'High'
                              ? 'bg-amber-500'
                              : c.priority === 'Medium'
                              ? 'bg-blue-600'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span>{c.priority}</span>
                      </div>
                    </td>

                    {/* Date Lodged */}
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {formattedDate}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center gap-1.5 ${statusColor}`}>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            c.status === 'Resolved'
                              ? 'bg-emerald-600'
                              : c.status === 'Pending'
                              ? 'bg-amber-500'
                              : c.status === 'Escalated'
                              ? 'bg-rose-600'
                              : 'bg-blue-600'
                          }`}
                        />
                        <span>{c.status}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectComplaint(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors cursor-pointer"
                        title="Open complete case file"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer bar */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div>
          Showing {sortedComplaints.length} verified statutory complaints · AICTE Central Grievance Monitoring Register
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span> 100% Official AICTE Filings
          </span>
        </div>
      </div>
    </div>
  );
};
