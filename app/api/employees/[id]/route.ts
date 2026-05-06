export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/employees/[id] — fetch employee by onboarding_id OR uuid
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = createServerClient();
  const { id } = params;

  // Try onboarding_id first (for invite links)
  let { data, error } = await db
    .from('employees')
    .select('*, companies(name, industry)')
    .eq('onboarding_id', id)
    .single();

  // Fallback to UUID
  if (!data || error) {
    ({ data, error } = await db
      .from('employees')
      .select('*, companies(name, industry)')
      .eq('id', id)
      .single());
  }

  if (error || !data) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  return NextResponse.json({ employee: data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const db = createServerClient();

  const { data, error } = await db
    .from('employees')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ employee: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = createServerClient();
  const { error } = await db.from('employees').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
