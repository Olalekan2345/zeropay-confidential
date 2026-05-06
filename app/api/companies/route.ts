export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { uploadToStorage } from '@/lib/0g-storage';

export async function GET(req: NextRequest) {
  const walletAddress = req.nextUrl.searchParams.get('wallet');
  if (!walletAddress) return NextResponse.json({ error: 'wallet required' }, { status: 400 });

  const db = createServerClient();
  const { data, error } = await db
    .from('companies')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ company: data || null });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { wallet_address, name, industry, size } = body;

  if (!wallet_address || !name) {
    return NextResponse.json({ error: 'wallet_address and name required' }, { status: 400 });
  }

  const db = createServerClient();

  // Upsert company
  const { data, error } = await db
    .from('companies')
    .upsert({
      wallet_address: wallet_address.toLowerCase(),
      name,
      industry,
      size,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'wallet_address' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log to 0G storage
  const storage = await uploadToStorage({ company: data }, 'company-profile');
  await db.from('storage_receipts').insert({
    company_id: data.id,
    action: `Company profile created: ${name}`,
    category: 'system',
    tx_hash: storage.txHash,
    data_size: storage.dataSize,
  });

  await db.from('agent_logs').insert({
    company_id: data.id,
    message: `Company profile "${name}" saved to 0G Storage`,
    type: 'success',
  });

  return NextResponse.json({ company: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { wallet_address, ...updates } = body;

  if (!wallet_address) return NextResponse.json({ error: 'wallet_address required' }, { status: 400 });

  const db = createServerClient();
  const { data, error } = await db
    .from('companies')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('wallet_address', wallet_address.toLowerCase())
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ company: data });
}

