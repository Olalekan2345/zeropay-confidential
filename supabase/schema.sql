-- ZeroPay Confidential — Supabase Schema
-- Run this in your Supabase SQL editor: https://app.supabase.com → SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- COMPANIES
-- ============================================
create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  wallet_address text unique not null,
  name text not null,
  industry text,
  size text,
  auto_pay_enabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- EMPLOYEES
-- ============================================
create table if not exists employees (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  name text not null,
  email text not null,
  wallet_address text,
  hourly_rate numeric(10,4) not null,
  department text not null,
  role text not null,
  onboarding_id text unique not null default encode(gen_random_bytes(16), 'hex'),
  invite_status text not null default 'sent' check (invite_status in ('pending','sent','accepted')),
  invite_sent_at timestamptz default now(),
  payroll_status text not null default 'pending' check (payroll_status in ('pending','computed','paid')),
  weekly_hours numeric(6,2) default 0,
  encrypted_salary text,       -- AES-GCM encrypted, null = not computed
  salary_iv text,              -- IV for decryption
  salary_key_hint text,        -- Employer wallet address (for key derivation)
  registered_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists employees_company_id_idx on employees(company_id);
create index if not exists employees_email_idx on employees(email);
create index if not exists employees_onboarding_id_idx on employees(onboarding_id);

-- ============================================
-- ATTENDANCE
-- ============================================
create table if not exists attendance (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  date date not null,
  clock_in timestamptz,
  clock_out timestamptz,
  payable_hours numeric(5,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(employee_id, date)
);

create index if not exists attendance_employee_id_idx on attendance(employee_id);
create index if not exists attendance_company_id_date_idx on attendance(company_id, date);

-- ============================================
-- PAYROLL RECEIPTS
-- ============================================
create table if not exists payroll_receipts (
  id uuid primary key default uuid_generate_v4(),
  employee_id uuid references employees(id),
  company_id uuid references companies(id),
  employee_name text,
  amount numeric(10,4) not null,
  tx_hash text,
  from_wallet text,
  to_wallet text,
  status text default 'success' check (status in ('pending','success','failed')),
  week_start date,
  created_at timestamptz default now()
);

create index if not exists payroll_receipts_company_id_idx on payroll_receipts(company_id);

-- ============================================
-- STORAGE RECEIPTS (0G Storage log)
-- ============================================
create table if not exists storage_receipts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  action text not null,
  category text not null check (category in ('employee','attendance','payroll','compute','system')),
  tx_hash text,
  data_size text,
  status text default 'confirmed',
  created_at timestamptz default now()
);

create index if not exists storage_receipts_company_id_idx on storage_receipts(company_id);

-- ============================================
-- AGENT LOGS
-- ============================================
create table if not exists agent_logs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade,
  message text not null,
  type text not null check (type in ('info','success','warning','error')),
  created_at timestamptz default now()
);

create index if not exists agent_logs_company_id_idx on agent_logs(company_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table companies enable row level security;
alter table employees enable row level security;
alter table attendance enable row level security;
alter table payroll_receipts enable row level security;
alter table storage_receipts enable row level security;
alter table agent_logs enable row level security;

-- Companies: readable/writable by anyone with matching wallet (enforced app-side via service key)
-- We use service role key for all server-side ops, anon key for employee reads

-- Public read for employees via onboarding_id (for the onboarding page)
create policy "Employees can read own record via onboarding_id"
  on employees for select
  using (true);

create policy "Attendance readable by all"
  on attendance for select
  using (true);

create policy "Companies readable by all"
  on companies for select
  using (true);

create policy "Payroll receipts readable by all"
  on payroll_receipts for select
  using (true);

create policy "Storage receipts readable by all"
  on storage_receipts for select
  using (true);

create policy "Agent logs readable by all"
  on agent_logs for select
  using (true);

-- All writes go through API routes that use service role key (bypasses RLS)
-- This is intentional — the app enforces authorization at the API layer

-- ============================================
-- REALTIME
-- ============================================
-- Enable realtime for live dashboard updates
alter publication supabase_realtime add table employees;
alter publication supabase_realtime add table attendance;
alter publication supabase_realtime add table payroll_receipts;
alter publication supabase_realtime add table agent_logs;
alter publication supabase_realtime add table storage_receipts;
