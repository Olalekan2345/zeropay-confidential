'use client';

import { useState } from 'react';
import { useZeroPayStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateMockWalletAddress } from '@/lib/payroll';

const DEMO_EMPLOYEES = [
  { name: 'Sarah Chen', email: 'sarah.chen@demo.com', role: 'Senior Engineer', department: 'Engineering', hourlyRate: 8.5 },
  { name: 'Marcus Williams', email: 'm.williams@demo.com', role: 'Product Manager', department: 'Product', hourlyRate: 7.5 },
  { name: 'Priya Patel', email: 'priya.p@demo.com', role: 'UX Designer', department: 'Design', hourlyRate: 6.0 },
  { name: 'Jordan Lee', email: 'j.lee@demo.com', role: 'Data Analyst', department: 'Engineering', hourlyRate: 7.0 },
];

export function DemoSeedButton() {
  const { employees, addEmployee, clockIn, clockOut, runArciumCompute, setCompany, walletAddress } = useZeroPayStore();
  const [loading, setLoading] = useState(false);

  if (employees.length > 0) return null;

  const handleSeed = async () => {
    setLoading(true);

    // Set company if not set
    setCompany({
      name: 'Nexus Labs Inc.',
      walletAddress: walletAddress || generateMockWalletAddress(),
      industry: 'Technology',
      size: '11–50',
      createdAt: new Date().toISOString(),
      autoPayEnabled: false,
      balance: '0',
    });

    await new Promise(r => setTimeout(r, 400));

    // Add employees
    const addedIds: string[] = [];
    for (const emp of DEMO_EMPLOYEES) {
      const newEmp = addEmployee({
        ...emp,
        walletAddress: generateMockWalletAddress(),
      });
      addedIds.push(newEmp.id);
      await new Promise(r => setTimeout(r, 200));
    }

    // Simulate Monday–Thursday attendance
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));

    const { attendance, clockIn: ci, clockOut: co } = useZeroPayStore.getState();

    // We'll use the store's actions to simulate past attendance
    // by manipulating the store directly for demo
    const mockAttendanceDays = [0, 1, 2, 3]; // Mon-Thu
    for (const emp of useZeroPayStore.getState().employees) {
      for (const dayOffset of mockAttendanceDays) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + dayOffset);
        const dateStr = d.toISOString().split('T')[0];

        // Skip future dates
        if (d > today) continue;

        const clockInTime = new Date(d);
        clockInTime.setHours(8, 45 + Math.floor(Math.random() * 30), 0);
        const clockOutTime = new Date(d);
        clockOutTime.setHours(17, Math.floor(Math.random() * 30), 0);

        const { computePayableHours } = await import('@/lib/payroll');
        const payable = computePayableHours(clockInTime.toISOString(), clockOutTime.toISOString());

        useZeroPayStore.setState(state => ({
          attendance: [
            ...state.attendance,
            {
              id: `demo-${emp.id}-${dayOffset}`,
              employeeId: emp.id,
              date: dateStr,
              clockIn: clockInTime.toISOString(),
              clockOut: clockOutTime.toISOString(),
              payableHours: payable,
            }
          ]
        }));
      }

      // Update weekly hours
      const allAtt = useZeroPayStore.getState().attendance.filter(a => a.employeeId === emp.id);
      const weeklyHours = allAtt.reduce((s, a) => s + a.payableHours, 0);
      useZeroPayStore.getState().updateEmployee(emp.id, { weeklyHours });
    }

    // Run Arcium compute
    await new Promise(r => setTimeout(r, 500));
    await runArciumCompute();

    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSeed}
      disabled={loading}
      className="gap-1.5 border-violet-200 text-violet-700 hover:bg-violet-50"
    >
      {loading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading Demo...
        </>
      ) : (
        <>
          <Sparkles className="w-3.5 h-3.5" />
          Load Demo Data
        </>
      )}
    </Button>
  );
}
