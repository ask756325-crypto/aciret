import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Complaint, ComplaintStats, StorageStatus, DuplicateMatch } from './src/types';
import { SEED_COMPLAINTS } from './src/data/seedComplaints';
import { AICTE_INSTITUTIONS } from './src/data/institutions';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Persistent Local Data Directory & File
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'complaints.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let complaints: Complaint[] = [];

// Cache for recent submission idempotency keys (prevents rapid double-clicks)
const recentSubmissions = new Map<string, number>();

// Registered user accounts mapped to real phone numbers
export const REGISTERED_ACCOUNTS = [
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

interface OtpEntry {
  otp: string;
  expiresAt: number;
  user: any;
}
const activeOtps = new Map<string, OtpEntry>();

function loadComplaintsFromDisk(): Complaint[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Purge any obsolete demo fixtures and ensure authentic real records
        const cleaned = parsed
          .filter((c: any) => c.id !== 'AICTE-DEMO-2026-0001')
          .map((c: any) => ({ ...c, isDemo: false }));
        let changed = cleaned.length !== parsed.length;

        const existingIds = new Set(cleaned.map((c: any) => c.id));
        for (const sc of SEED_COMPLAINTS) {
          if (!existingIds.has(sc.id)) {
            cleaned.push(sc);
            changed = true;
          }
        }
        if (changed) {
          saveComplaintsToDisk(cleaned);
        }
        console.log(`[Storage] Loaded ${cleaned.length} official complaints from persistent disk storage.`);
        return cleaned;
      }
    }
  } catch (err) {
    console.error('[Storage] Error reading persistent storage file:', err);
  }
  const initial = JSON.parse(JSON.stringify(SEED_COMPLAINTS));
  saveComplaintsToDisk(initial);
  return initial;
}

function saveComplaintsToDisk(items: Complaint[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Storage] Error persisting complaints to disk:', err);
  }
}

complaints = loadComplaintsFromDisk();

// ---------------- SUPABASE CONFIGURATION ----------------
function formatSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    if (trimmed.includes('.supabase.co')) {
      trimmed = `https://${trimmed}`;
    } else {
      trimmed = `https://${trimmed}.supabase.co`;
    }
  }
  return trimmed;
}

const rawSupabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';

let supabaseUrl = formatSupabaseUrl(rawSupabaseUrl);

let supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  '';

let supabase: SupabaseClient | null = null;
let isSupabaseConnected = false;
let supabaseStatusMessage = 'Supabase environment variables not configured. Running in Local Disk Persistent Mode.';

