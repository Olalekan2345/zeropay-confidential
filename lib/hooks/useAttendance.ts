'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Database } from '@/lib/supabase';

export type AttendanceRecord = Database['attendance'];

export function useAttendance(companyId: string | null) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetch = useCallback(async () => {
    if (!companyId) { setAttendance([]); return; }
    setLoading(true);
    try {
      const res = await window.fetch(`/api/attendance?company_id=${companyId}`);
      const json = await res.json();
      setAttendance(json.attendance || []);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!companyId) return;
    channelRef.current = supabase
      .channel(`attendance:${companyId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attendance',
        filter: `company_id=eq.${companyId}`,
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setAttendance(prev => [payload.new as AttendanceRecord, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setAttendance(prev => prev.map(r => r.id === payload.new.id ? payload.new as AttendanceRecord : r));
        }
      })
      .subscribe();

    return () => { channelRef.current?.unsubscribe(); };
  }, [companyId]);

  const clockIn = useCallback(async (employeeId: string, employeeName: string) => {
    if (!companyId) return null;
    const res = await window.fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clock_in', employee_id: employeeId, company_id: companyId, employee_name: employeeName }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.record;
  }, [companyId]);

  const clockOut = useCallback(async (employeeId: string, employeeName: string) => {
    if (!companyId) return null;
    const res = await window.fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clock_out', employee_id: employeeId, company_id: companyId, employee_name: employeeName }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json;
  }, [companyId]);

  const getTodayRecord = (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.find(a => a.employee_id === employeeId && a.date === today) || null;
  };

  const getEmployeeAttendance = (employeeId: string) =>
    attendance.filter(a => a.employee_id === employeeId);

  return { attendance, loading, clockIn, clockOut, getTodayRecord, getEmployeeAttendance, refetch: fetch };
}
