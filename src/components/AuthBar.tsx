import React, { useState } from 'react';
import { UserCheck, Shield, GraduationCap, Building2, ChevronDown, LogIn, Lock, LogOut } from 'lucide-react';
import { UserRole, UserSession } from '../types';
import { DEFAULT_USERS } from '../services/auth';

interface AuthBarProps {
  currentUser: UserSession;
  onSwitchUser: (userId: string) => void;
  onCustomLogin: (email: string, role: UserRole, name?: string) => void;
  onLogout?: () => void;
}

export const AuthBar: React.FC<AuthBarProps> = ({
  currentUser,
  onSwitchUser,
  onCustomLogin,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState<UserRole>('student');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) return;
    onCustomLogin(customEmail.trim(), customRole, customName.trim());
    setShowCustomModal(false);
    setIsOpen(false);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="bg-purple-900 text-purple-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-purple-700 flex items-center gap-1">
            <Shield className="w-3 h-3 text-purple-300" />
            Central Administrator
          </span>
        );
      case 'officer':
        return (
          <span className="bg-blue-900 text-blue-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-blue-700 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-blue-300" />
            Regional Nodal Officer
          </span>
        );
      case 'student':
      default:
        return (
          <span className="bg-emerald-900 text-emerald-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-emerald-700 flex items-center gap-1">
            <GraduationCap className="w-3 h-3 text-emerald-300" />
            Student Complainant
          </span>
        );
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/20 text-xs"
        title="Switch user role or identity"
      >
        <UserCheck className="w-3.5 h-3.5 text-blue-300" />
        <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-[200px]">
          {currentUser.name}
        </span>
        {getRoleBadge(currentUser.role)}
        <ChevronDown className="w-3 h-3 text-slate-300" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-white rounded-lg shadow-xl border border-slate-200 text-slate-800 z-50 overflow-hidden text-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Active Authenticated Session
              </div>
              <div className="font-bold text-slate-900 text-sm truncate">{currentUser.name}</div>
              <div className="text-slate-600 font-mono text-[11px] truncate">{currentUser.email}</div>
              {currentUser.phone && (
                <div className="text-emerald-700 font-mono text-[11px] font-semibold mt-0.5">
                  📱 +91 {currentUser.phone}
                </div>
              )}
              <div className="text-slate-500 text-[11px] mt-1">
                {currentUser.designation || currentUser.institutionName || 'AICTE Verified User'}
              </div>
            </div>

            <div className="p-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Role / Persona (RBAC Testing)
              </div>

              {DEFAULT_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onSwitchUser(user.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded transition-colors flex items-center justify-between cursor-pointer ${
                    currentUser.id === user.id
                      ? 'bg-blue-50 text-blue-900 font-semibold border border-blue-200'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-medium text-slate-900 leading-snug truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                  </div>
                  <div>{getRoleBadge(user.role)}</div>
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-slate-100 bg-slate-50 space-y-1.5">
              <button
                onClick={() => {
                  setShowCustomModal(true);
                  setIsOpen(false);
                }}
                className="w-full py-1.5 px-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Custom Email / Role Login</span>
              </button>

              {onLogout && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onLogout();
                  }}
                  className="w-full py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-600" />
                  <span>Log Out / Switch Mobile Number</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Custom Login Dialog */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-slate-300 text-slate-800">
            <div className="bg-[#0b1e36] text-white p-4">
              <h4 className="font-bold text-sm">Role-Based Portal Authentication</h4>
              <p className="text-xs text-blue-200 mt-0.5">Authenticate with custom email & credentials</p>
            </div>

            <form onSubmit={handleCustomSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Official Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@institute.edu.in or aicte.gov.in"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assign User Role</label>
                <select
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value as UserRole)}
                  className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                >
                  <option value="student">Student Complainant (Private personal access)</option>
                  <option value="officer">Regional Grievance Officer (Investigation & orders)</option>
                  <option value="admin">Central Administrator (System-wide oversight)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 text-white rounded font-medium hover:bg-blue-950"
                >
                  Authenticate Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
