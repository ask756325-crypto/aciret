import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { StatsCards } from './components/StatsCards';
import { ComplaintTable } from './components/ComplaintTable';
import { ComplaintForm } from './components/ComplaintForm';
import { ComplaintTracker } from './components/ComplaintTracker';
import { ChartsView } from './components/ChartsView';
import { ComplaintDetailsModal } from './components/ComplaintDetailsModal';
import { RegulationsView } from './components/RegulationsView';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { LoginGateway } from './components/LoginGateway';
import { api } from './services/api';
import { auth } from './services/auth';
import { Complaint, ComplaintStats, PortalTab, StorageStatus, UserRole, UserSession } from './types';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<UserSession | null>(auth.getCurrentUser());
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [trackingId, setTrackingId] = useState<string>('');
  const [isResetting, setIsResetting] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Data scope: 'official' (real only, default), 'demo' (sample fixtures), 'all' (combined)
  const [scope, setScope] = useState<'official' | 'demo' | 'all'>('official');
  const [myComplaintsOnly, setMyComplaintsOnly] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'real' | 'demo'>('real');
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Load complaints, stats, and storage status
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedComplaints, fetchedStats, fetchedStorage] = await Promise.all([
        api.getComplaints({
          status: statusFilter,
          category: categoryFilter,
          priority: priorityFilter,
          source: sourceFilter,
          search: searchQuery,
          scope,
          myComplaints: myComplaintsOnly,
        }),
        api.getStats(scope),
        api.getStorageStatus(),
      ]);
      setComplaints(fetchedComplaints);
      setStats(fetchedStats);
      setStorageStatus(fetchedStorage);
    } catch (err) {
      console.error('Failed to load portal data:', err);
      showToast('Could not reach backend API server. Showing cached data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, priorityFilter, sourceFilter, searchQuery, scope, myComplaintsOnly]);

  const handleResetFilters = () => {
    setStatusFilter('All');
    setCategoryFilter('All');
    setPriorityFilter('All');
    setSourceFilter('real');
    setScope('official');
    setMyComplaintsOnly(false);
    setSearchQuery('');
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Synchronize official grievance records from AICTE Central Registry? All your submitted complaints will remain safely preserved.')) return;
    try {
      setIsResetting(true);
      await api.resetDemo();
      handleResetFilters();
      await loadData();
      showToast('AICTE Central Registry records synchronized successfully!', 'success');
    } catch (e) {
      showToast('Failed to synchronize records.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCreateComplaint = async (payload: any): Promise<Complaint | null> => {
    try {
      const created = await api.createComplaint(payload);
      if (created) {
        showToast(`Grievance docketed successfully with ID: ${created.id}`, 'success');
        // Automatically re-fetch stats and complaints to update dashboard immediately
        await loadData();
        return created;
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit grievance', 'error');
    }
    return null;
  };

  const handleUpdateStatus = async (
    id: string,
    params: {
      status: string;
      remarks: string;
      actor: string;
      actorRole: string;
      resolutionSummary?: string;
      actionTakenAgainstInstitute?: string;
    }
  ) => {
    const updated = await api.updateComplaintStatus(id, params);
    setSelectedComplaint(updated);
    showToast(`Status updated to ${params.status} for docket ${id}`, 'success');
    // Automatically re-fetch stats and complaints to reflect resolution rate and counts immediately
    await loadData();
  };

  const handleAddOfficerNote = async (
    id: string,
    params: { author: string; authorRole: string; note: string; isConfidential: boolean }
  ) => {
    const updated = await api.addOfficerNote(id, params);
    setSelectedComplaint(updated);
    showToast('Internal officer note appended to docket.', 'info');
    await loadData();
  };

  const handleSearchDocket = async (id: string, pin?: string): Promise<Complaint | null> => {
    return await api.getComplaintById(id, pin);
  };

  const handleNavigateToTrack = (complaintId: string) => {
    setTrackingId(complaintId);
    setActiveTab('track');
  };

  const handleCheckDatabase = async () => {
    try {
      const res = await api.checkDatabase();
      setStorageStatus(res);
      if (res.connectedToSupabase) {
        showToast('Connected to Supabase PostgreSQL successfully!', 'success');
        await loadData();
      } else {
        showToast(res.message, 'info');
      }
    } catch {
      showToast('Could not query database status.', 'error');
    }
  };

  const handleSwitchUser = (userId: string) => {
    const u = auth.loginAs(userId);
    if (u) {
      setCurrentUser(u);
      showToast(`Switched active profile to ${u.name} (${u.role.toUpperCase()})`, 'info');
      loadData();
    }
  };

  const handleCustomLogin = (email: string, role: UserRole, name?: string) => {
    const u = auth.customLogin(email, role, name);
    setCurrentUser(u);
    showToast(`Logged in as ${u.name} (${u.role.toUpperCase()})`, 'success');
    loadData();
  };

  const handleLogout = () => {
    auth.logout();
    setCurrentUser(null);
    showToast('Signed out of AICTE Portal. Mobile verification required.', 'info');
  };

  // If user is not authenticated, display the mandatory Mobile Number + OTP Login Gateway
  if (!currentUser) {
    return (
      <LoginGateway
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome ${user.name}! Authenticated via Mobile OTP (+91 ${user.phone || 'Verified'}).`, 'success');
          loadData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans">
      {/* Official Government Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetDemo={handleResetDemoData}
        isResetting={isResetting}
        storageStatus={storageStatus}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onCustomLogin={handleCustomLogin}
        onLogout={handleLogout}
      />

      {/* Storage and Hackathon Status Notice Banner */}
      <DisclaimerBanner
        storageStatus={storageStatus}
        onOpenSetupGuide={() => setIsSetupModalOpen(true)}
        onCheckDatabase={handleCheckDatabase}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md animate-slideUp">
          <div
            className={`p-3.5 rounded-lg shadow-lg border text-xs flex items-center justify-between gap-3 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
                : toastMessage.type === 'error'
                ? 'bg-rose-900 text-rose-50 border-rose-700'
                : 'bg-[#0b1e36] text-white border-blue-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/70 hover:text-white p-1 rounded"
              title="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 sm:py-6">
        {/* TAB 1: Admin Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                  National Institutional Grievance Dashboard
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Real-time statutory monitoring across AICTE-approved polytechnics, engineering, and management institutes
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setActiveTab('lodge')}
                  className="px-3 py-1.5 bg-blue-900 text-white rounded font-medium hover:bg-blue-950 transition-colors shadow-xs cursor-pointer"
                >
                  + Lodge New Grievance
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  View Full Analytics
                </button>
              </div>
            </div>

            {/* Quick Stats Cards with Filter click handlers */}
            {stats && (
              <StatsCards
                stats={stats}
                activeFilter={statusFilter}
                scope={scope}
                onScopeChange={(newScope) => {
                  setScope(newScope);
                  if (newScope === 'official') setSourceFilter('real');
                  else if (newScope === 'demo') setSourceFilter('demo');
                  else setSourceFilter('all');
                }}
                onFilterClick={(filterVal) => {
                  if (filterVal === 'priority:Critical') {
                    setPriorityFilter('Critical');
                    setStatusFilter('All');
                  } else if (filterVal === 'All') {
                    setStatusFilter('All');
                    setPriorityFilter('All');
                  } else {
                    setStatusFilter(filterVal);
                    setPriorityFilter('All');
                  }
                }}
              />
            )}

            {/* Complaint Management Table */}
            <ComplaintTable
              complaints={complaints}
              isLoading={isLoading}
              onSelectComplaint={(complaint) => setSelectedComplaint(complaint)}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sourceFilter={sourceFilter}
              setSourceFilter={(s) => {
                setSourceFilter(s);
                if (s === 'real') setScope('official');
                else if (s === 'demo') setScope('demo');
                else setScope('all');
              }}
              onResetFilters={handleResetFilters}
              currentUser={currentUser}
              myComplaintsOnly={myComplaintsOnly}
              setMyComplaintsOnly={setMyComplaintsOnly}
            />
          </div>
        )}

        {/* TAB 2: Student Complaint Submission Form */}
        {activeTab === 'lodge' && (
          <ComplaintForm
            onSubmit={handleCreateComplaint}
            onNavigateToTrack={handleNavigateToTrack}
          />
        )}

        {/* TAB 3: Track Complaint */}
        {activeTab === 'track' && (
          <ComplaintTracker
            initialId={trackingId}
            onSearch={handleSearchDocket}
            onOpenDetails={(complaint) => setSelectedComplaint(complaint)}
          />
        )}

        {/* TAB 4: Reports & Analytics */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-6">
            <div className="pb-2 border-b border-slate-200">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Grievance Redressal Statistical Reports
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Aggregate compliance metrics, regional distributions, and category patterns
              </p>
            </div>
            <ChartsView stats={stats} />
          </div>
        )}

        {/* TAB 5: AICTE Norms & Regulations */}
        {activeTab === 'regulations' && <RegulationsView />}
      </main>

      {/* Case Dossier Modal */}
      {selectedComplaint && (
        <ComplaintDetailsModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdateStatus={handleUpdateStatus}
          onAddOfficerNote={handleAddOfficerNote}
          currentUser={currentUser}
        />
      )}

      {/* Supabase Mobile Setup Guide Modal */}
      <SupabaseSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        storageStatus={storageStatus}
        onRefreshStatus={loadData}
      />

      {/* Official Government Footer */}
      <footer className="bg-[#0b1e36] text-slate-300 text-xs border-t border-blue-950 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 pb-6 border-b border-blue-900/60">
            <div className="space-y-2">
              <div className="font-bold text-white text-sm">
                AICTE ICMS Portal
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Centralized grievance redressal and compliance mechanism mandated under AICTE Regulations for all approved technical institutions in India.
              </p>
            </div>

            <div>
              <div className="font-semibold text-white mb-2">Emergency Helplines</div>
              <ul className="space-y-1.5 text-slate-400">
                <li>Anti-Ragging 24x7: <strong className="text-amber-300">1800-180-5522</strong></li>
                <li>AICTE Central Desk: 011-29581000</li>
                <li>Women Grievance Cell: 1800-111-655</li>
                <li>National Cyber Crime: 1930</li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-white mb-2">Statutory References</div>
              <ul className="space-y-1.5 text-slate-400">
                <li>AICTE Act 1987 (Act No. 52)</li>
                <li>Student Grievance Regulations 2019</li>
                <li>Anti-Ragging Notification F.No. 37-3</li>
                <li>Model Curriculum Norms</li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-white mb-2">Storage Architecture</div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Engine: <strong className="text-slate-200">{storageStatus?.storageEngine || 'Persistent Local Engine'}</strong>. Row Level Security policies generated for Supabase PostgreSQL integration.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-[11px]">
            <div>
              © 2026 All India Council for Technical Education. Ministry of Education, Govt. of India.
            </div>
            <div>
              Designed for High Accessibility & Transparent Governance
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
