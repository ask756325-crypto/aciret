import { Complaint, ComplaintStats, Institution, StorageStatus, DuplicateCheckResponse } from '../types';
import { SEED_COMPLAINTS } from '../data/seedComplaints';
import { AICTE_INSTITUTIONS } from '../data/institutions';
import { auth } from './auth';

const STORAGE_KEY = 'aicte_complaints_data_v2';

function getLocalData(): Complaint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('LocalStorage read error:', e);
  }
  return SEED_COMPLAINTS;
}

function saveLocalData(items: Complaint[]) {
  try {
    if (Array.isArray(items)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch (e) {
    console.error('LocalStorage save error:', e);
  }
}

function mergeIntoLocalData(newOrUpdatedItems: Complaint[]) {
  const current = getLocalData();
  const map = new Map<string, Complaint>();
  for (const item of current) {
    map.set(item.id.toLowerCase(), item);
  }
  for (const item of newOrUpdatedItems) {
    map.set(item.id.toLowerCase(), item);
  }
  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  saveLocalData(merged);
  return merged;
}

export const api = {
  async getStorageStatus(): Promise<StorageStatus> {
    try {
      const res = await fetch('/api/storage-status', {
        headers: auth.getAuthHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    const local = getLocalData();
    return {
      connectedToSupabase: false,
      storageEngine: 'Browser LocalStorage',
      databaseConfigured: false,
      message: 'Operating in client-side persistent storage mode.',
      totalRecords: local.length,
      realRecords: local.length,
      demoRecords: 0,
    };
  },

  async checkDatabase(): Promise<StorageStatus> {
    try {
      const res = await fetch('/api/check-db', {
        method: 'POST',
        headers: auth.getAuthHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return this.getStorageStatus();
  },

  async getInstitutions(): Promise<Institution[]> {
    try {
      const res = await fetch('/api/institutions');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return AICTE_INSTITUTIONS;
  },

  async getComplaints(filters?: {
    status?: string;
    category?: string;
    priority?: string;
    institutionId?: string;
    search?: string;
    source?: 'all' | 'real' | 'demo';
    scope?: 'official' | 'demo' | 'all';
    myComplaints?: boolean;
  }): Promise<Complaint[]> {
    try {
      const params = new URLSearchParams();
      // Default scope to official (real only)
      const activeScope = filters?.scope || (filters?.source === 'demo' ? 'demo' : filters?.source === 'all' ? 'all' : 'official');
      params.append('scope', activeScope);

      if (filters?.status && filters.status !== 'All') params.append('status', filters.status);
      if (filters?.category && filters.category !== 'All') params.append('category', filters.category);
      if (filters?.priority && filters.priority !== 'All') params.append('priority', filters.priority);
      if (filters?.institutionId && filters.institutionId !== 'All') params.append('institutionId', filters.institutionId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.myComplaints) params.append('myComplaints', 'true');

      const res = await fetch(`/api/complaints?${params.toString()}`, {
        headers: auth.getAuthHeaders(),
      });

      if (res.ok) {
        const data: Complaint[] = await res.json();
        const isUnfiltered =
          (!filters?.status || filters.status === 'All') &&
          (!filters?.category || filters.category === 'All') &&
          (!filters?.priority || filters.priority === 'All') &&
          (!filters?.search || filters.search.trim() === '') &&
          !filters?.myComplaints;

        if (isUnfiltered && activeScope === 'all') {
          saveLocalData(data);
        } else {
          mergeIntoLocalData(data);
        }
        return data;
      }
    } catch (err) {
      console.warn('API call failed, falling back to local storage cache', err);
    }

    // Fallback filter
    let items = getLocalData();
    const activeScope = filters?.scope || (filters?.source === 'demo' ? 'demo' : filters?.source === 'all' ? 'all' : 'official');
    if (activeScope === 'official') {
      items = items.filter((c) => !c.isDemo);
    } else if (activeScope === 'demo') {
      items = items.filter((c) => c.isDemo);
    }

    if (filters?.status && filters.status !== 'All') {
      if (filters.status === 'Under Inquiry') {
        items = items.filter((c) => ['In-Progress', 'Under Review', 'Action Initiated'].includes(c.status));
      } else {
        items = items.filter((c) => c.status.toLowerCase() === filters.status?.toLowerCase());
      }
    }
    if (filters?.category && filters.category !== 'All') {
      items = items.filter((c) => c.category === filters.category);
    }
    if (filters?.priority && filters.priority !== 'All') {
      items = items.filter((c) => c.priority === filters.priority);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.institutionName.toLowerCase().includes(q)
      );
    }
    return items;
  },

  async getComplaintById(id: string, pin?: string): Promise<Complaint | null> {
    try {
      const url = pin ? `/api/complaints/${encodeURIComponent(id)}?pin=${encodeURIComponent(pin)}` : `/api/complaints/${encodeURIComponent(id)}`;
      const res = await fetch(url, {
        headers: {
          ...auth.getAuthHeaders(),
          ...(pin ? { 'X-Access-Pin': pin } : {}),
        },
      });
      if (res.ok) {
        const complaint = await res.json();
        mergeIntoLocalData([complaint]);
        return complaint;
      }
    } catch {
      // fallback
    }
    const items = getLocalData();
    return items.find((c) => c.id.toLowerCase() === id.toLowerCase()) || null;
  },

  async checkDuplicate(params: {
    institutionName: string;
    category?: string;
    title: string;
    description: string;
    currentId?: string;
  }): Promise<DuplicateCheckResponse> {
    try {
      const res = await fetch('/api/complaints/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeaders(),
        },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // ignore
    }
    return { hasDuplicate: false, matches: [] };
  },

  async createComplaint(payload: Partial<Complaint> & { submissionToken?: string }): Promise<Complaint> {
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeaders(),
          ...(payload.submissionToken ? { 'X-Idempotency-Key': payload.submissionToken } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        mergeIntoLocalData([created]);
        return created;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server rejected submission (${res.status})`);
      }
    } catch (err: any) {
      console.error('Complaint creation error:', err);
      throw err;
    }
  },

  async updateComplaintStatus(
    id: string,
    params: {
      status: string;
      remarks: string;
      actor: string;
      actorRole: string;
      resolutionSummary?: string;
      actionTakenAgainstInstitute?: string;
    }
  ): Promise<Complaint> {
    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeaders(),
      },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const updated = await res.json();
      mergeIntoLocalData([updated]);
      return updated;
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to update status (${res.status})`);
    }
  },

  async addOfficerNote(
    id: string,
    params: { author: string; authorRole: string; note: string; isConfidential: boolean }
  ): Promise<Complaint> {
    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.getAuthHeaders(),
      },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const updated = await res.json();
      mergeIntoLocalData([updated]);
      return updated;
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to add note (${res.status})`);
    }
  },

  async getStats(scope: 'official' | 'demo' | 'all' = 'official'): Promise<ComplaintStats> {
    try {
      const res = await fetch(`/api/stats?scope=${scope}`, {
        headers: auth.getAuthHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const items = getLocalData();
    let scoped = items;
    if (scope === 'official') scoped = items.filter((c) => !c.isDemo);
    else if (scope === 'demo') scoped = items.filter((c) => c.isDemo);

    const total = scoped.length;
    let pending = 0;
    let underInquiry = 0;
    let resolved = 0;
    let escalated = 0;
    let criticalPriority = 0;
    const categoryCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    const regionCounts: Record<string, number> = {};

    for (const c of scoped) {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
      if (c.status === 'Pending') pending++;
      else if (['In-Progress', 'Under Review', 'Action Initiated'].includes(c.status)) underInquiry++;
      else if (c.status === 'Resolved') resolved++;
      else if (c.status === 'Escalated') escalated++;

      priorityCounts[c.priority] = (priorityCounts[c.priority] || 0) + 1;
      if (c.priority === 'Critical') criticalPriority++;

      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
      const reg = c.region || 'Northern Region';
      regionCounts[reg] = (regionCounts[reg] || 0) + 1;
    }

    return {
      total,
      pending,
      underInquiry,
      resolved,
      escalated,
      criticalPriority,
      realCount: total,
      demoCount: 0,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 1000) / 10 : 0,
      averageResolutionDays: 6.5,
      scope: 'official',
      categoryCounts,
      statusCounts,
      priorityCounts,
      regionCounts,
    };
  },

  async resetDemo(): Promise<void> {
    const res = await fetch('/api/reset-demo', {
      method: 'POST',
      headers: auth.getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reset demo records');
    }
    const full = await fetch('/api/complaints?scope=all', { headers: auth.getAuthHeaders() });
    if (full.ok) {
      const data = await full.json();
      saveLocalData(data);
    }
  },
};
