import React from 'react';
import { 
  PhoneCall, 
  RefreshCw, 
  FileText, 
  Search, 
  LayoutDashboard, 
  PlusCircle, 
  BarChart3, 
  BookOpen, 
  CheckCircle2,
  Lock
} from 'lucide-react';
import { PortalTab, StorageStatus, UserRole, UserSession } from '../types';
import { AuthBar } from './AuthBar';

interface HeaderProps {
  activeTab: PortalTab;
  setActiveTab: (tab: PortalTab) => void;
  onResetDemo: () => void;
  isResetting: boolean;
  storageStatus?: StorageStatus | null;
  currentUser: UserSession;
  onSwitchUser: (userId: string) => void;
  onCustomLogin: (email: string, role: UserRole, name?: string) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onResetDemo,
  isResetting,
  storageStatus,
  currentUser,
  onSwitchUser,
  onCustomLogin,
  onLogout,
}) => {
  const isOfficerOrAdmin = currentUser.role === 'officer' || currentUser.role === 'admin';

  return (
    <header className="border-b border-slate-200 bg-white">
      {/* Top Government Strip with Auth Bar */}
      <div className="bg-[#0b1e36] text-slate-100 text-xs px-4 py-2 font-medium border-b border-blue-950">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-blue-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Government of India · Ministry of Education
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-300">All India Council for Technical Education</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs">
            <a 
              href="tel:18001805522" 
              className="hidden lg:flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-semibold transition-colors"
              title="National Anti-Ragging Toll-Free Helpline (24x7)"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Anti-Ragging Helpline: 1800-180-5522</span>
            </a>

            {isOfficerOrAdmin && (
              <>
                <span className="hidden sm:inline text-slate-500">|</span>
                <button
                  onClick={onResetDemo}
                  disabled={isResetting}
                  className="hidden sm:flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  title="Synchronize and refresh all official grievance records from AICTE Central Database"
                >
                  <RefreshCw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>Sync Portal Records</span>
                </button>
              </>
            )}

            <span className="text-slate-500">|</span>

            {/* Role-Based Authentication Bar */}
            <AuthBar
              currentUser={currentUser}
              onSwitchUser={onSwitchUser}
              onCustomLogin={onCustomLogin}
              onLogout={onLogout}
            />

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-2 py-0.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-700/60 text-red-200 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                title="Sign out of current mobile session"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Official Header Brand */}
      <div className="max-w-7xl mx-auto px-4 py-3.5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          {/* AICTE Emblem Crest */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#0b1e36] to-[#173a6e] rounded-lg shadow-sm border border-slate-300 flex items-center justify-center p-1.5 shrink-0">
            <div className="w-full h-full border border-amber-400/40 rounded flex flex-col items-center justify-center text-center">
              <span className="text-amber-300 font-bold text-xs tracking-wider">AICTE</span>
              <span className="text-[9px] text-blue-100 font-mono leading-none mt-0.5">INDIA</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
                AICTE Institutional Complaint Monitoring System
              </h1>
              <span className="hidden sm:inline-block bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-semibold px-2 py-0.5 rounded">
                Portal v2.6 · RBAC Enforced
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              All India Council for Technical Education · Centralized Grievance Redressal & Institutional Oversight
            </p>
          </div>
        </div>

        {/* Quick Statutory SLA badge */}
        <div className="hidden lg:flex items-center gap-3 text-right bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-slate-900">15-Day Statutory Resolution SLA</div>
            <div className="text-slate-500 text-[11px]">Under AICTE Regulations Clause 3.5</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav className="border-t border-slate-200 bg-slate-50 px-4">
        <div className="max-w-7xl mx-auto flex overflow-x-auto no-scrollbar gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'border-blue-900 text-blue-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Grievance Register</span>
          </button>

          <button
            onClick={() => setActiveTab('lodge')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'lodge'
                ? 'border-blue-900 text-blue-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-700" />
            <span>Lodge Grievance</span>
          </button>

          <button
            onClick={() => setActiveTab('track')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'track'
                ? 'border-blue-900 text-blue-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Search className="w-4 h-4 text-blue-700" />
            <span>Track Grievance / Dossier</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-blue-900 text-blue-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-700" />
            <span>Compliance Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('regulations')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'regulations'
                ? 'border-blue-900 text-blue-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>AICTE Regulations & SLA</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
