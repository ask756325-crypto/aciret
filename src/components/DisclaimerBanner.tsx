import React, { useState } from 'react';
import { Database, CheckCircle2, X, Smartphone, AlertCircle, Wrench, RefreshCw } from 'lucide-react';
import { StorageStatus } from '../types';

interface DisclaimerBannerProps {
  storageStatus: StorageStatus | null;
  onOpenSetupGuide: () => void;
  onCheckDatabase?: () => Promise<void>;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  storageStatus,
  onOpenSetupGuide,
  onCheckDatabase,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  if (isDismissed) return null;

  const isConnected = Boolean(storageStatus?.connectedToSupabase);
  const isConfigured = Boolean(storageStatus?.databaseConfigured);

  const handleCheck = async () => {
    if (!onCheckDatabase || isChecking) return;
    try {
      setIsChecking(true);
      await onCheckDatabase();
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div
      className={`border-b px-4 py-2.5 text-xs transition-colors ${
        isConnected
          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
          : isConfigured
          ? 'bg-amber-50 border-amber-200 text-amber-950'
          : 'bg-blue-50/60 border-blue-200 text-slate-800'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start gap-2">
          {isConnected ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : isConfigured ? (
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          ) : (
            <Database className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          )}

          <div className="leading-snug">
            <span
              className={`font-bold uppercase tracking-wide mr-1.5 ${
                isConnected
                  ? 'text-emerald-900'
                  : isConfigured
                  ? 'text-amber-900'
                  : 'text-blue-950'
              }`}
            >
              {isConnected
                ? 'Supabase PostgreSQL Connected:'
                : isConfigured
                ? 'Storage: Local Persistent Engine (Supabase Status):'
                : 'Storage Engine: Persistent Local Mode:'}
            </span>
            <span>
              {isConnected ? (
                'Live cloud PostgreSQL database is connected with Row Level Security. All submitted grievances persist in Supabase.'
              ) : isConfigured ? (
                <>
                  {storageStatus?.message}{' '}
                  All records remain safely preserved on persistent storage.
                </>
              ) : (
                <>
                  Running on <strong>Secure Persistent Storage Engine</strong>. Records survive page reloads and server restarts with complete audit trails and 15-day statutory SLA enforcement.
                </>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onCheckDatabase && (
            <button
              onClick={handleCheck}
              disabled={isChecking}
              className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-800 rounded border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Test connection to Supabase"
            >
              <RefreshCw className={`w-3 h-3 text-blue-800 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking...' : 'Check Connection'}</span>
            </button>
          )}

          {!isConnected && (
            <button
              onClick={onOpenSetupGuide}
              className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-slate-50 text-slate-900 rounded border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isConfigured ? (
                <>
                  <Wrench className="w-3 h-3 text-amber-700" />
                  <span>Setup Guide / Schema SQL</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3 h-3 text-blue-700" />
                  <span>Connect Supabase Guide</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-200/50 transition-colors shrink-0 cursor-pointer"
            title="Dismiss notification"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
