export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { uploadToStorage } from '@/lib/0g-storage';

// Called after employer signs and derives encryption key client-side.
// Body: { company_id, compute_hash, computations: [{ employee_id, encrypted_salary, salary_iv, salary_key_hint }] }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { company_id, computations, compute_hash } = body;

  if (!company_id || !computations?.length) {
    return NextResponse.json({ error: 'company_id and computations required' }, { status: 400 });
  }

  const db = createServerClient();

  // Update each employee's encrypted salary
  const results = [];
  for (const comp of computations) {
    const { employee_id, encrypted_salary, salary_iv, salary_key_hint, employee_name } = comp;

    const { data, error } = await db
      .from('employees')
      .update({
        encrypted_salary,
        salary_iv,
        salary_key_hint,
        compute_hash: compute_hash || null,
        payroll_status: 'computed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', employee_id)
      .select()
      .single();

    if (!error) results.push(data);

    // Log each compute
    const storage = await uploadToStorage(
      { compute: { employee_id, status: 'sealed' } },
      'arcium-compute'
    );
    await db.from('storage_receipts').insert({
      company_id,
      action: `Arcium compute sealed: ${employee_name}`,
      category: 'compute',
      tx_hash: storage.txHash,
      data_size: storage.dataSize,
    });
  }

  // Summary log
  await db.from('agent_logs').insert({
    company_id,
    message: `Arcium Confidential Compute complete. ${results.length} salary(ies) encrypted and stored.`,
    type: 'success',
  });

  const storage = await uploadToStorage({ batch: { count: results.length, company_id } }, 'arcium-batch');
  await db.from('storage_receipts').insert({
    company_id,
    action: `Arcium compute batch complete - ${results.length} salaries encrypted`,
    category: 'compute',
    tx_hash: storage.txHash,
    data_size: storage.dataSize,
  });

  return NextResponse.json({ computed: results.length });
}