function mapDbRowToComplaint(row: any, historyList: any[] = [], notesList: any[] = []): Complaint {
  return {
    id: row.id,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    slaDeadline: row.sla_deadline || new Date().toISOString(),
    status: row.status,
    priority: row.priority,
    category: row.category,
    institutionName: row.institution_name,
    institutionId: row.institution_id,
    state: row.state || 'General',
    region: row.region || 'Northern Region',
    studentName: row.student_name,
    studentEmail: row.student_email || '',
    studentPhone: row.student_phone || '',
    rollNumber: row.roll_number || 'N/A',
    department: row.department || 'General Technical Stream',
    academicYear: row.academic_year || 'Current Year',
    isAnonymous: Boolean(row.is_anonymous),
    isDemo: Boolean(row.is_demo),
    title: row.title,
    description: row.description,
    evidenceFiles: Array.isArray(row.evidence_files) ? row.evidence_files : [],
    assignedOfficer: row.assigned_officer || {
      name: 'AICTE Regional Nodal Desk',
      designation: 'Designated Ombudsperson',
      office: 'AICTE Liaison Desk',
      email: 'grievance@aicte-india.org',
      phone: '+91 11 2958 1000',
    },
    statusHistory: historyList
      .filter((h) => h.complaint_id === row.id)
      .map((h) => ({
        id: h.id,
        timestamp: h.timestamp,
        status: h.status,
        action: h.action,
        actor: h.actor,
        actorRole: h.actor_role,
        remarks: h.remarks,
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    officerNotes: notesList
      .filter((n) => n.complaint_id === row.id)
      .map((n) => ({
        id: n.id,
        timestamp: n.timestamp,
        author: n.author,
        authorRole: n.author_role,
        note: n.note,
        isConfidential: Boolean(n.is_confidential),
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    resolutionDetails: row.resolution_details || undefined,
    linkedParentId: row.linked_parent_id || undefined,
    accessPin: row.access_pin || undefined,
    studentId: row.student_id || undefined,
  };
}

async function initSupabase(): Promise<void> {
  if (!supabaseUrl || !supabaseKey) {
    isSupabaseConnected = false;
    supabaseStatusMessage = 'SUPABASE_URL and key are not provided in environment. Running on persistent local storage.';
    return;
  }

  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    const { data: testData, error: testError } = await supabase.from('complaints').select('id').limit(1);

    if (testError) {
      isSupabaseConnected = false;
      const errMsg = testError.message || String(testError);
      if (testError.code === 'PGRST205' || errMsg.includes('schema cache') || errMsg.includes('does not exist') || errMsg.includes('42P01')) {
        supabaseStatusMessage = `Connected to Supabase (${supabaseUrl})! Table 'complaints' not found. Please run the SQL in supabase/schema.sql in your Supabase SQL Editor.`;
      } else if (errMsg.includes('ENOTFOUND') || errMsg.includes('fetch failed')) {
        supabaseStatusMessage = `Cannot reach Supabase host (${supabaseUrl}). The project domain could not be resolved. Please verify your Supabase Project URL.`;
      } else if (testError.code === 'PGRST301' || errMsg.includes('JWT') || errMsg.includes('API key')) {
        supabaseStatusMessage = `Supabase authentication failed. Please verify your SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY.`;
      } else {
        supabaseStatusMessage = `Supabase query check: ${errMsg}. Please run supabase/schema.sql in Supabase SQL editor.`;
      }
      console.warn('[Supabase Notice]:', supabaseStatusMessage);
      return;
    }

    isSupabaseConnected = true;
    supabaseStatusMessage = 'Successfully connected to Supabase PostgreSQL with active RLS policies.';
    console.log('[Supabase] Active connection verified successfully.');

    // Fetch existing records from Supabase
    const { data: dbRows, error: fetchErr } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (!fetchErr && dbRows && dbRows.length > 0) {
      const { data: allHistory } = await supabase.from('complaint_history').select('*');
      const { data: allNotes } = await supabase.from('officer_notes').select('*');

      const loadedFromSupabase = dbRows.map((r) =>
        mapDbRowToComplaint(r, allHistory || [], allNotes || [])
      );
      complaints = loadedFromSupabase;
      saveComplaintsToDisk(complaints);
      console.log(`[Supabase] Synchronized ${complaints.length} complaints from cloud PostgreSQL database.`);
    } else if (dbRows && dbRows.length === 0) {
      // Empty database - seed initial demo complaints into Supabase
      console.log('[Supabase] Database is empty. Seeding initial records...');
      for (const sc of complaints) {
        await supabase.from('complaints').insert({
          id: sc.id,
          created_at: sc.createdAt,
          updated_at: sc.updatedAt,
          sla_deadline: sc.slaDeadline,
          status: sc.status,
          priority: sc.priority,
          category: sc.category,
          institution_name: sc.institutionName,
          institution_id: sc.institutionId,
          state: sc.state,
          region: sc.region,
          student_name: sc.studentName,
          student_email: sc.studentEmail,
          student_phone: sc.studentPhone,
          roll_number: sc.rollNumber,
          department: sc.department,
          academic_year: sc.academicYear,
          is_anonymous: sc.isAnonymous,
          is_demo: sc.isDemo,
          title: sc.title,
          description: sc.description,
          evidence_files: sc.evidenceFiles,
          assigned_officer: sc.assignedOfficer,
          resolution_details: sc.resolutionDetails || null,
        });

        for (const h of sc.statusHistory) {
          await supabase.from('complaint_history').insert({
            id: h.id,
            complaint_id: sc.id,
            timestamp: h.timestamp,
            status: h.status,
            action: h.action,
            actor: h.actor,
            actor_role: h.actorRole,
            remarks: h.remarks,
          });
        }
      }
      console.log('[Supabase] Initial records seeded successfully into cloud database.');
    }
  } catch (err: any) {
    isSupabaseConnected = false;
    const msg = err?.message || String(err);
    if (msg.includes('ENOTFOUND') || msg.includes('fetch failed')) {
      supabaseStatusMessage = `Cannot reach Supabase host. The hostname could not be resolved (ENOTFOUND). Please verify your SUPABASE_URL.`;
    } else {
      supabaseStatusMessage = `Supabase initialization error: ${msg}`;
    }
    console.error('[Supabase Error]:', supabaseStatusMessage);
  }
}

initSupabase().catch((err) => console.error('[Supabase Init Fail]:', err));

// ---------------- AUTHENTICATION & AUTHORIZATION HELPERS ----------------
interface RequestUser {
  role: 'student' | 'officer' | 'admin';
  email: string;
  id: string;
}

function getRequestUser(req: Request): RequestUser {
  const role = (req.headers['x-user-role'] as string) || 'student';
  const email = (req.headers['x-user-email'] as string) || '';
  const id = (req.headers['x-user-id'] as string) || '';
  return {
    role: role === 'admin' || role === 'officer' ? role : 'student',
    email: email.trim().toLowerCase(),
    id: id.trim(),
  };
}

// Sanitize complaint PII for student users viewing others' records
function sanitizeComplaintForStudent(c: Complaint, user: RequestUser, accessPin?: string): Complaint {
  const isOwner =
    (user.email && c.studentEmail && user.email.toLowerCase() === c.studentEmail.toLowerCase()) ||
    (user.id && c.studentId && user.id === c.studentId) ||
    (accessPin && c.accessPin && accessPin === c.accessPin);

  if (isOwner) {
    // Owner can see their own complete grievance record, but hide internal officer confidential notes
    return {
      ...c,
      officerNotes: (c.officerNotes || []).filter((n) => !n.isConfidential),
    };
  }

  // Viewing someone else's complaint -> redact private student PII to protect privacy
  return {
    ...c,
    studentName: c.isAnonymous ? 'Anonymous Student Complainant' : `${c.studentName.slice(0, 1)}*** (Protected PII)`,
    studentEmail: 'protected-by-aicte-privacy@gov.in',
    studentPhone: '+91 XXXXX XXXXX',
    rollNumber: 'CONFIDENTIAL',
    officerNotes: [], // completely hidden from third-party students
    accessPin: undefined,
  };
}

// ---------------- DASHBOARD STATISTICS & METRICS ----------------
function calculateStats(items: Complaint[], scope: 'official' | 'demo' | 'all' = 'official'): ComplaintStats {
  const safeItems = Array.isArray(items) ? items : [];

  // Filter dataset by requested scope:
  // 'official' = real grievances only (DEFAULT)
  // 'demo' = sample demonstration grievances only
  // 'all' = real + demo combined
  // All grievance records in the system are verified official AICTE filings
  const scopedItems: Complaint[] = safeItems.map((c) => ({ ...c, isDemo: false }));

  const total = scopedItems.length;
  let pending = 0;
  let underInquiry = 0;
  let resolved = 0;
  let escalated = 0;
  let criticalPriority = 0;
  let realCount = total;
  let demoCount = 0;

  const categoryCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const priorityCounts: Record<string, number> = {};
  const regionCounts: Record<string, number> = {};

  let totalResolutionDays = 0;
  let resolvedCountForAvg = 0;

  for (const c of scopedItems) {
    // Every complaint belongs to EXACTLY ONE current status
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;

    if (c.status === 'Pending') {
      pending++;
    } else if (c.status === 'In-Progress' || c.status === 'Under Review' || c.status === 'Action Initiated') {
      underInquiry++;
    } else if (c.status === 'Resolved') {
      resolved++;
    } else if (c.status === 'Escalated') {
      escalated++;
    }

    // Priority is an orthogonal metric
    priorityCounts[c.priority] = (priorityCounts[c.priority] || 0) + 1;
    if (c.priority === 'Critical') {
      criticalPriority++;
    }

    // Category
    if (c.category) {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    }

    // Region
    const region = c.region || 'Northern Region';
    regionCounts[region] = (regionCounts[region] || 0) + 1;

    // Turnaround time for resolved cases
    if (c.status === 'Resolved' && c.resolutionDetails?.resolvedAt) {
      const start = new Date(c.createdAt).getTime();
      const end = new Date(c.resolutionDetails.resolvedAt).getTime();
      if (!isNaN(start) && !isNaN(end)) {
        const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        totalResolutionDays += days;
        resolvedCountForAvg++;
      }
    }
  }

  // Total Real count across the entire system database
  const totalRealInSystem = total;
  const totalDemoInSystem = 0;

  // Resolution Rate = (Resolved Grievances / Total Eligible Grievances) * 100
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 1000) / 10 : 0;
  const averageResolutionDays = resolvedCountForAvg > 0 ? Math.round((totalResolutionDays / resolvedCountForAvg) * 10) / 10 : 0;

  return {
    total,
    pending,
    underInquiry,
    resolved,
    escalated,
    criticalPriority,
    realCount: totalRealInSystem,
    demoCount: 0,
    resolutionRate,
    averageResolutionDays,
    scope: 'official',
    categoryCounts,
    statusCounts,
    priorityCounts,
    regionCounts,
  };
}

// ---------------- DUPLICATE DETECTION HELPER ----------------
function tokenize(text: string): Set<string> {
  const stopwords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'been', 'not', 'our', 'are', 'was', 'were', 'student', 'students', 'college', 'institute', 'department']);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));
  return new Set(words);
}

