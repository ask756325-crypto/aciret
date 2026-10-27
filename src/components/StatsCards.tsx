import React from 'react';
import { 
  FileText, 
  Clock, 
  Hourglass, 
  CheckCircle2, 
  AlertOctagon, 
  Flame,
  ShieldAlert,
  Database,
  Filter
} from 'lucide-react';
import { ComplaintStats } from '../types';

interface StatsCardsProps {
  stats: ComplaintStats;
  onFilterClick?: (status: string) => void;
  activeFilter?: string;
  scope: 'official' | 'demo' | 'all';
  onScopeChange: (scope: 'official' | 'demo' | 'all') => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  onFilterClick,
  activeFilter,
  scope,
  onScopeChange,
}) => {
  const cards = [
    {
      id: 'total',
      filterValue: 'All',
      label: 'Total Grievances',
      value: stats.total,
      subtitle: 'Official institutional filings',
      icon: FileText,
      accentColor: 'border-l-blue-900',
      textColor: 'text-slate-900',
      bgHover: 'hover:bg-slate-50',
    },
    {
      id: 'pending',
      filterValue: 'Pending',
      label: 'Pending Scrutiny',
      value: stats.pending,
      subtitle: 'Awaiting desk triage',
      icon: Clock,
      accentColor: 'border-l-amber-500',
      textColor: 'text-amber-800',
      bgHover: 'hover:bg-amber-50/40',
    },
    {
      id: 'underInquiry',
      filterValue: 'Under Inquiry',
      label: 'Under Inquiry',
      value: stats.underInquiry,
      subtitle: 'In-Progress / Action initiated',
      icon: Hourglass,
      accentColor: 'border-l-blue-600',
      textColor: 'text-blue-800',
      bgHover: 'hover:bg-blue-50/40',
    },
    {
      id: 'resolved',
      filterValue: 'Resolved',
      label: 'Redressed / Resolved',
      value: stats.resolved,
      subtitle: `${stats.resolutionRate}% resolution rate`,
      icon: CheckCircle2,
      accentColor: 'border-l-emerald-600',
      textColor: 'text-emerald-800',
      bgHover: 'hover:bg-emerald-50/40',
    },
    {
      id: 'escalated',
      filterValue: 'Escalated',
      label: 'Escalated Cases',
      value: stats.escalated,
      subtitle: 'Apex committee review',
      icon: AlertOctagon,
      accentColor: 'border-l-purple-600',
      textColor: 'text-purple-800',
      bgHover: 'hover:bg-purple-50/40',
    },
    {
      id: 'critical',
      filterValue: 'priority:Critical',
      label: 'Critical Priority',
      value: stats.criticalPriority,
      subtitle: 'Anti-ragging / Emergency',
      icon: Flame,
      accentColor: 'border-l-rose-600',
      textColor: 'text-rose-800',
      bgHover: 'hover:bg-rose-50/40',
    },
  ];

  return (
    <div className="mb-6 space-y-3">
      {/* Official AICTE National Database Verification Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Database className="w-4 h-4 text-blue-900" />
          <span className="font-bold">National Grievance Monitoring Registry:</span>
          <span className="text-slate-600 font-medium">
            {stats.total} verified statutory complaints active across AICTE approved technical institutes
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            100% Verified AICTE Records
          </span>
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = activeFilter === card.filterValue;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onFilterClick && onFilterClick(card.filterValue)}
              className={`bg-white rounded-lg p-3 sm:p-3.5 border text-left transition-all cursor-pointer border-l-4 ${
                card.accentColor
              } ${card.bgHover} ${
                isSelected
                  ? 'ring-2 ring-blue-900 shadow-sm border-blue-900'
                  : 'border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {card.label}
                </span>
                <Icon className={`w-4 h-4 shrink-0 ${card.textColor}`} />
              </div>
              <div className={`text-xl sm:text-2xl font-extrabold ${card.textColor} leading-tight`}>
                {card.value}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 truncate mt-1">
                {card.subtitle}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
