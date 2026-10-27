export type ComplaintStatus =
  | 'Pending'
  | 'Under Review'
  | 'In-Progress'
  | 'Action Initiated'
  | 'Resolved'
  | 'Escalated'
  | 'Rejected';

export type ComplaintPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type PortalTab = 'dashboard' | 'lodge' | 'track' | 'analytics' | 'regulations';

export type ComplaintCategory =
  | 'Ragging & Harassment'
  | 'Fee & Financial Irregularity'
  | 'Infrastructure & Facilities'
  | 'Faculty & Academic Standards'
  | 'Examination & Evaluation'
  | 'Scholarship & DBT Disbursement'
  | 'Admission & Certificate Withholding'
  | 'Discrimination & Grievance Cell';

export type UserRole = 'student' | 'officer' | 'admin';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  designation?: string;
  institutionId?: string;
  institutionName?: string;
  rollNumber?: string;
  token?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  status: ComplaintStatus;
  action: string;
  actor: string;
  actorRole: string;
  remarks: string;
}

export interface OfficerNote {
  id: string;
  timestamp: string;
  author: string;
  authorRole: string;
  note: string;
  isConfidential: boolean;
}

export interface EvidenceFile {
  name: string;
  size: string;
  type: string;
}

export interface AssignedOfficer {
  name: string;
  designation: string;
  office: string;
  email: string;
  phone: string;
}

export interface ResolutionDetails {
  resolvedAt: string;
  resolutionSummary: string;
  actionTakenAgainstInstitute: string;
  signedBy: string;
  dispatchRefNumber: string;
}

export interface Complaint {
  id: string; // e.g. AICTE-GRV-2026-8492
  createdAt: string;
  updatedAt: string;
  slaDeadline: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  category: ComplaintCategory;
  institutionName: string;
  institutionId: string; // AICTE Permanent ID
  state: string;
  region: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  rollNumber: string;
  department: string;
  academicYear: string;
  isAnonymous: boolean;
  isDemo: boolean;
  title: string;
  description: string;
  evidenceFiles: EvidenceFile[];
  assignedOfficer: AssignedOfficer;
  statusHistory: TimelineEvent[];
  officerNotes: OfficerNote[];
  resolutionDetails?: ResolutionDetails;
  linkedParentId?: string; // If linked to common campus issue
  linkedCount?: number;
  accessPin?: string; // 4-digit security PIN for private student access
  studentId?: string;
}

export interface Institution {
  id: string;
  name: string;
  aicteId: string;
  state: string;
  region: string;
  city: string;
  nodalOfficer: string;
}

export interface ComplaintStats {
  total: number;
  pending: number;
  underInquiry: number; // In-Progress, Under Review, Action Initiated
  resolved: number;
  escalated: number; // Distinct status metric
  criticalPriority: number; // Distinct priority metric
  realCount: number;
  demoCount: number;
  resolutionRate: number; // percentage (0-100)
  averageResolutionDays: number;
  scope: 'official' | 'demo' | 'all';
  categoryCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  regionCounts: Record<string, number>;
}

export interface StorageStatus {
  connectedToSupabase: boolean;
  storageEngine: 'Supabase PostgreSQL' | 'Server Disk (Persistent JSON)' | 'Browser LocalStorage';
  databaseConfigured: boolean;
  message: string;
  diagnosticHint?: string;
  projectUrl?: string;
  totalRecords: number;
  realRecords: number;
  demoRecords: number;
}

export interface DuplicateMatch {
  id: string;
  title: string;
  createdAt: string;
  institutionName: string;
  category: ComplaintCategory;
  similarityScore: number;
  status: ComplaintStatus;
}

export interface DuplicateCheckResponse {
  hasDuplicate: boolean;
  matches: DuplicateMatch[];
}