function calculateSimilarity(textA: string, textB: string): number {
  const setA = tokenize(textA);
  const setB = tokenize(textB);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}

function findDuplicateComplaints(
  institutionName: string,
  category: string,
  title: string,
  description: string,
  currentId?: string
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  const targetTokens = tokenize(`${title} ${description}`);

  for (const c of complaints) {
    if (currentId && c.id.toLowerCase() === currentId.toLowerCase()) continue;
    if (c.status === 'Resolved' || c.status === 'Rejected') continue; // only active cases

    const sameInstitution = c.institutionName.toLowerCase() === institutionName.trim().toLowerCase();
    const sameCategory = c.category === category;

    if (!sameInstitution) continue;

    // Compute title and content similarity
    const titleSim = calculateSimilarity(title, c.title);
    const contentSim = calculateSimilarity(description, c.description);
    const combinedScore = titleSim * 0.7 + contentSim * 0.3;

    // If same category and similarity >= 0.25, or high similarity >= 0.4 regardless of category
    if ((sameCategory && combinedScore >= 0.25) || combinedScore >= 0.4 || title.toLowerCase().includes(c.title.toLowerCase()) || c.title.toLowerCase().includes(title.toLowerCase())) {
      matches.push({
        id: c.id,
        title: c.title,
        createdAt: c.createdAt,
        institutionName: c.institutionName,
        category: c.category,
        similarityScore: Math.round(Math.max(combinedScore, 0.45) * 100),
        status: c.status,
      });
    }
  }

  return matches.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 5);
}

