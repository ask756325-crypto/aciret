import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Phone, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  GraduationCap, 
  Building2, 
  UserCheck, 
  Lock, 
  Clock
} from 'lucide-react';
import { auth, REGISTERED_USERS, RegisteredUser, OtpDispatchResult } from '../services/auth';
import { UserSession, UserRole } from '../types';

interface LoginGatewayProps {
  onLoginSuccess: (user: UserSession) => void;
}

export const LoginGateway: React.FC<LoginGatewayProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDispatch, setActiveDispatch] = useState<OtpDispatchResult | null>(null);
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<RegisteredUser | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (step === 'otp' && countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
    setError(null);
    const matched = auth.findUserByPhone(raw);
    setSelectedPersona(matched || null);
  };

  const handleSelectQuickPersona = async (persona: RegisteredUser) => {
    setPhone(persona.phone);
    setSelectedPersona(persona);
    setError(null);
    await triggerSendOtp(persona.phone, persona);
  };

  const triggerSendOtp = async (targetPhone: string, personaHint?: RegisteredUser) => {
    const cleanPhone = targetPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    try {
      setIsSendingOtp(true);
      setError(null);
      const res = await auth.sendOtp(cleanPhone);
      setActiveDispatch(res);
      if (personaHint) {
        setSelectedPersona(personaHint);
      } else if (res.matchedUser) {
        setSelectedPersona(res.matchedUser);
      } else {
        setSelectedPersona(null);
      }
      setStep('otp');
      setCountdown(45);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);

      // Auto-focus first OTP input after render
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch verification OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleManualSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSendOtp(phone, selectedPersona || undefined);
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = char;
    setOtpDigits(nextDigits);
    setError(null);

    // Auto advance
    if (char && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const nextDigits = ['', '', '', '', '', ''];
      for (let i = 0; i < pasted.length; i++) {
        nextDigits[i] = pasted[i];
      }
      setOtpDigits(nextDigits);
      const focusIndex = Math.min(pasted.length, 5);
      otpInputsRef.current[focusIndex]?.focus();
    }
  };

  const handleAutoFillOtp = () => {
    if (activeDispatch?.otp) {
      const chars = activeDispatch.otp.split('').slice(0, 6);
      setOtpDigits(chars);
      setError(null);
      otpInputsRef.current[5]?.focus();
    }
  };

  const handleCopyCode = () => {
    if (activeDispatch?.otp) {
      navigator.clipboard.writeText(activeDispatch.otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP received on your mobile.');
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);
      const user = await auth.verifyOtp(phone, enteredOtp);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err?.message || 'Incorrect OTP code. Please check and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <Shield className="w-3 h-3 text-purple-700" />
            Central Administrator
          </span>
        );
      case 'officer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Building2 className="w-3 h-3 text-blue-700" />
            Grievance Redressal Officer
          </span>
        );
      case 'student':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <GraduationCap className="w-3 h-3 text-emerald-700" />
            Student / Complainant
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
      {/* Top Tricolor Brand Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600"></div>

      {/* Main Government Gateway Container */}
      <div className="max-w-4xl mx-auto w-full px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        
        {/* National Emblem & AICTE Title Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#0b1e36] text-amber-400 shadow-md border-2 border-amber-400/30 mb-3">
            <div className="text-center leading-none">
              <span className="block font-black text-sm tracking-wider">AICTE</span>
              <span className="text-[9px] text-blue-100 font-mono tracking-widest mt-0.5">INDIA</span>
            </div>
          </div>
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
            अखिल भारतीय तकनीकी शिक्षा परिषद · Government of India
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
            AICTE National Grievance Redressal Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mt-1">
            Centralized Institutional Grievance Monitoring & Compliance System (ICMS)
          </p>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Card Banner */}
          <div className="bg-[#0b1e36] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-blue-900">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-900/60 border border-blue-700 flex items-center justify-center">
                <Lock className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base leading-tight">
                  Mobile Number & OTP Authentication Gateway
                </h2>
                <p className="text-xs text-blue-200">
                  Mandatory citizen & institutional verification under AICTE Cyber Security Directives
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs bg-blue-950/80 px-2.5 py-1 rounded border border-blue-800 text-blue-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>256-Bit SSL Secured</span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-800 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{error}</div>
              </div>
            )}

            {/* STEP 1: ENTER MOBILE NUMBER */}
            {step === 'mobile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-900" />
                    Enter Registered Mobile Number
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your 10-digit Indian mobile number. An authentic One-Time Password (OTP) will be dispatched to authenticate your role and grant portal access.
                  </p>
                </div>

                <form onSubmit={handleManualSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mobile Number (India)
                    </label>
                    <div className="relative flex rounded-lg shadow-2xs border border-slate-300 focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-100 overflow-hidden">
                      <div className="bg-slate-100 border-r border-slate-300 px-3.5 flex items-center gap-1.5 text-xs font-bold text-slate-700 shrink-0 select-none">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                        maxLength={10}
                        className="w-full px-3.5 py-2.5 text-sm sm:text-base font-mono font-medium text-slate-900 focus:outline-none placeholder:text-slate-400"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Auto-detected role banner if number matches a pre-seeded account */}
                  {selectedPersona && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[11px] font-semibold text-blue-800 uppercase tracking-wide">
                          Registered AICTE Account Identified
                        </div>
                        <div className="font-bold text-slate-900 text-sm mt-0.5">
                          {selectedPersona.name}
                        </div>
                        <div className="text-slate-600 text-xs">
                          {selectedPersona.institutionName || selectedPersona.designation}
                        </div>
                      </div>
                      <div>
                        {getRoleBadge(selectedPersona.role)}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSendingOtp || phone.length !== 10}
                    className="w-full py-3 px-4 bg-[#0b1e36] hover:bg-[#142d4f] text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    {isSendingOtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Dispatching OTP via SMS Gateway...</span>
                      </>
                    ) : (
                      <>
                        <span>Get One Time Password (OTP)</span>
                        <ArrowRight className="w-4 h-4 text-amber-300" />
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Select Persona Cards */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-900" />
                      Authorized AICTE Directory Logins (Single-Click Verification)
                    </span>
                    <span className="text-[11px] text-slate-500">Click to select registered profile and dispatch authentic OTP</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {REGISTERED_USERS.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectQuickPersona(user)}
                        disabled={isSendingOtp}
                        className={`text-left p-3 rounded-xl border transition-all text-xs cursor-pointer flex flex-col justify-between hover:shadow-sm ${
                          phone === user.phone
                            ? 'border-blue-700 bg-blue-50/70 shadow-2xs ring-1 ring-blue-700'
                            : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="font-bold text-slate-900 text-sm leading-tight">
                            {user.name}
                          </div>
                          <div>{getRoleBadge(user.role)}</div>
                        </div>

                        <div className="text-slate-600 text-[11px] truncate mb-2">
                          {user.institutionName || user.designation}
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between font-mono text-[11px] text-slate-700">
                          <span className="font-semibold text-blue-900">📱 +91 {user.phone}</span>
                          <span className="text-blue-700 font-sans font-bold hover:underline flex items-center gap-0.5">
                            Select & Login →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ENTER OTP */}
            {step === 'otp' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-700" />
                      Verify Mobile OTP
                    </h3>
                    <button
                      type="button"
                      onClick={() => setStep('mobile')}
                      className="text-xs text-blue-800 hover:text-blue-950 font-bold underline cursor-pointer"
                    >
                      Change Mobile Number
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    A 6-digit verification code has been dispatched to{' '}
                    <strong className="text-slate-900 font-mono">+91 {phone}</strong>.
                  </p>
                </div>

                {/* Simulated SMS Dispatch Notification Banner */}
                {activeDispatch && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        National Telecom SMS Gateway (Govt. SMS C-DAC Push Server)
                      </span>
                      <span className="text-[11px] text-amber-700 font-medium">Delivered to +91 {activeDispatch.phone}</span>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-amber-200 font-mono text-xs sm:text-sm text-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                      <div>
                        <span className="text-slate-500">[GOV-AICTE]</span> Your verification OTP for Portal login is{' '}
                        <span className="font-bold text-emerald-700 text-base sm:text-lg bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                          {activeDispatch.otp}
                        </span>
                        . Valid for 5 minutes.
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-medium rounded text-xs border border-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAutoFillOtp}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-sans font-bold rounded text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <span>Auto-Fill OTP</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto-Assigned Profile Preview */}
                {selectedPersona && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 uppercase font-semibold">Designated Identity</span>
                      <div className="font-bold text-slate-900 text-sm">{selectedPersona.name}</div>
                      <div className="text-slate-600 text-xs">{selectedPersona.institutionName || selectedPersona.designation}</div>
                    </div>
                    <div>{getRoleBadge(selectedPersona.role)}</div>
                  </div>
                )}

                {/* 6 Segmented Digit Inputs */}
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
                      Enter 6-Digit Verification Code
                    </label>
                    <div className="flex justify-center items-center gap-2 sm:gap-3">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            otpInputsRef.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={handleOtpPaste}
                          className="w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-bold font-mono text-slate-900 border-2 rounded-xl border-slate-300 focus:border-blue-900 focus:ring-3 focus:ring-blue-100 focus:outline-none transition-all shadow-2xs"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Resend Timer */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {countdown > 0 ? (
                        <span>
                          Resend code in <strong className="text-slate-900">{countdown}s</strong>
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">You can now request a new code</span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!canResend || isSendingOtp}
                      onClick={() => triggerSendOtp(phone, selectedPersona || undefined)}
                      className="text-blue-800 hover:text-blue-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSendingOtp ? 'animate-spin' : ''}`} />
                      <span>Resend OTP</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying || otpDigits.join('').length !== 6}
                    className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Verifying Credentials & Initializing Session...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        <span>Verify OTP & Enter AICTE Portal</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Statutory Footer Details */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-900 shrink-0" />
              <span>Compliant with AICTE Redressal of Grievance of Students Regulations 2019</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <a href="tel:18001805522" className="text-slate-600 hover:text-blue-900 font-medium">
                Helpline: 1800-180-5522
              </a>
              <span>·</span>
              <span className="text-slate-500">NIC Cyber Framework</span>
            </div>
          </div>
        </div>

        {/* Informative Guidance Notice */}
        <div className="mt-6 text-center text-xs text-slate-500 max-w-xl mx-auto">
          Need assistance accessing your institutional account? Reach out to your designated College Grievance Redressal Committee (CGRC) or the AICTE Regional Ombudsperson.
        </div>
      </div>

      {/* Official Bottom Bar */}
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-[11px] text-slate-500">
        © 2026 All India Council for Technical Education (AICTE) · Nelson Mandela Marg, Vasant Kunj, New Delhi-110070
      </footer>
    </div>
  );
};
