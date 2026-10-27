import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Database, 
  Key, 
  Copy, 
  Check, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck, 
  Code,
  FileText,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { StorageStatus } from '../types';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageStatus: StorageStatus | null;
  onRefreshStatus?: () => Promise<void>;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
  storageStatus,
  onRefreshStatus,
}) => {
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [isRetesting, setIsRetesting] = useState(false);
  const [retestResult, setRetestResult] = useState<{ connected: boolean; message: string; hint?: string } | null>(null);

  if (!isOpen) return null;

  const sampleEnvText = `SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret-key"`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(sampleEnvText);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const handleRetest = async () => {
    try {
      setIsRetesting(true);
      const res = await fetch('/api/test-supabase', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setRetestResult(data);
      }
      if (onRefreshStatus) {
        await onRefreshStatus();
      }
    } catch (err: any) {
      setRetestResult({
        connected: false,
        message: 'Could not reach server to test connection.',
      });
    } finally {
      setIsRetesting(false);
    }
  };

  const isConfigured = Boolean(storageStatus?.databaseConfigured);
  const isConnected = Boolean(storageStatus?.connectedToSupabase);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-300">
        {/* Header */}
        <div className="bg-[#0b1e36] text-white px-5 py-4 flex items-center justify-between border-b border-blue-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Supabase PostgreSQL Connection & Setup Guide
              </h3>
              <p className="text-[11px] text-blue-200">
                Works directly from your mobile phone or web browser
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          {/* Active Diagnostic / Current Status Box */}
          <div
            className={`p-3.5 rounded-lg border ${
              isConnected
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : isConfigured
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-blue-50 border-blue-200 text-blue-950'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="font-bold flex items-center gap-1.5">
                {isConnected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : isConfigured ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : (
                  <Database className="w-4 h-4 text-blue-700" />
                )}
                <span>
                  {isConnected
                    ? 'Connected to Live Cloud Supabase'
                    : isConfigured
                    ? 'Supabase Connection Notice'
                    : 'Current Mode: Persistent Local Storage'}
                </span>
              </div>

              <button
                onClick={handleRetest}
                disabled={isRetesting}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRetesting ? 'animate-spin' : ''}`} />
                <span>{isRetesting ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            <p className="text-[11px] leading-relaxed">
              {retestResult?.message || storageStatus?.message}
            </p>

            {(retestResult?.hint || storageStatus?.diagnosticHint) && (
              <div className="mt-2 p-2 bg-white/80 rounded border border-amber-300/60 text-[11px] text-amber-900 font-medium">
                💡 <strong>Action Required:</strong> {retestResult?.hint || storageStatus?.diagnosticHint}
              </div>
            )}

            {storageStatus?.projectUrl && (
              <div className="mt-1 text-[10px] text-slate-600 font-mono">
                Current URL in environment: {storageStatus.projectUrl}
              </div>
            )}
          </div>

          {/* Simple Steps for Android Users */}
          <div className="space-y-3">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
              Quick Setup Steps for Mobile & Web
            </div>

            {/* Step 1 */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                1
              </span>
              <div className="space-y-1">
                <div className="font-bold text-slate-900">
                  Open Supabase on your browser
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Visit{' '}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 font-semibold underline inline-flex items-center gap-0.5"
                  >
                    supabase.com <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  . Sign up or log in for free using Google or GitHub.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                2
              </span>
              <div className="space-y-1">
                <div className="font-bold text-slate-900">
                  Create a New Project
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Tap <strong>"New Project"</strong>, name it <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">aicte-grievance</code>, choose a database password, select your region (e.g. Mumbai, Singapore), and tap <strong>"Create new project"</strong>.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                3
              </span>
              <div className="space-y-1.5 w-full">
                <div className="font-bold text-slate-900">
                  Copy Exact Project URL & Service Role Key
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Go to <strong>Project Settings (gear icon ⚙️)</strong> &rarr; <strong>API</strong>.
                </p>
                <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5 pl-1">
                  <li><strong>Project URL</strong>: Click the copy button next to URL (format: <code className="bg-slate-200 px-1 py-0.2 rounded font-mono">https://[20-chars].supabase.co</code>). Ensure no letters are cut off.</li>
                  <li><strong>Service Role Key</strong>: Tap "reveal" under Project API keys and copy the <code className="bg-slate-200 px-1 py-0.2 rounded font-mono">service_role</code> secret.</li>
                </ul>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                4
              </span>
              <div className="space-y-1.5 w-full">
                <div className="font-bold text-slate-900">
                  Run the Database Schema in SQL Editor
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  In your Supabase project, tap <strong>SQL Editor</strong> (<code className="font-mono">&gt;_</code> icon). Open the <code className="bg-slate-200 px-1 py-0.2 rounded text-slate-900 font-semibold">supabase/schema.sql</code> file included in this app, copy its contents, paste it into the SQL Editor, and tap <strong>Run</strong>.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                5
              </span>
              <div className="space-y-1">
                <div className="font-bold text-emerald-950">
                  Save Secrets in AI Studio
                </div>
                <p className="text-emerald-900 text-[11px] leading-relaxed">
                  Add <code className="font-mono bg-white px-1 py-0.5 rounded text-slate-800">SUPABASE_URL</code> and <code className="font-mono bg-white px-1 py-0.5 rounded text-slate-800">SUPABASE_SERVICE_ROLE_KEY</code> in your project environment settings. Tap <strong>Test Connection</strong> above to verify!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Service role key is kept safely on server only</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-900 text-white font-medium rounded hover:bg-blue-950 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