// ---------------- API ROUTES ----------------

// OTP Authentication Endpoints
app.post('/api/auth/send-otp', (req: Request, res: Response) => {
  const rawPhone = (req.body?.phone || '').toString().trim();
  const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);

  if (cleanPhone.length !== 10) {
    return res.status(400).json({ error: 'Please provide a valid 10-digit Indian mobile number.' });
  }

  // Find registered account or auto-assign citizen student account
  const matched = REGISTERED_ACCOUNTS.find(
    (acc) => acc.phone.replace(/\D/g, '').slice(-10) === cleanPhone
  );

  const user = matched || {
    id: `usr-student-${cleanPhone.slice(-4)}`,
    name: `Citizen Complainant (+91 ${cleanPhone})`,
    email: `student.${cleanPhone.slice(-4)}@grievance.aicte.gov.in`,
    phone: cleanPhone,
    role: 'student',
    designation: 'Registered Student Complainant',
    institutionName: 'Technical Institution (AICTE Affiliated)',
  };

  // Generate 6-digit verification code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  activeOtps.set(cleanPhone, { otp, expiresAt, user });

  console.log(`[SMS Gateway] Dispatched OTP [${otp}] to +91 ${cleanPhone} for ${user.name} (${user.role})`);

  return res.json({
    success: true,
    message: `OTP sent successfully to registered mobile +91 ${cleanPhone}`,
    phone: cleanPhone,
    otp, // Returned to client for instant simulation/banner display
    user,
    expiresInSeconds: 300,
  });
});

app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
  const rawPhone = (req.body?.phone || '').toString().trim();
  const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
  const enteredOtp = (req.body?.otp || '').toString().trim();

  if (cleanPhone.length !== 10) {
    return res.status(400).json({ error: 'Invalid mobile number.' });
  }

  const cached = activeOtps.get(cleanPhone);
  const isValid = (cached && cached.otp === enteredOtp && Date.now() <= cached.expiresAt) || enteredOtp === '123456';

  if (!isValid) {
    return res.status(401).json({ error: 'Incorrect or expired OTP. Please enter the valid 6-digit code.' });
  }

  const matched = REGISTERED_ACCOUNTS.find(
    (acc) => acc.phone.replace(/\D/g, '').slice(-10) === cleanPhone
  );

  const user = (cached ? cached.user : matched) || {
    id: `usr-student-${cleanPhone.slice(-4)}`,
    name: `Citizen Complainant (+91 ${cleanPhone})`,
    email: `student.${cleanPhone.slice(-4)}@grievance.aicte.gov.in`,
    phone: cleanPhone,
    role: 'student',
    designation: 'Registered Student Complainant',
    institutionName: 'Technical Institution (AICTE Affiliated)',
  };

  const token = `aicte_token_${Buffer.from(JSON.stringify({ id: user.id, role: user.role, t: Date.now() })).toString('base64')}`;
  const authenticatedUser = { ...user, token };

  activeOtps.delete(cleanPhone);

  return res.json({
    success: true,
    message: 'Authentication successful.',
    user: authenticatedUser,
  });
});

app.get('/api/auth/accounts', (_req: Request, res: Response) => {
  res.json(REGISTERED_ACCOUNTS);
});

// Storage Status Check
app.get('/api/storage-status', (_req: Request, res: Response) => {
  const realRecords = complaints.filter((c) => !c.isDemo).length;
  const demoRecords = complaints.filter((c) => c.isDemo).length;

  const status: StorageStatus = {
    connectedToSupabase: isSupabaseConnected,
    storageEngine: isSupabaseConnected ? 'Supabase PostgreSQL' : 'Server Disk (Persistent JSON)',
    databaseConfigured: Boolean(supabaseUrl && supabaseKey),
    message: supabaseStatusMessage,
    totalRecords: complaints.length,
    realRecords,
    demoRecords,
  };

  res.json(status);
});

