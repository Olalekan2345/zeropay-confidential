'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Database } from '@/lib/supabase';

export type AgentLog = Database['agent_logs'];
export type StorageReceipt = Database['storage_receipts'];

export function useLogs(companyId: string | null) {
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [storageReceipts, setStorageReceipts] = useState<StorageReceipt[]>([]);

  const fetchLogs = useCallback(async () => {
    if (!companyId) return;
    const [logsRes, storageRes] = await Promise.all([
      window.fetch(`/api/logs?company_id=${companyId}&type=agent`),
      window.fetch(`/api/logs?company_id=${companyId}&type=storage`),
    ]);
    const [logsJson, storageJson] = await Promise.all([logsRes.json(), storageRes.json()]);
    setAgentLogs(logsJson.logs || []);
    setStorageReceipts(storageJson.receipts || []);
  }, [companyId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (!companyId) return;

    const logChannel = supabase
      .channel(`logs:${companyId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_logs', filter: `company_id=eq.${companyId}` },
        payload => setAgentLogs(prev => [payload.new as AgentLog, ...prev].slice(0, 50))
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'storage_receipts', filter: `company_id=eq.${companyId}` },
        payload => setStorageReceipts(prev => [payload.new as StorageReceipt, ...prev].slice(0, 100))
      )
      .subscribe();

    return () => { logChannel.unsubscribe(); };
  }, [companyId]);

  return { agentLogs, storageReceipts, refetch: fetchLogs };
}
