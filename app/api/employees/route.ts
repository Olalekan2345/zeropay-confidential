export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { uploadToStorage } from '@/lib/0g-storage';
import { BrevoClient } from '@getbrevo/brevo';
import { nanoid } from 'nanoid';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'payroll@yourdomain.com';
const FROM_NAME = process.env.BREVO_FROM_NAME || 'ZeroPay Confidential';

function getBrevo() {
  return new BrevoClient({ apiKey: process.env.BREVO_API_KEY || '' });
}

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('company_id');
  if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 });

  const db = createServerClient();
  const { data, error } = await db
    .from('employees')
    .select('*')
    .eq('company_id', companyId)
    .order('registered_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ employees: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { company_id, company_name, name, email, wallet_address, hourly_rate, department, role } = body;

  if (!company_id || !name || !email || !hourly_rate || !department || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = createServerClient();
  const onboarding_id = nanoid(24);

  const { data: employee, error } = await db
    .from('employees')
    .insert({
      company_id,
      name,
      email,
      wallet_address: wallet_address || null,
      hourly_rate: parseFloat(hourly_rate),
      department,
      role,
      onboarding_id,
      invite_status: 'sent',
      invite_sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send onboarding email via Brevo
  const onboardingUrl = `${APP_URL}/employee/onboard/${onboarding_id}`;
  let emailSent = false;
  try {
    await getBrevo().transactionalEmails.sendTransacEmail({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email, name }],
      subject: `You've been added to ${company_name || 'ZeroPay'} payroll`,
      htmlContent: buildOnboardingEmail({ name, companyName: company_name || 'Your Company', onboardingUrl }),
    });
    emailSent = true;
  } catch (e) {
    console.error('Email send failed:', e);
  }

  // 0G Storage
  const storage = await uploadToStorage({ employee: { id: employee.id, name, email, department } }, 'employee-record');
  await db.from('storage_receipts').insert({
    company_id,
    action: `Employee registered: ${name}`,
    category: 'employee',
    tx_hash: storage.txHash,
    data_size: storage.dataSize,
  });

  await db.from('agent_logs').insert({
    company_id,
    message: emailSent
      ? `${name} registered - onboarding invite sent to ${email}`
      : `${name} registered - email failed (check BREVO_API_KEY and sender verification)`,
    type: emailSent ? 'success' : 'warning',
  });

  return NextResponse.json({ employee, emailSent });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, company_id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = createServerClient();
  const { data, error } = await db
    .from('employees')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ employee: data });
}

function buildOnboardingEmail({ name, companyName, onboardingUrl }: {
  name: string; companyName: string; onboardingUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px 40px;text-align:center;">
            <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">&#9889; ZeroPay Confidential</div>
            <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:4px;">Autonomous AI Payroll &middot; 0G Galileo Testnet</div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h1 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px;">Welcome to ${companyName}!</h1>
            <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 20px;">
              Hi <strong style="color:#0f172a;">${name}</strong>, you have been added to the ZeroPay payroll workforce at <strong style="color:#0f172a;">${companyName}</strong>.
            </p>
            <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 28px;">
              Your salary will be computed privately using <strong style="color:#7c3aed;">Arcium Confidential Compute</strong> and paid directly to your wallet on the <strong style="color:#2563eb;">0G Galileo Testnet</strong>.
            </p>
            <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;margin:0 0 28px;">
              <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">What this means for you</div>
              <div style="font-size:13px;color:#475569;line-height:1.8;">
                &#128274; Your salary is <strong>encrypted</strong> &mdash; only you can reveal it<br>
                &#9889; Payments go <strong>directly</strong> to your wallet<br>
                &#128202; Track your hours and attendance in real time<br>
                &#128452; All records stored on <strong>0G decentralized storage</strong>
              </div>
            </div>
            <div style="text-align:center;">
              <a href="${onboardingUrl}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">
                Access Employee Dashboard &rarr;
              </a>
            </div>
            <p style="color:#94a3b8;font-size:12px;text-align:center;margin:24px 0 0;">
              If you did not expect this email, you can safely ignore it.
            </p>
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid #f1f5f9;padding:20px 40px;text-align:center;">
            <div style="font-size:12px;color:#cbd5e1;">
              ZeroPay Confidential &middot; Built on 0G Labs Galileo Testnet &middot; Powered by Arcium
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