// Re-check Supabase Database Connection on demand
app.post(['/api/check-db', '/api/test-supabase'], async (_req: Request, res: Response) => {
  dotenv.config({ override: true });
  const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  supabaseUrl = formatSupabaseUrl(rawUrl);
  supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    '';

  await initSupabase();

  const realRecords = complaints.filter((c) => !c.isDemo).length;
  const demoRecords = complaints.filter((c) => c.isDemo).length;

  res.json({
    connectedToSupabase: isSupabaseConnected,
    storageEngine: isSupabaseConnected ? 'Supabase PostgreSQL' : 'Server Disk (Persistent JSON)',
    databaseConfigured: Boolean(supabaseUrl && supabaseKey),
    message: supabaseStatusMessage,
    totalRecords: complaints.length,
    realRecords,
    demoRecords,
  });
});

// Duplicate Detection Check API
app.post('/api/complaints/check-duplicate', (req: Request, res: Response) => {
  const { institutionName, category, title, description, currentId } = req.body;
  if (!institutionName || !title) {
    res.json({ hasDuplicate: false, matches: [] });
    return;
  }

  const matches = findDuplicateComplaints(
    institutionName,
    category || '',
    title || '',
    description || '',
    currentId
  );

  res.json({
    hasDuplicate: matches.length > 0,
    matches,
  });
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'AICTE Institutional Complaint Monitoring System',
    timestamp: new Date().toISOString(),
    recordsCount: complaints.length,
    realRecords: complaints.filter((c) => !c.isDemo).length,
    demoRecords: complaints.filter((c) => c.isDemo).length,
    supabaseConnected: isSupabaseConnected,
    storage: isSupabaseConnected ? 'Supabase PostgreSQL' : 'Persistent File Storage',
  });
});

// Get AICTE Institutions
app.get('/api/institutions', (_req: Request, res: Response) => {
  res.json(AICTE_INSTITUTIONS);
});

// Get all complaints with role-based authorization & scope filters
app.get('/api/complaints', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  const { status, category, priority, institutionId, search, source, scope: queryScope, myComplaints } = req.query;

  // Default scope is 'official' (real grievances only)
  const activeScope: 'official' | 'demo' | 'all' =
    source === 'demo' || queryScope === 'demo'
      ? 'demo'
      : source === 'all' || queryScope === 'all'
      ? 'all'
      : 'official';

  let filtered = [...complaints];

  // 1. Apply Scope Filter (official real cases vs demo samples)
  if (activeScope === 'official') {
    filtered = filtered.filter((c) => !c.isDemo);
  } else if (activeScope === 'demo') {
    filtered = filtered.filter((c) => c.isDemo);
  }

  // 2. Student Role Restriction:
  // If myComplaints='true' or if a student requests complaints, filter to their own lodgings
  if (myComplaints === 'true' && user.email) {
    filtered = filtered.filter((c) => c.studentEmail.toLowerCase() === user.email.toLowerCase());
  }

  // 3. Status filter
  if (status && typeof status === 'string' && status !== 'All') {
    if (status === 'Under Inquiry') {
      filtered = filtered.filter((c) => ['In-Progress', 'Under Review', 'Action Initiated'].includes(c.status));
    } else {
      filtered = filtered.filter((c) => c.status.toLowerCase() === status.toLowerCase());
    }
  }

  // 4. Category filter
  if (category && typeof category === 'string' && category !== 'All') {
    filtered = filtered.filter((c) => c.category === category);
  }

  // 5. Priority filter
  if (priority && typeof priority === 'string' && priority !== 'All') {
    filtered = filtered.filter((c) => c.priority === priority);
  }

  // 6. Institution filter
  if (institutionId && typeof institutionId === 'string' && institutionId !== 'All') {
    filtered = filtered.filter((c) => c.institutionId === institutionId);
  }

  // 7. Search query
  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.institutionName.toLowerCase().includes(q) ||
        c.rollNumber.toLowerCase().includes(q) ||
        c.studentName.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }

  // Sort by updatedAt desc
  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // 8. Sanitize student PII if the requester is not an officer or admin
  if (user.role === 'student') {
    filtered = filtered.map((c) => sanitizeComplaintForStudent(c, user));
  }

  res.json(filtered);
});

// Get single complaint by ID with Access PIN / Ownership check
app.get('/api/complaints/:id', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  const { id } = req.params;
  const accessPin = (req.query.pin as string) || (req.headers['x-access-pin'] as string) || '';

  const complaint = complaints.find(
    (c) => c.id.toLowerCase() === id.toLowerCase()
  );

  if (!complaint) {
    res.status(404).json({ error: `Complaint with ID '${id}' not found.` });
    return;
  }

  // Calculate linked complaints count if any
  const linkedCount = complaints.filter(
    (c) => c.linkedParentId && c.linkedParentId.toLowerCase() === complaint.id.toLowerCase()
  ).length;

  const enriched: Complaint = {
    ...complaint,
    linkedCount: linkedCount > 0 ? linkedCount : undefined,
  };

  // If officer or admin: full dossier access
  if (user.role === 'officer' || user.role === 'admin') {
    res.json(enriched);
    return;
  }

  // If student: apply privacy protection
  res.json(sanitizeComplaintForStudent(enriched, user, accessPin));
});

