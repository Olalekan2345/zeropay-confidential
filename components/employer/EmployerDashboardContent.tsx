'use client';

import { useState } from 'react';
import { useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { galileoTestnet } from '@/lib/wagmi';
import { WalletConnect } from './WalletConnect';
import { AddEmployeeDialog } from './AddEmployeeDialog';
import { EmployeeTable } from './EmployeeTable';
import { AIAgentPanel } from './AIAgentPanel';
import { StoragePanel } from './StoragePanel';
import { AttendanceChart } from './AttendanceChart';
import { PayrollTimeline } from './PayrollTimeline';
import { InviteEmailPreview } from './InviteEmailPreview';
import { SummaryCards } from './SummaryCards';
import { useEmployees } from '@/lib/hooks/useEmployees';
import { useAttendance } from '@/lib/hooks/useAttendance';
import { useLogs } from '@/lib/hooks/useLogs';
import { usePayrollReceipts, usePayrollActions } from '@/lib/hooks/usePayroll';
import { Button } from '@/components/ui/button';
import {
  UserPlus, Zap, Database, Users, BarChart2, Home,
  CreditCard, Mail, Building2, ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'employees', label: 'Workforce', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: BarChart2 },
  { id: 'payroll', label: 'Payroll', icon: CreditCard },
  { id: 'storage', label: '0G Storage', icon: Database },
  { id: 'invites', label: 'Invites', icon: Mail },
];

interface Props {
  company: any;
  walletAddress: string;
  onToggleAutoPay: () => void;
}

export function EmployerDashboardContent({ company, walletAddress, onToggleAutoPay }: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const { data: balanceData } = useBalance({ address: walletAddress as `0x${string}`, chainId: galileoTestnet.id });
  const balance = balanceData ? parseFloat(formatEther(balanceData.value)).toFixed(4) : '—';

  const { employees, loading: empLoading, addEmployee, updateEmployee, deleteEmployee, resendInvite } = useEmployees(company.id);
  const { attendance, clockIn, clockOut, getTodayRecord, getEmployeeAttendance } = useAttendance(company.id);
  const { agentLogs, storageReceipts } = useLogs(company.id);
  const { receipts: payrollReceipts, refetch: refetchPayroll } = usePayrollReceipts(company.id);
  const payrollActions = usePayrollActions(company.id, walletAddress);

  const handleAddEmployee = async (data: any) => {
    return addEmployee(data);
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="px-4 py-4 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="ZeroPay" width={32} height={32} className="rounded-full logo-spin" />
            <div>
              <div className="font-bold text-slate-900 text-sm leading-none">ZeroPay</div>
              <div className="text-xs text-slate-400 leading-none mt-0.5">Confidential</div>
            </div>
          </Link>
        </div>

        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-100 to-violet-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-brand-600" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">{company.name}</div>
              <div className="text-xs text-slate-400">{company.industry}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                activeTab === item.id
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.id === 'employees' && employees.length > 0 && (
                <span className="ml-auto text-xs bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5 font-medium">
                  {employees.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <WalletConnect />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 h-14 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-slate-900">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label}
            </h1>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>{company.name}</span>
              <ChevronRight className="w-3 h-3" />
              <span>{NAV_ITEMS.find(n => n.id === activeTab)?.label}</span>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowAddEmployee(true)} className="gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />
            Add Employee
          </Button>
        </header>

        <div className="p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <SummaryCards
                walletAddress={walletAddress}
                balance={balance}
                employees={employees}
                attendance={attendance}
                autoPayEnabled={company.auto_pay_enabled}
                agentLogs={agentLogs}
                payrollReceipts={payrollReceipts}
              />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <AttendanceChart employees={employees} attendance={attendance} />
                  <PayrollTimeline receipts={payrollReceipts} />
                </div>
                <AIAgentPanel
                  agentLogs={agentLogs}
                  employees={employees}
                  autoPayEnabled={company.auto_pay_enabled}
                  onToggleAutoPay={onToggleAutoPay}
                  payrollActions={payrollActions}
                  onPayrollComplete={refetchPayroll}
                />
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Workforce Registry</h2>
                  <p className="text-sm text-slate-500">{employees.length} employees · All records on 0G Storage</p>
                </div>
                <Button onClick={() => setShowAddEmployee(true)} className="gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />Register Employee
                </Button>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-card overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-slate-500 font-medium">Live · Synced with Supabase + 0G Storage</span>
                </div>
                <EmployeeTable
                  employees={employees}
                  attendance={attendance}
                  onClockIn={clockIn}
                  onClockOut={clockOut}
                  getTodayRecord={getTodayRecord}
                  payrollActions={payrollActions}
                  companyName={company.name}
                  onResendInvite={(emp) => resendInvite(emp, company.name)}
                  onUpdateEmployee={updateEmployee}
                  onDeleteEmployee={deleteEmployee}
                />
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Attendance Management</h2>
                <p className="text-sm text-slate-500">Employer-controlled · Mon–Fri · 9AM–5PM payable window</p>
              </div>
              <AttendanceChart employees={employees} attendance={attendance} />
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-card overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h3 className="font-medium text-slate-900 text-sm">Attendance Controls</h3>
                </div>
                <EmployeeTable
                  employees={employees}
                  attendance={attendance}
                  onClockIn={clockIn}
                  onClockOut={clockOut}
                  getTodayRecord={getTodayRecord}
                  payrollActions={payrollActions}
                  companyName={company.name}
                  onResendInvite={(emp) => resendInvite(emp, company.name)}
                  onUpdateEmployee={updateEmployee}
                  onDeleteEmployee={deleteEmployee}
                />
              </div>
            </div>
          )}

          {activeTab === 'payroll' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Payroll Management</h2>
                <p className="text-sm text-slate-500">Arcium confidential compute · Real on-chain wallet-to-wallet transfers on 0G Galileo</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AIAgentPanel
                  agentLogs={agentLogs}
                  employees={employees}
                  autoPayEnabled={company.auto_pay_enabled}
                  onToggleAutoPay={onToggleAutoPay}
                  payrollActions={payrollActions}
                  onPayrollComplete={refetchPayroll}
                />
                <PayrollTimeline receipts={payrollReceipts} />
              </div>
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-card overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <h3 className="font-medium text-slate-900 text-sm">Payroll Status per Employee</h3>
                </div>
                <EmployeeTable
                  employees={employees}
                  attendance={attendance}
                  onClockIn={clockIn}
                  onClockOut={clockOut}
                  getTodayRecord={getTodayRecord}
                  payrollActions={payrollActions}
                  companyName={company.name}
                  onResendInvite={(emp) => resendInvite(emp, company.name)}
                  onUpdateEmployee={updateEmployee}
                  onDeleteEmployee={deleteEmployee}
                />
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">0G Decentralized Storage</h2>
                <p className="text-sm text-slate-500">All workforce memory stored immutably on 0G Galileo Testnet</p>
              </div>
              <StoragePanel receipts={storageReceipts} />
            </div>
          )}

          {activeTab === 'invites' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Employee Onboarding</h2>
                <p className="text-sm text-slate-500">Real emails sent via Brevo · Unique invite links per employee</p>
              </div>
              <InviteEmailPreview employees={employees} companyName={company.name} appUrl={process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'} />
            </div>
          )}
        </div>
      </main>

      <AddEmployeeDialog
        open={showAddEmployee}
        onOpenChange={setShowAddEmployee}
        companyName={company.name}
        onAdd={handleAddEmployee}
      />
    </div>
  );
}
