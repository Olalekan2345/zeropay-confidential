import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy browser client — initialized on first access to avoid build-time env var requirement
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase env vars not set. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
    _supabase = createClient(url, key, { realtime: { params: { eventsPerSecond: 10 } } });
  }
  return _supabase;
}

// Backwards-compat named export — lazy proxy
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});

// Server client (uses service role key — bypasses RLS, server-side only)
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server env vars not set. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local');
  return createClient(url, key, { auth: { persistSession: false } });
}

export type Database = {
  companies: {
    id: string;
    wallet_address: string;
    name: string;
    industry: string | null;
    size: string | null;
    auto_pay_enabled: boolean;
    created_at: string;
    updated_at: string;
  };
  employees: {
    id: string;
    company_id: string;
    name: string;
    email: string;
    wallet_address: string | null;
    hourly_rate: number;
    department: string;
    role: string;
    onboarding_id: string;
    invite_status: 'pending' | 'sent' | 'accepted';
    invite_sent_at: string | null;
    payroll_status: 'pending' | 'computed' | 'paid';
    weekly_hours: number;
    encrypted_salary: string | null;
    salary_iv: string | null;
    salary_key_hint: string | null;
    compute_hash: string | null;
    registered_at: string;
    updated_at: string;
  };
  attendance: {
    id: string;
    employee_id: string;
    company_id: string;
    date: string;
    clock_in: string | null;
    clock_out: string | null;
    payable_hours: number;
    created_at: string;
    updated_at: string;
  };
  payroll_receipts: {
    id: string;
    employee_id: string;
    company_id: string;
    employee_name: string;
    amount: number;
    tx_hash: string | null;
    from_wallet: string | null;
    to_wallet: string | null;
    status: 'pending' | 'success' | 'failed';
    week_start: string | null;
    created_at: string;
  };
  storage_receipts: {
    id: string;
    company_id: string;
    action: string;
    category: 'employee' | 'attendance' | 'payroll' | 'compute' | 'system';
    tx_hash: string | null;
    data_size: string | null;
    status: string;
    created_at: string;
  };
  agent_logs: {
    id: string;
    company_id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    created_at: string;
  };
};
