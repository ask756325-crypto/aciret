-- ==============================================================================
-- AICTE Institutional Complaint Monitoring System (ICMS)
-- Database Schema & Row Level Security (RLS) Policies for Supabase (PostgreSQL)
-- ==============================================================================

-- Enable UUID extension if needed
create extension if not exists "uuid-ossp";

-- 1. Complaints Master Table
create table if not exists public.complaints (
    id text primary key, -- Format: AICTE-GRV-2026-XXXX
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    sla_deadline timestamptz not null,
    status text not null check (status in ('Pending', 'Under Review', 'In-Progress', 'Action Initiated', 'Resolved', 'Escalated', 'Rejected')),
    priority text not null check (priority in ('Critical', 'High', 'Medium', 'Low')),
    category text not null,
    institution_name text not null,
    institution_id text not null,
    state text not null default 'General',
    region text not null default 'Northern Region',
    student_name text not null,
    student_email text,
    student_phone text,
    roll_number text not null default 'N/A',
    department text default 'General Engineering',
    academic_year text default 'Current Year',
    is_anonymous boolean not null default false,
    is_demo boolean not null default false,
    title text not null,
    description text not null,
    evidence_files jsonb not null default '[]'::jsonb,
    assigned_officer jsonb not null default '{}'::jsonb,
    resolution_details jsonb
);

-- 2. Status History / Audit Trail Table
create table if not exists public.complaint_history (
    id text primary key,
    complaint_id text not null references public.complaints(id) on delete cascade,
    timestamp timestamptz not null default now(),
    status text not null,
    action text not null,
    actor text not null,
    actor_role text not null,
    remarks text not null
);

-- 3. Officer Action & Internal Notes Table
create table if not exists public.officer_notes (
    id text primary key,
    complaint_id text not null references public.complaints(id) on delete cascade,
    timestamp timestamptz not null default now(),
    author text not null,
    author_role text not null,
    note text not null,
    is_confidential boolean not null default false
);

-- Performance Indexes
create index if not exists idx_complaints_status on public.complaints(status);
create index if not exists idx_complaints_category on public.complaints(category);
create index if not exists idx_complaints_priority on public.complaints(priority);
create index if not exists idx_complaints_institution_id on public.complaints(institution_id);
create index if not exists idx_complaints_is_demo on public.complaints(is_demo);
create index if not exists idx_complaints_created_at on public.complaints(created_at desc);
create index if not exists idx_complaint_history_complaint on public.complaint_history(complaint_id);
create index if not exists idx_officer_notes_complaint on public.officer_notes(complaint_id);

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- ==============================================================================

alter table public.complaints enable row level security;
alter table public.complaint_history enable row level security;
alter table public.officer_notes enable row level security;

-- Policy 1: Anyone (students/public) can submit a complaint
drop policy if exists "Enable complaint submission for all users" on public.complaints;
create policy "Enable complaint submission for all users"
on public.complaints for insert
to anon, authenticated
with check (true);

-- Policy 2: Anyone can read complaints (or track complaint by ID)
drop policy if exists "Enable read access for all users" on public.complaints;
create policy "Enable read access for all users"
on public.complaints for select
to anon, authenticated
using (true);

-- Policy 3: Officers and system backend can update complaint status and details
drop policy if exists "Enable status updates for authorized roles" on public.complaints;
create policy "Enable status updates for authorized roles"
on public.complaints for update
to authenticated
using (true)
with check (true);

-- Policy 4: Public history read policy
drop policy if exists "Enable timeline view for all users" on public.complaint_history;
create policy "Enable timeline view for all users"
on public.complaint_history for select
to anon, authenticated
using (true);

-- Policy 5: History insertion by authenticated officers or backend
drop policy if exists "Enable history insert for logging" on public.complaint_history;
create policy "Enable history insert for logging"
on public.complaint_history for insert
to anon, authenticated
with check (true);

-- Policy 6: Public read non-confidential notes; authenticated can read all
drop policy if exists "Enable read for officer notes" on public.officer_notes;
create policy "Enable read for officer notes"
on public.officer_notes for select
to anon, authenticated
using (
    is_confidential = false 
    or (auth.role() = 'authenticated')
);

-- Policy 7: Officer notes insert
drop policy if exists "Enable note insert for officers" on public.officer_notes;
create policy "Enable note insert for officers"
on public.officer_notes for insert
to anon, authenticated
with check (true);

-- ==============================================================================
-- Trigger to keep updated_at in sync
-- ==============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_complaints_updated_at on public.complaints;
create trigger set_complaints_updated_at
before update on public.complaints
for each row
execute function public.handle_updated_at();