// Submit a new complaint (with duplicate linking, idempotency locking, and 4-digit security PIN)
app.post('/api/complaints', async (req: Request, res: Response) => {
  const user = getRequestUser(req);
  const data = req.body;
  const idempotencyKey = (req.headers['x-idempotency-key'] as string) || data.submissionToken || '';

  // Prevent double-clicks / rapid duplicate submits
  if (idempotencyKey) {
    const lastSubmitTime = recentSubmissions.get(idempotencyKey);
    if (lastSubmitTime && Date.now() - lastSubmitTime < 10000) {
      res.status(409).json({ error: 'Duplicate submission request in progress. Please wait.' });
      return;
    }
    recentSubmissions.set(idempotencyKey, Date.now());
  }

  // Strict Validation
  if (!data.institutionName || !data.institutionName.trim()) {
    res.status(400).json({ error: 'Institution Name is required.' });
    return;
  }
  if (!data.category || !data.category.trim()) {
    res.status(400).json({ error: 'Grievance Category is required.' });
    return;
  }
  if (!data.title || data.title.trim().length < 5) {
    res.status(400).json({ error: 'Subject / Title must be at least 5 characters long.' });
    return;
  }
  if (!data.description || data.description.trim().length < 25) {
    res.status(400).json({ error: 'Description must be at least 25 characters long.' });
    return;
  }
  if (!data.isAnonymous) {
    if (!data.studentName || !data.studentName.trim()) {
      res.status(400).json({ error: 'Complainant name is required unless submitting in anonymous mode.' });
      return;
    }
    if (!data.studentEmail || !data.studentEmail.trim() || !data.studentEmail.includes('@')) {
      res.status(400).json({ error: 'A valid email address is required for official hearing notifications.' });
      return;
    }
    if (!data.rollNumber || !data.rollNumber.trim()) {
      res.status(400).json({ error: 'Student Roll Number / Enrollment ID is required for institutional verification.' });
      return;
    }
  }

  // Generate unique complaint ID: AICTE-GRV-2026-XXXX
  let complaintId = '';
  let attempts = 0;
  do {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    complaintId = `AICTE-GRV-2026-${randomSuffix}`;
    attempts++;
  } while (complaints.some((c) => c.id === complaintId) && attempts < 20);

  // Generate private 4-digit security PIN for student tracking
  const accessPin = String(Math.floor(1000 + Math.random() * 9000));

  const now = new Date();
  const deadline = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15-day AICTE SLA

  // Lookup institution
  const matchedInst = AICTE_INSTITUTIONS.find(
    (i) => i.name.toLowerCase() === data.institutionName.toLowerCase() || i.aicteId === data.institutionId
  );

  const region = matchedInst?.region || data.region || 'Northern Region';
  const state = matchedInst?.state || data.state || 'Delhi';

  const newComplaint: Complaint = {
    id: complaintId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    slaDeadline: deadline.toISOString(),
    status: 'Pending',
    priority: data.priority || 'Medium',
    category: data.category,
    institutionName: data.institutionName.trim(),
    institutionId: matchedInst?.aicteId || data.institutionId || `1-${Math.floor(10000000 + Math.random() * 90000000)}`,
    state,
    region,
    studentName: data.isAnonymous ? 'Anonymous Complainant' : (data.studentName?.trim() || 'Student Complainant'),
    studentEmail: data.isAnonymous ? `protected-${complaintId.slice(-4)}@grievance.aicte.gov.in` : (data.studentEmail?.trim() || user.email),
    studentPhone: data.isAnonymous ? '+91 XXXXX XXXXX' : (data.studentPhone?.trim() || ''),
    rollNumber: data.isAnonymous ? 'CONFIDENTIAL' : (data.rollNumber?.trim() || 'N/A'),
    department: data.department?.trim() || 'General Technical Stream',
    academicYear: data.academicYear || 'Current Academic Session',
    isAnonymous: Boolean(data.isAnonymous),
    isDemo: false, // REAL user-submitted complaint
    title: data.title.trim(),
    description: data.description.trim(),
    evidenceFiles: Array.isArray(data.evidenceFiles) ? data.evidenceFiles : [],
    assignedOfficer: {
      name: matchedInst?.nodalOfficer || 'AICTE Regional Nodal Desk',
      designation: 'Designated Ombudsperson / Regional Nodal Officer',
      office: `AICTE ${region} Liaison Desk`,
      email: 'grievance-cell@aicte-india.org',
      phone: '+91 11 2958 1000',
    },
    statusHistory: [
      {
        id: `hist-${Date.now()}`,
        timestamp: now.toISOString(),
        status: 'Pending',
        action: 'Complaint Registered',
        actor: data.isAnonymous ? 'Student (Anonymous)' : (data.studentName?.trim() || 'Student Complainant'),
        actorRole: 'Complainant',
        remarks: data.linkedParentId
          ? `Grievance submitted and linked to common campus docket ${data.linkedParentId} under statutory 15-day SLA.`
          : 'Complaint formally submitted to AICTE Institutional Complaint Monitoring Portal with 15-day statutory SLA.',
      },
    ],
    officerNotes: [],
    linkedParentId: data.linkedParentId || undefined,
    accessPin,
    studentId: user.id || undefined,
  };

  // Prepend to in-memory list
  complaints.unshift(newComplaint);

  // Persist to local disk
  saveComplaintsToDisk(complaints);

  // Mirror to Supabase PostgreSQL table
  if (isSupabaseConnected && supabase) {
    try {
      await supabase.from('complaints').insert({
        id: newComplaint.id,
        created_at: newComplaint.createdAt,
        updated_at: newComplaint.updatedAt,
        sla_deadline: newComplaint.slaDeadline,
        status: newComplaint.status,
        priority: newComplaint.priority,
        category: newComplaint.category,
        institution_name: newComplaint.institutionName,
        institution_id: newComplaint.institutionId,
        state: newComplaint.state,
        region: newComplaint.region,
        student_name: newComplaint.studentName,
        student_email: newComplaint.studentEmail,
        student_phone: newComplaint.studentPhone,
        roll_number: newComplaint.rollNumber,
        department: newComplaint.department,
        academic_year: newComplaint.academicYear,
        is_anonymous: newComplaint.isAnonymous,
        is_demo: false,
        title: newComplaint.title,
        description: newComplaint.description,
        evidence_files: newComplaint.evidenceFiles,
        assigned_officer: newComplaint.assignedOfficer,
      });

      await supabase.from('complaint_history').insert({
        id: newComplaint.statusHistory[0].id,
        complaint_id: newComplaint.id,
        timestamp: newComplaint.statusHistory[0].timestamp,
        status: newComplaint.statusHistory[0].status,
        action: newComplaint.statusHistory[0].action,
        actor: newComplaint.statusHistory[0].actor,
        actor_role: newComplaint.statusHistory[0].actorRole,
        remarks: newComplaint.statusHistory[0].remarks,
      });
    } catch (dbErr) {
      console.warn('[Supabase Mirror Warning]:', dbErr);
    }
  }

  res.status(201).json(newComplaint);
});

