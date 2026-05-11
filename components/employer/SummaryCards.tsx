'use client';

import { formatWalletAddress } from '@/lib/payroll';
import { Wallet, Users, Clock, DollarSign, Zap, Shield, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

function StatCard({ icon: Icon, label, value, sub, accent = 'blue', pulse, badge, badgeVariant = 'default' }: any) {
  const accentMap: Record<string, string> = {
    blue: 'bg-brand-50 text-brand-600', violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600',
    orange: 'bg-orange-50 text-orange-600', slate: 'bg-slate-100 text-slate-500',
  };
  const badgeMap: Record<string, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    default: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', accentMap[accent])}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        {badge && (
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', badgeMap[badgeVariant])}>
            {badge}
          </span>
        )}
        {pulse && (
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-0.5 tracking-tight">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

interface Props {
  walletAddress: string;
  balance: string;
  employees: any[];
  attendance: any[];
  autoPayEnabled: boolean;
  agentLogs: any[];
  payrollReceipts: any[];
}

export function SummaryCards({ walletAddress, balance, employees, attendance, autoPayEnabled, agentLogs, payrollReceipts }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const todayAtt = attendance.filter(a => a.date === today);
  const clockedIn = todayAtt.filter(a => a.clock_in && !a.clock_out).length;
  const pendingPayroll = employees
    .filter(e => e.payroll_status === 'computed')
    .reduce((s: number, e: any) => s + (e.weekly_hours * e.hourly_rate), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      <StatCard icon={Wallet} label="Employer Wallet" value={formatWalletAddress(walletAddress)} sub="0G Mainnet" accent="blue" badge="Connected" badgeVariant="success" />
      <StatCard icon={DollarSign} label="0G Balance" value={balance} sub="0G Galileo Tokens" accent="emerald" />
      <StatCard icon={Users} label="Total Employees" value={employees.length.toString()} sub={`${employees.filter(e => e.invite_status === 'accepted').length} onboarded`} accent="violet" />
      <StatCard icon={Clock} label="Today's Attendance" value={`${todayAtt.length}/${employees.length}`} sub={`${clockedIn} currently clocked in`} accent="amber" pulse={clockedIn > 0} />
      <StatCard icon={Shield} label="Pending Payroll" value={pendingPayroll > 0 ? `${pendingPayroll.toFixed(2)}` : '—'} sub={`${employees.filter(e => e.payroll_status === 'computed').length} computed`} accent="orange" badge={pendingPayroll > 0 ? 'Ready' : undefined} badgeVariant="warning" />
      <StatCard icon={Zap} label="AutoPay" value={autoPayEnabled ? 'Enabled' : 'Disabled'} sub="Every Saturday 9AM" accent={autoPayEnabled ? 'emerald' : 'slate'} badge={autoPayEnabled ? 'Active' : 'Off'} badgeVariant={autoPayEnabled ? 'success' : 'default'} />
      <StatCard icon={Activity} label="AI Agent" value={agentLogs.length > 0 ? 'Active' : 'Standby'} sub={`${payrollReceipts.length} payments made`} accent={agentLogs.length > 0 ? 'violet' : 'slate'} pulse={agentLogs.length > 0} />
    </div>
  );
}
