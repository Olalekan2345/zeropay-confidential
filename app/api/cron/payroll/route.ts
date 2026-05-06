export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { galileoTestnet } from '@/lib/wagmi';
import { BATCH_CONTRACT_ADDRESS, BATCH_PAY_ABI, buildBatchPayArgs } from '@/lib/batch-pay';
import { BrevoClient } from '@getbrevo/brevo';

export async function GET(req: NextRequest) {
  // Vercel automatically sends CRON_SECRET as Bearer token
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const signerKey = process.env.PAYROLL_SIGNER_PRIVATE_KEY;
  if (!signerKey) {
    return NextResponse.json({ error: 'PAYROLL_SIGNER_PRIVATE_KEY not set' }, { status: 500 });
  }

  const db = createServerClient();

  // Fetch all companies with auto-pay enabled
  const { data: companies, error: compErr } = await db
    .from('companies')
    .select('*')
    .eq('auto_pay_enabled', true);

  if (compErr || !companies?.length) {
    return NextResponse.json({ message: 'No companies with auto-pay enabled', companies: [] });
  }

  const account = privateKeyToAccount(signerKey as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: galileoTestnet,
    transport: http('https://evmrpc-testnet.0g.ai'),
  });

  const results = [];

  for (const company of companies) {
    try {
      // Get all eligible employees (onboarded, unpaid, have hours, have wallet)
      const { data: employees } = await db
        .from('employees')
        .select('*')
        .eq('company_id', company.id)
        .eq('invite_status', 'accepted')
        .neq('payroll_status', 'paid')
        .not('wallet_address', 'is', null);

      const eligible = (employees || []).filter(e => parseFloat(e.weekly_hours) > 0);

      if (!eligible.length) {
        await db.from('agent_logs').insert({
          company_id: company.id,
          message: 'Autonomous Payroll: No eligible employees with hours this week. Skipping.',
          type: 'info',
        });
        results.push({ company: company.name, skipped: true });
        continue;
      }

      // Build payment args
      const payments = eligible.map(e => ({
        wallet: e.wallet_address as string,
        amount: parseFloat(e.weekly_hours) * parseFloat(e.hourly_rate),
      }));

      const { recipients, amounts, total } = buildBatchPayArgs(payments);

      await db.from('agent_logs').insert({
        company_id: company.id,
        message: `Autonomous Payroll Agent: Executing payment for ${eligible.length} employee(s). Total: ${(Number(total) / 1e18).toFixed(4)} 0G`,
        type: 'info',
      });

      // Execute on-chain batch payment
      const txHash = await walletClient.writeContract({
        address: BATCH_CONTRACT_ADDRESS,
        abi: BATCH_PAY_ABI,
        functionName: 'batchPay',
        args: [recipients, amounts],
        value: total,
        chain: galileoTestnet,
      });

      // Record each receipt and mark employee paid
      for (let i = 0; i < eligible.length; i++) {
        const emp = eligible[i];
        const amount = payments[i].amount;

        await db.from('payroll_receipts').insert({
          employee_id: emp.id,
          company_id: company.id,
          employee_name: emp.name,
          amount,
          tx_hash: txHash,
          from_wallet: account.address,
          to_wallet: emp.wallet_address,
          status: 'success',
          week_start: getMondayOfCurrentWeek(),
        });

        await db.from('employees')
          .update({
            payroll_status: 'pending',
            weekly_hours: 0,
            encrypted_salary: null,
            salary_iv: null,
            compute_hash: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', emp.id);
      }

      // Success log
      const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
      await db.from('agent_logs').insert({
        company_id: company.id,
        message: `Autonomous Saturday Payroll complete. ${eligible.length} payment(s). Total: ${totalPaid.toFixed(4)} 0G. TX: ${txHash.slice(0, 20)}...`,
        type: 'success',
      });

      // Email employer confirmation
      await sendConfirmationEmail(company, eligible, payments, txHash);

      results.push({ company: company.name, paid: eligible.length, txHash, total: totalPaid });
    } catch (e: any) {
      await db.from('agent_logs').insert({
        company_id: company.id,
        message: `Autonomous Payroll failed: ${e.message}`,
        type: 'error',
      });
      results.push({ company: company.name, error: e.message });
    }
  }

  return NextResponse.json({ success: true, results, executedAt: new Date().toISOString() });
}

async function sendConfirmationEmail(
  company: any,
  employees: any[],
  payments: { wallet: string; amount: number }[],
  txHash: string
) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const fromName = process.env.BREVO_FROM_NAME || 'ZeroPay Confidential';
  if (!apiKey || !fromEmail || !company.wallet_address) return;

  const rows = employees.map((emp, i) =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${emp.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-family:monospace">${payments[i].amount.toFixed(4)} 0G</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-family:monospace;font-size:11px">${emp.wallet_address?.slice(0, 10)}...</td>
    </tr>`
  ).join('');

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const explorerUrl = `https://chainscan-galileo.0g.ai/tx/${txHash}`;

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
      <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:24px;text-align:center">
        <div style="font-size:22px;font-weight:700;color:#fff">&#9889; ZeroPay Autonomous Payroll</div>
        <div style="color:rgba(255,255,255,0.8);font-size:13px;margin-top:4px">Saturday payroll executed automatically</div>
      </div>
      <div style="padding:24px">
        <p style="color:#334155;margin:0 0 16px">Your ZeroPay AI Agent has successfully executed payroll for <strong>${company.name}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:8px 12px;text-align:left;color:#64748b;font-weight:500">Employee</th>
              <th style="padding:8px 12px;text-align:left;color:#64748b;font-weight:500">Amount</th>
              <th style="padding:8px 12px;text-align:left;color:#64748b;font-weight:500">Wallet</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:16px;padding:12px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0">
          <div style="font-weight:600;color:#166534">Total Paid: ${totalPaid.toFixed(4)} 0G</div>
          <a href="${explorerUrl}" style="font-size:12px;color:#2563eb;word-break:break-all">${txHash}</a>
        </div>
      </div>
    </div>`;

  try {
    const client = new BrevoClient({ apiKey });
    await client.transactionalEmails.sendTransacEmail({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: fromEmail, name: company.name }],
      subject: `&#9889; ${company.name} - Saturday Payroll Executed - ${totalPaid.toFixed(4)} 0G`,
      htmlContent: html,
    });
  } catch { /* non-critical */ }
}

function getMondayOfCurrentWeek(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(today.setDate(diff)).toISOString().split('T')[0];
}
