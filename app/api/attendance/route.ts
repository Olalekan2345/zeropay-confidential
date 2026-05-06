export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { uploadToStorage } from '@/lib/0g-storage';
import { computePayableHours } from '@/lib/payroll';

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('company_id');
  const employeeId = req.nextUrl.searchParams.get('employee_id');

  const db = createServerClient();
  let query = db.from('attendance').select('*').order('date', { ascending: false });

  if (companyId) query = query.eq('company_id', companyId);
  if (employeeId) query = query.eq('employee_id', employeeId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attendance: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, employee_id, company_id, employee_name } = body;

  if (!action || !employee_id || !company_id) {
    return NextResponse.json({ error: 'action, employee_id, company_id required' }, { status: 400 });
  }

  const db = createServerClient();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  if (action === 'clock_in') {
    const { data: existing } = await db
      .from('attendance')
      .select('*')
      .eq('employee_id', employee_id)
      .eq('date', today)
      .single();

    // Already clocked in and not yet clocked out — prevent double clock-in
    if (existing?.clock_in && !existing?.clock_out) {
      return NextResponse.json({ error: 'Already clocked in' }, { status: 400 });
    }

    // Re-clock-in after a previous clock-out: reset clock_in/clock_out, keep accumulated hours
    const { data, error } = await db
      .from('attendance')
      .upsert({
        employee_id,
        company_id,
        date: today,
        clock_in: now,
        clock_out: null,
        payable_hours: existing?.payable_hours ?? 0,
        updated_at: now,
      }, { onConflict: 'employee_id,date' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If employee was paid, reset to pending so new hours can be computed and paid again
    await db
      .from('employees')
      .update({
        payroll_status: 'pending',
        weekly_hours: 0,
        encrypted_salary: null,
        salary_iv: null,
        compute_hash: null,
        updated_at: now,
      })
      .eq('id', employee_id)
      .eq('payroll_status', 'paid');

    // Log
    const storage = await uploadToStorage({ attendance: data }, 'clock-in');
    await db.from('storage_receipts').insert({
      company_id,
      action: `Clock-in: ${employee_name} at ${new Date(now).toLocaleTimeString()}`,
      category: 'attendance',
      tx_hash: storage.txHash,
      data_size: storage.dataSize,
    });
    await db.from('agent_logs').insert({
      company_id,
      message: `${employee_name} clocked in at ${new Date(now).toLocaleTimeString()}`,
      type: 'info',
    });

    return NextResponse.json({ record: data });
  }

  if (action === 'clock_out') {
    const { data: existing, error: fetchErr } = await db
      .from('attendance')
      .select('*')
      .eq('employee_id', employee_id)
      .eq('date', today)
      .single();

    if (fetchErr || !existing?.clock_in) {
      return NextResponse.json({ error: 'No clock-in found for today' }, { status: 400 });
    }
    if (existing.clock_out) {
      return NextResponse.json({ error: 'Already clocked out today' }, { status: 400 });
    }

    // Accumulate: add this session's hours to any hours already logged today
    const sessionHours = computePayableHours(existing.clock_in, now);
    const accumulatedHours = (existing.payable_hours || 0) + sessionHours;
    // Cap total at 8h regardless of how many sessions
    const payableHours = Math.min(accumulatedHours, 8);

    const { data, error } = await db
      .from('attendance')
      .update({ clock_out: now, payable_hours: payableHours, updated_at: now })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Recompute weekly hours
    const monday = getMondayOfCurrentWeek();
    const { data: weekAttendance } = await db
      .from('attendance')
      .select('payable_hours')
      .eq('employee_id', employee_id)
      .gte('date', monday);

    const weeklyHours = (weekAttendance || []).reduce((s, r) => s + (r.payable_hours || 0), 0);

    await db
      .from('employees')
      .update({ weekly_hours: weeklyHours, updated_at: now })
      .eq('id', employee_id);

    // Log
    const storage = await uploadToStorage({ attendance: data, weeklyHours }, 'clock-out');
    await db.from('storage_receipts').insert({
      company_id,
      action: `Clock-out: ${employee_name} - ${payableHours.toFixed(2)}h payable`,
      category: 'attendance',
      tx_hash: storage.txHash,
      data_size: storage.dataSize,
    });
    await db.from('agent_logs').insert({
      company_id,
      message: `${employee_name} clocked out. ${payableHours.toFixed(2)}h payable. Weekly total: ${weeklyHours.toFixed(2)}h`,
      type: 'info',
    });

    return NextResponse.json({ record: data, weeklyHours });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

function getMondayOfCurrentWeek(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

