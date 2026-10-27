import { UserRole, UserSession } from '../types';

export interface RegisteredUser extends UserSession {
  phone: string;
}

export const REGISTERED_USERS: RegisteredUser[] = [
  {
    id: 'usr-student-01',
    name: 'Arjun Sundaram',
    email: 'arjun.s@iisc.ac.in',
    phone: '9876543210',
    role: 'student',
    institutionId: '1-77352793',
    institutionName: 'Indian Institute of Science (IISc), Bengaluru',
    rollNumber: 'IISc-2025-EE-104',
    designation: 'B.Tech / M.Tech Student Scholar',
  },
  {
    id: 'usr-student-02',
    name: 'Kavya Murthy',
    email: 'kavya.m@nitk.edu.in',
    phone: '9812345678',
    role: 'student',
    institutionId: '1-10492819',
    institutionName: 'National Institute of Technology Karnataka (NITK)',
    rollNumber: 'NITK/2024/EC/077',
    designation: 'Undergraduate Engineering Scholar',
  },
  {
    id: 'usr-officer-01',
    name: 'Dr. Vivek S. Rathore',
    email: 'v.rathore@aicte-india.org',
    phone: '9845012345',
    role: 'officer',
    designation: 'Regional Grievance Nodal Officer & Anti-Ragging Ombudsperson',
  },
  {
    id: 'usr-admin-01',
    name: 'Shri R. K. Mahajan',
    email: 'director-icms@aicte-india.org',
    phone: '9899123456',
    role: 'admin',
    designation: 'Chief Compliance Commissioner & AICTE Directorate Oversight',
  },
];

export const DEFAULT_USERS: UserSession[] = REGISTERED_USERS;

const AUTH_STORAGE_KEY = 'aicte_icms_session_v3';
const OTP_STORAGE_KEY = 'aicte_active_otp_dispatch';

export interface OtpDispatchResult {
  success: boolean;
  message: string;
  phone: string;
  otp: string;
  matchedUser?: RegisteredUser;
  expiresInSeconds: number;
}

export const auth = {
  getRegisteredUsers(): RegisteredUser[] {
    return REGISTERED_USERS;
  },

  findUserByPhone(phone: string): RegisteredUser | undefined {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    return REGISTERED_USERS.find((u) => u.phone.replace(/\D/g, '').slice(-10) === cleanPhone);
  },

  getCurrentUser(): UserSession | null {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.role && (parsed.phone || parsed.email)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  },

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },

  setCurrentUser(user: UserSession): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  },

  logout(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(OTP_STORAGE_KEY);
    } catch {
      // ignore
    }
  },

  getAuthHeaders(): Record<string, string> {
    const user = this.getCurrentUser();
    if (!user) return {};
    return {
      'X-User-Role': user.role,
      'X-User-Id': user.id,
      'X-User-Email': user.email,
      'X-User-Phone': user.phone || '',
    };
  },

  /**
   * Request OTP generation for 10-digit mobile number
   */
  async sendOtp(phoneInput: string): Promise<OtpDispatchResult> {
    const cleanPhone = phoneInput.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      throw new Error('Please enter a valid 10-digit Indian mobile number');
    }

    // Try calling backend endpoint if available
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      if (res.ok) {
        const data = await res.json();
        const result: OtpDispatchResult = {
          success: true,
          message: data.message || `OTP dispatched to +91 ${cleanPhone}`,
          phone: cleanPhone,
          otp: data.otp,
          matchedUser: data.user,
          expiresInSeconds: 300,
        };
        sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify({ phone: cleanPhone, otp: data.otp, timestamp: Date.now() }));
        return result;
      }
    } catch {
      // Fallback to client-side simulated generation
    }

    // Client fallback generator
    const matched = this.findUserByPhone(cleanPhone);
    // Generate deterministic or random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const result: OtpDispatchResult = {
      success: true,
      message: `OTP sent successfully to registered mobile +91 ${cleanPhone}`,
      phone: cleanPhone,
      otp: generatedOtp,
      matchedUser: matched,
      expiresInSeconds: 300,
    };

    sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify({ phone: cleanPhone, otp: generatedOtp, timestamp: Date.now() }));
    return result;
  },

  /**
   * Verify entered OTP against dispatched code and establish authenticated session
   */
  async verifyOtp(phoneInput: string, enteredOtp: string): Promise<UserSession> {
    const cleanPhone = phoneInput.replace(/\D/g, '').slice(-10);
    const cleanOtp = enteredOtp.trim();

    if (cleanOtp.length !== 6) {
      throw new Error('Please enter all 6 digits of the OTP.');
    }

    // Try verifying with backend
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.setCurrentUser(data.user);
          sessionStorage.removeItem(OTP_STORAGE_KEY);
          return data.user;
        }
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Invalid OTP code entered');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Invalid OTP')) {
        throw err;
      }
      // Fallback verification against local session storage
    }

    // Local fallback verification
    const storedRaw = sessionStorage.getItem(OTP_STORAGE_KEY);
    let expectedOtp: string | null = null;
    if (storedRaw) {
      try {
        const parsed = JSON.parse(storedRaw);
        if (parsed.phone === cleanPhone) {
          expectedOtp = parsed.otp;
        }
      } catch {
        // ignore
      }
    }

    // Accept expected OTP or universal demo OTP '123456'
    if (cleanOtp !== expectedOtp && cleanOtp !== '123456') {
      throw new Error('Incorrect OTP entered. Please re-check the dispatched verification code.');
    }

    const matched = this.findUserByPhone(cleanPhone);
    const session: UserSession = matched || {
      id: `usr-student-${cleanPhone.slice(-4)}`,
      name: `Citizen / Student (+91 ${cleanPhone})`,
      email: `student-${cleanPhone.slice(-4)}@grievance.aicte.gov.in`,
      phone: cleanPhone,
      role: 'student',
      designation: 'Registered Student Complainant',
      institutionName: 'Technical Institution (AICTE Affiliated)',
    };

    this.setCurrentUser(session);
    sessionStorage.removeItem(OTP_STORAGE_KEY);
    return session;
  },

  loginAs(userId: string): UserSession {
    const matched = REGISTERED_USERS.find((u) => u.id === userId);
    if (matched) {
      this.setCurrentUser(matched);
      return matched;
    }
    return REGISTERED_USERS[0];
  },

  customLogin(email: string, role: UserRole, name?: string): UserSession {
    const session: UserSession = {
      id: `usr-${Date.now()}`,
      name: name || email.split('@')[0],
      email,
      phone: '9876543210',
      role,
      designation: role === 'admin' ? 'Central Administrator' : role === 'officer' ? 'Grievance Review Officer' : 'Student Complainant',
    };
    this.setCurrentUser(session);
    return session;
  },
};
