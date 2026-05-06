'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Database } from '@/lib/supabase';

export type Employee = Database['employees'];

export function useEmployees(companyId: string | null) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetch = useCallback(async () => {
    if (!companyId) { setEmployees([]); return; }
    setLoading(true);
    try {
      const res = await window.fetch(`/api/employees?company_id=${companyId}`);
      const json = await res.json();
      setEmployees(json.employees || []);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Real-time subscription
  useEffect(() => {
    if (!companyId) return;
    channelRef.current = supabase
      .channel(`employees:${companyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'employees',
        filter: `company_id=eq.${companyId}`,
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setEmployees(prev => [...prev, payload.new as Employee]);
        } else if (payload.eventType === 'UPDATE') {
          setEmployees(prev => prev.map(e => e.id === payload.new.id ? payload.new as Employee : e));
        } else if (payload.eventType === 'DELETE') {
          setEmployees(prev => prev.filter(e => e.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [companyId]);

  const addEmployee = useCallback(async (data: {
    company_name: string;
    name: string;
    email: string;
    wallet_address?: string;
    hourly_rate: number;
    department: string;
    role: string;
  }) => {
    if (!companyId) return null;
    const res = await window.fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId, ...data }),
    });
    const json = await res.json();
    return json;
  }, [companyId]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    const res = await window.fetch('/api/employees', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    const json = await res.json();
    if (json.employee) {
      setEmployees(prev => prev.map(e => e.id === id ? json.employee : e));
    }
    return json.employee;
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    const res = await window.fetch(`/api/employees/${id}`, { method: 'DELETE' });
    if (res.ok) setEmployees(prev => prev.filter(e => e.id !== id));
    return res.json();
  }, []);

  const resendInvite = useCallback(async (employee: Employee, companyName: string) => {
    const res = await window.fetch('/api/employees/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: employee.id, company_name: companyName }),
    });
    return res.json();
  }, []);

  return { employees, loading, addEmployee, updateEmployee, deleteEmployee, resendInvite, refetch: fetch };
}
