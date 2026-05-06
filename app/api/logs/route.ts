export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('company_id');
  const type = req.nextUrl.searchParams.get('type'); // 'storage' | 'agent'
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

  if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 });

  const db = createServerClient();

  if (type === 'storage') {
    const { data, error } = await db
      .from('storage_receipts')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ receipts: data });
  }

  const { data, error } = await db
    .from('agent_logs')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data });
}

