export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { uploadToStorage } from '@/lib/0g-storage';

// Called after employer has executed the on-chain transfer via viem.
// Body: { company_id, payments: [{ employee_id, employee_name, amount, tx_hash, from_wallet, to_wallet }] }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { company_id, payments } = body;

  if (!company_id || !payments?.length) {
    return NextResponse.json({ error: 'company_id and payments required' }, { status: 400 });
  }

  const db = createServerClient();
  const results = [];

  for (const payment of payments) {
    const { employee_id, employee_name, amount, tx_hash, from_wallet, to_wallet } = payment;

    // Record the receipt
    const { data: receipt } = await db
      .from('payroll_receipts')
      .insert({
        employee_id,
        company_id,
        employee_name,
        amount,
        tx_hash,
        from_wallet,
        to_wallet,
        status: tx_hash ? 'success' : 'failed',
        week_start: getMondayOfCurrentWeek(),
      })
      .select()
      .single();

    if (receipt) results.push(receipt);

    // Mark employee as paid
    if (tx_hash) {
      await db
        .from('employees')
        .update({ payroll_status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', employee_id);
    }

    // Log storage
    const storage = await uploadToStorage(
      { payment: { employee_id, amount, tx_hash } },
      'payroll-receipt'
    );
    await db.from('storage_receipts').insert({
      company_id,
      action: `Salary paid: ${employee_name} - ${amount.toFixed(4)} 0G`,
      category: 'payroll',
      tx_hash: storage.txHash,
      data_size: storage.dataSize,
    });

    await db.from('agent_logs').insert({
      company_id,
      message: `Payment sent to ${employee_name} - TX: ${tx_hash?.slice(0, 18)}...`,
      type: tx_hash ? 'success' : 'error',
    });
  }

  // Summary
  const totalPaid = payments.reduce((s: number, p: any) => s + p.amount, 0);
  await db.from('agent_logs').insert({
    company_id,
    message: `Autonomous Payroll Execution Complete. ${results.length} payments. Total: ${totalPaid.toFixed(4)} 0G`,
    type: 'success',
  });

  return NextResponse.json({ receipts: results });
}

function getMondayOfCurrentWeek(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

