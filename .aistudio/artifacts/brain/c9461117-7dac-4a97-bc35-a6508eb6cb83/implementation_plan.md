# Implementation Plan: Mobile OTP Authentication Gateway & Authentic AICTE Grievance Data

Implement a mandatory government-grade Mobile Number + OTP authentication gateway as the first entry page to the AICTE Complaint Monitoring Portal, alongside a diverse, authentic dataset of real institutional grievances.

---

## 1. User Specifications & Selected Options
- **OTP Verification Flow**: Pre-filled registered test numbers with one-click instant selection and copyable/auto-filled 6-digit OTP with live countdown timer.
- **Role Assignment**: Auto-assigned dynamically based on registered pre-seeded phone numbers (e.g., Student/Complainant, AICTE Grievance Redressal Officer, Institutional Nodal Officer, System Administrator).
- **Dataset**: Rich, authentic AICTE grievance records spanning Fee & Capitation Disputes, Anti-Ragging incidents, Exam/Evaluation Irregularities, and Lab/Infrastructure Compliance across accredited institutions nationwide.

---

## 2. Proposed Architectural & Code Changes

### A. Authentication Gateway & Session Management (`src/components/LoginGateway.tsx`)
- **Initial Landing Barrier**:
  - Gated navigation: Unauthenticated users are strictly held on the official AICTE Portal Login Gateway before accessing any home page or dashboard views.
  - Indian Standard 10-digit mobile input format (`+91`) with real-time numeric validation.
  - One-click "Quick Select Demo User" cards detailing registered phone number, user name, institution, and designated system role.
  - 6-digit OTP input boxes with auto-advance, backspace navigation, paste handling, and a realistic 45-second resend countdown.
  - Simulated instant SMS dispatch banner showing the generated verification code and expiration time.
  - Persistent auth session in `localStorage` with full role metadata, token, and a prominent "Logout / Change Session" action in the top navigation bar.

### B. Backend OTP & Authentication APIs (`server.ts`)
- **`/api/auth/send-otp`**: Validates 10-digit mobile number against registered accounts or allows new student registration, generates a timed 6-digit verification code, and logs dispatch.
- **`/api/auth/verify-otp`**: Verifies submitted OTP, returns an authenticated user session object with designated role (`student`, `officer`, `nodal_admin`, `super_admin`), registered institution, and permissions.
- **`/api/auth/me`**: Session validation endpoint to restore and verify session integrity on page reload.

### C. Authentic AICTE Institutional Grievance Dataset (`src/data/complaintsData.ts`)
- Replace generic placeholder data with realistic AICTE institutional grievance dockets:
  - **Fee Irregularities**: Unauthorized withholding of original academic certificates, refusal to refund caution deposits/advance fees post-admission withdrawal.
  - **Ragging & Student Safety**: Hostal zero-tolerance anti-ragging escalation, institutional anti-ragging cell review reports.
  - **Academic & Examination Conduct**: Delay in semester grade cards, unfair internal assessment calculation, non-compliance with syllabus norms.
  - **Campus & Laboratory Infrastructure**: Insufficient AICTE-mandated computing equipment and hazardous chemistry laboratory ventilation.
- Maintain strict fields: `isDemo: false` for all official complaints, genuine Indian engineering/management colleges (e.g., Pune Institute of Computer Technology, National Institute of Technology Trichy, Delhi Technological University, etc.), unique tracking IDs (`AICTE-2025-FE-1092`, `AICTE-2025-RG-0841`), audit logs, officer remarks, and tracking security PINs.

### D. Portal Home Page & Navigation Integration (`src/App.tsx`, `src/components/Navbar.tsx`)
- Wire auth status into the top-level app state: if `!currentUser`, render the `LoginGateway` component as full-screen portal entry.
- Upon successful OTP submission, seamlessly navigate into the authenticated AICTE Home Page with welcome banner, current user badge, and role-appropriate dashboard access.
- Add secure "Sign Out" button in `Navbar.tsx` that clears local session and returns user to the Login Gateway.

---

## 3. Verification Plan
1. **Compilation & Linting**: Run `compile_applet` and `lint_applet` to ensure zero TypeScript and lint errors.
2. **First-Screen Gate**: Refresh portal and verify that the unauthenticated state immediately renders the official AICTE Mobile OTP login gateway.
3. **OTP Flow Testing**:
   - Test quick-select pre-seeded accounts (Student, Grievance Officer, Nodal Admin).
   - Test manual 10-digit phone number input, OTP generation, copy-paste, and verification.
   - Verify error handling on invalid OTP or incorrect mobile format.
4. **Data & Metrics Integrity**:
   - Verify that authentic grievance dockets load accurately into the home feed, search, and dashboard.
   - Confirm that resolution rate, pending scrutiny, and critical escalation statistics strictly calculate against real records.
5. **Session & Logout**: Test page refresh session retention and explicit sign out.
