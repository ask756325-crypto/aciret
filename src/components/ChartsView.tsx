import React, { useState } from 'react';
import { ComplaintStats } from '../types';
import { BarChart3, PieChart, ShieldCheck, Clock, MapPin } from 'lucide-react';

interface ChartsViewProps {
  stats: ComplaintStats;
}

export const ChartsView: React.FC<ChartsViewProps> = ({ stats }) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Prepare category data
  const categoryEntries = Object.entries(stats?.categoryCounts || {}).sort((a, b) => b[1] - a[1]);
  const maxCategoryCount = Math.max(...categoryEntries.map(([, v]) => v), 1);

  // Prepare status data
  const statusColors: Record<string, string> = {
    Pending: '#d97706', // amber-600
    'Under Review': '#3b82f6', // blue-500
    'In-Progress': '#1d4ed8', // blue-700
    'Action Initiated': '#6366f1', // indigo-500
    Resolved: '#10b981', // emerald-500
    Escalated: '#e11d48', // rose-600
    Rejected: '#64748b', // slate-500
  };

  const statusEntries = Object.entries(stats?.statusCounts || {});
  const totalStatusCount = statusEntries.reduce((acc, [, val]) => acc + val, 0) || 1;

  // Prepare regions data
  const regionEntries = Object.entries(stats?.regionCounts || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Scope and Metric Context Banner */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-blue-950 uppercase tracking-wide mr-2">
            AICTE National Grievance Monitoring Registry · Real-Time Institutional Oversight
          </span>
          <span className="text-slate-600">
            Total active complaints: <strong>{stats.total}</strong> verified statutory dockets
          </span>
        </div>
        <div className="text-[11px] text-blue-900 font-mono bg-white px-2.5 py-1 rounded border border-blue-200">
          Resolution Formula: ({stats.resolved} Resolved / {stats.total} Total Eligible) × 100 = <strong>{stats.resolutionRate}%</strong>
        </div>
      </div>

      {/* Six Key Distinct Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-center">
          <div className="text-slate-500 text-[11px]">Total Docketed</div>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5">{stats.total}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-center">
          <div className="text-amber-700 text-[11px]">Pending Scrutiny</div>
          <div className="text-xl font-extrabold text-amber-800 mt-0.5">{stats.pending}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-center">
          <div className="text-blue-700 text-[11px]">Under Inquiry</div>
          <div className="text-xl font-extrabold text-blue-900 mt-0.5">{stats.underInquiry}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-center">
          <div className="text-emerald-700 text-[11px]">Redressed / Closed</div>
          <div className="text-xl font-extrabold text-emerald-800 mt-0.5">{stats.resolved}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-center">
          <div className="text-purple-700 text-[11px]">Escalated Cases</div>
          <div className="text-xl font-extrabold text-purple-900 mt-0.5">{stats.escalated}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-center">
          <div className="text-rose-700 text-[11px]">Critical Priority</div>
          <div className="text-xl font-extrabold text-rose-900 mt-0.5">{stats.criticalPriority}</div>
        </div>
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold mb-1">
            <Clock className="w-4 h-4 text-blue-700" />
            <span>Average Resolution Turnaround</span>
          </div>
          <div className="text-3xl font-extrabold text-blue-950">
            {stats.averageResolutionDays} <span className="text-sm font-medium text-slate-500">Days</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Statutory AICTE limit is 15 working days. Redressed within statutory SLA compliance margins.
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Resolution Rate</span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-700">
            {stats.resolutionRate}%
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {stats.total === 0 ? 'No eligible complaints in active dataset.' : `${stats.resolved} out of ${stats.total} eligible complaints resolved.`}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold mb-1">
            <MapPin className="w-4 h-4 text-indigo-700" />
            <span>Active Regional Distribution</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {regionEntries.length} <span className="text-sm font-medium text-slate-500">Bureaus</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            AICTE regional jurisdictions actively logging grievance petitions.
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Grievances by Category */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-800" />
                Grievance Volume by Category
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution across statutory AICTE complaint classifications
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
              {categoryEntries.length} Categories
            </span>
          </div>

          {categoryEntries.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 italic">
              No complaint categories recorded in this dataset scope.
            </div>
          ) : (
            <div className="space-y-3.5">
              {categoryEntries.map(([category, count]) => {
                const percentage = Math.round((count / (stats.total || 1)) * 100);
                const barWidth = Math.max(8, Math.round((count / maxCategoryCount) * 100));

                return (
                  <div
                    key={category}
                    onMouseEnter={() => setHoveredCategory(category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className="group"
                  >
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-medium text-slate-800 group-hover:text-blue-900 transition-colors">
                        {category}
                      </span>
                      <span className="font-semibold text-slate-600">
                        {count} <span className="text-slate-400 font-normal">({percentage}%)</span>
                      </span>
                    </div>

                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          category.includes('Ragging')
                            ? 'bg-rose-600'
                            : category.includes('Fee')
                            ? 'bg-amber-500'
                            : category.includes('Faculty')
                            ? 'bg-blue-600'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 2: Status Distribution */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-800" />
                Current Processing Status Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Active workflow pipeline stages (each grievance mapped to one status)
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
              {stats.total} Total
            </span>
          </div>

          {statusEntries.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 italic">
              No status records in this dataset.
            </div>
          ) : (
            <>
              {/* Visual Stacked Progress Bar */}
              <div className="mb-6">
                <div className="h-4 w-full bg-slate-100 rounded-md overflow-hidden flex shadow-inner">
                  {statusEntries.map(([status, count]) => {
                    const widthPct = (count / totalStatusCount) * 100;
                    return (
                      <div
                        key={status}
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: statusColors[status] || '#64748b',
                        }}
                        title={`${status}: ${count} (${Math.round(widthPct)}%)`}
                        className="h-full border-r border-white/20 transition-all hover:opacity-85"
                      />
                    );
                  })}
                </div>
              </div>

              {/* Status Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {statusEntries.map(([status, count]) => {
                  const color = statusColors[status] || '#64748b';
                  const pct = Math.round((count / totalStatusCount) * 100);

                  return (
                    <div
                      key={status}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-sm shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-medium text-slate-800">{status}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">{count}</span>
                        <span className="text-[10px] text-slate-500 ml-1">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Region Distribution snippet */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Regional Jurisdiction Distribution:
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {regionEntries.map(([region, count]) => (
                <span
                  key={region}
                  className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-[11px] font-medium"
                >
                  {region}: <strong className="text-slate-900">{count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
