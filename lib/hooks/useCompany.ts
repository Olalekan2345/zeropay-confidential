'use client';

import { useState, useEffect, useCallback } from 'react';
import { Database } from '@/lib/supabase';

type Company = Database['companies'];

export function useCompany(walletAddress: string | null) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!walletAddress) { setCompany(null); return; }
    setLoading(true);
    try {
      const res = await window.fetch(`/api/companies?wallet=${walletAddress}`);
      const json = await res.json();
      setCompany(json.company || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { fetch(); }, [fetch]);

  const createCompany = useCallback(async (data: { name: string; industry: string; size: string }) => {
    if (!walletAddress) return null;
    setLoading(true);
    try {
      const res = await window.fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress, ...data }),
      });
      const json = await res.json();
      if (json.company) setCompany(json.company);
      return json.company;
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const toggleAutoPay = useCallback(async () => {
    if (!walletAddress || !company) return;
    const res = await window.fetch('/api/companies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: walletAddress,
        auto_pay_enabled: !company.auto_pay_enabled,
      }),
    });
    const json = await res.json();
    if (json.company) setCompany(json.company);
  }, [walletAddress, company]);

  return { company, loading, error, createCompany, toggleAutoPay, refetch: fetch };
}
