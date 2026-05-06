export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { BrevoClient } from '@getbrevo/brevo';

export async function GET() {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const fromName = process.env.BREVO_FROM_NAME;

  if (!apiKey || apiKey === 'xkeysib-xxxxxxxxxxxx') {
    return NextResponse.json({ error: 'BREVO_API_KEY is not set or still placeholder' }, { status: 500 });
  }

  try {
    const client = new BrevoClient({ apiKey });
    const result = await client.transactionalEmails.sendTransacEmail({
      sender: { name: fromName || 'ZeroPay Test', email: fromEmail || '' },
      to: [{ email: fromEmail || '', name: 'Test' }],
      subject: 'ZeroPay — Brevo test email',
      htmlContent: '<p>If you see this, Brevo is working correctly.</p>',
    });
    return NextResponse.json({ success: true, result, config: { fromEmail, fromName, keyPrefix: apiKey.slice(0, 12) + '...' } });
  } catch (e: any) {
    return NextResponse.json({
      error: e.message,
      detail: e.response?.body || e.response?.text || null,
      config: { fromEmail, fromName, keyPrefix: apiKey?.slice(0, 12) + '...' },
    }, { status: 500 });
  }
}