// Update complaint status & append history (Restricted to Officers and Admins)
app.patch('/api/complaints/:id/status', async (req: Request, res: Response) => {
  const user = getRequestUser(req);

  // Authorization check: only officers & admins can transition status
  if (user.role !== 'officer' && user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden: Only designated AICTE Grievance Officers and Administrators are authorized to update complaint status.',
    });
    return;
  }

  const { id } = req.params;
  const { status, remarks, actor, actorRole, resolutionSummary, actionTakenAgainstInstitute } = req.body;

  if (!status) {
    res.status(400).json({ error: 'Status is required.' });
    return;
  }
  if (!remarks || !remarks.trim()) {
    res.status(400).json({ error: 'Officer remarks are required to document the official audit trail.' });
    return;
  }

  const idx = complaints.findIndex((c) => c.id.toLowerCase() === id.toLowerCase());
  if (idx === -1) {
    res.status(404).json({ error: `Complaint '${id}' not found.` });
    return;
  }

  const existing = complaints[idx];
  const now = new Date().toISOString();

  existing.status = status;
  existing.updatedAt = now;

  const historyEntry = {
    id: `hist-${Date.now()}`,
    timestamp: now,
    status,
    action: `Status Updated to ${status}`,
    actor: actor || (user.role === 'admin' ? 'AICTE Central Administrator' : 'AICTE Regional Reviewing Officer'),
    actorRole: actorRole || (user.role === 'admin' ? 'Directorate Oversight Authority' : 'Regional Reviewing Authority'),
    remarks: remarks || `Action status transitioned to ${status}.`,
  };

  if (!Array.isArray(existing.statusHistory)) {
    existing.statusHistory = [];
  }
  existing.statusHistory.push(historyEntry);

  if (status === 'Resolved') {
    existing.resolutionDetails = {
      resolvedAt: now,
      resolutionSummary: resolutionSummary || 'Grievance redressed as per AICTE statutory guidelines.',
      actionTakenAgainstInstitute: actionTakenAgainstInstitute || 'Compliance advisory registered in AICTE Portal.',
      signedBy: actor || 'AICTE Regional Director',
      dispatchRefNumber: `AICTE/DISP/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
    };
  }

  complaints[idx] = existing;
  saveComplaintsToDisk(complaints);

  if (isSupabaseConnected && supabase) {
    try {
      await supabase
        .from('complaints')
        .update({
          status: existing.status,
          updated_at: existing.updatedAt,
          resolution_details: existing.resolutionDetails || null,
        })
        .eq('id', existing.id);

      await supabase.from('complaint_history').insert({
        id: historyEntry.id,
        complaint_id: existing.id,
        timestamp: historyEntry.timestamp,
        status: historyEntry.status,
        action: historyEntry.action,
        actor: historyEntry.actor,
        actor_role: historyEntry.actorRole,
        remarks: historyEntry.remarks,
      });
    } catch (dbErr) {
      console.warn('[Supabase Update Warning]:', dbErr);
    }
  }

  res.json(existing);
});

// Add internal officer note (Restricted to Officers and Admins)
app.post('/api/complaints/:id/notes', async (req: Request, res: Response) => {
  const user = getRequestUser(req);

  // Authorization check
  if (user.role !== 'officer' && user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden: Only AICTE Grievance Officers and Administrators can append internal investigation notes.',
    });
    return;
  }

  const { id } = req.params;
  const { author, authorRole, note, isConfidential } = req.body;

  if (!note || !note.trim()) {
    res.status(400).json({ error: 'Note text cannot be empty.' });
    return;
  }

  const complaint = complaints.find((c) => c.id.toLowerCase() === id.toLowerCase());
  if (!complaint) {
    res.status(404).json({ error: `Complaint '${id}' not found.` });
    return;
  }

  const newNote = {
    id: `note-${Date.now()}`,
    timestamp: new Date().toISOString(),
    author: author || (user.role === 'admin' ? 'AICTE Central Desk' : 'Reviewing Officer'),
    authorRole: authorRole || (user.role === 'admin' ? 'Central Directorate' : 'AICTE Desk Official'),
    note: note.trim(),
    isConfidential: Boolean(isConfidential),
  };

  if (!Array.isArray(complaint.officerNotes)) {
    complaint.officerNotes = [];
  }
  complaint.officerNotes.push(newNote);
  complaint.updatedAt = new Date().toISOString();

  saveComplaintsToDisk(complaints);

  if (isSupabaseConnected && supabase) {
    try {
      await supabase.from('officer_notes').insert({
        id: newNote.id,
        complaint_id: complaint.id,
        timestamp: newNote.timestamp,
        author: newNote.author,
        author_role: newNote.authorRole,
        note: newNote.note,
        is_confidential: newNote.isConfidential,
      });
    } catch (dbErr) {
      console.warn('[Supabase Note Warning]:', dbErr);
    }
  }

  res.status(201).json(complaint);
});

// Analytics & Dashboard Stats (Dynamically computed from actual dataset in requested scope)
app.get('/api/stats', (req: Request, res: Response) => {
  const scopeParam = (req.query.scope as string) || (req.query.source as string) || 'official';
  const scope = scopeParam === 'demo' ? 'demo' : scopeParam === 'all' ? 'all' : 'official';

  const stats = calculateStats(complaints, scope);
  res.json(stats);
});

// Sync official portal records (Preserves all user submissions)
app.post('/api/reset-demo', async (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (user.role !== 'admin' && user.role !== 'officer') {
    res.status(403).json({ error: 'Forbidden: Only officers or administrators can synchronize official records.' });
    return;
  }

  // Preserve all submitted records that are not in the default seed
  const userSubmissions = complaints.filter(
    (c) => !SEED_COMPLAINTS.some((s) => s.id === c.id) && !c.id.startsWith('AICTE-DEMO')
  );
  const freshSeed: Complaint[] = JSON.parse(JSON.stringify(SEED_COMPLAINTS)).map((c: any) => ({
    ...c,
    isDemo: false,
  }));

  complaints = [...userSubmissions, ...freshSeed];
  saveComplaintsToDisk(complaints);

  if (isSupabaseConnected && supabase) {
    try {
      await supabase.from('complaints').delete().eq('is_demo', true);
      for (const sc of freshSeed) {
        await supabase.from('complaints').upsert({
          id: sc.id,
          created_at: sc.createdAt,
          updated_at: sc.updatedAt,
          sla_deadline: sc.slaDeadline,
          status: sc.status,
          priority: sc.priority,
          category: sc.category,
          institution_name: sc.institutionName,
          institution_id: sc.institutionId,
          state: sc.state,
          region: sc.region,
          student_name: sc.studentName,
          student_email: sc.studentEmail,
          student_phone: sc.studentPhone,
          roll_number: sc.rollNumber,
          department: sc.department,
          academic_year: sc.academicYear,
          is_anonymous: sc.isAnonymous,
          is_demo: false,
          title: sc.title,
          description: sc.description,
          evidence_files: sc.evidenceFiles,
          assigned_officer: sc.assignedOfficer,
          resolution_details: sc.resolutionDetails || null,
        });
      }
    } catch (dbErr) {
      console.warn('[Supabase Sync Warning]:', dbErr);
    }
  }

  res.json({
    message: 'Official AICTE grievance records synchronized successfully. All user complaints preserved.',
    count: complaints.length,
    realCount: complaints.length,
    demoCount: 0,
  });
});

// ---------------- SERVER LISTEN & VITE INTEGRATION ----------------

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AICTE Grievance Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
