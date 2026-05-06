export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('company_id');
  const employeeId = req.nextUrl.searchParams.get('employee_id');

  const db = createServerClient();
  let query = db
    .from('payroll_receipts')
    .select('*')
    .order('created_at', { ascending: false });

  if (companyId) query = query.eq('company_id', companyId);
  if (employeeId) query = query.eq('employee_id', employeeId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ receipts: data });
}

