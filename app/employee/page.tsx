'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Clock, DollarSign, Lock, Zap, CheckCircle, User, Wallet,
  Shield, Mail, ArrowLeft, Eye, EyeOff, Calendar, TrendingUp,
  Loader2, AlertCircle, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { cn, truncateHash } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getWeekDates } from '@/lib/payroll';
import { EXPLORER_URL } from '@/lib/wagmi';
import { useAccount, useBalance, usePublicClient, useWalletClient } from 'wagmi';
import { formatEther } from 'viem';
import { galileoTestnet } from '@/lib/wagmi';
import { WalletConnect } from '@/components/employer/WalletConnect';
import { ARCIUM_REGISTRY_ADDRESS, ARCIUM_REGISTRY_ABI } from '@/lib/arcium-registry';
import Image from 'next/image';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function EmployeePortalView({ employee, attendance, payrollReceipts, companyName }: any) {
  const [showSalary, setShowSalary] = useState(false);
  const [salaryUnlocked, setSalaryUnlocked] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [attestation, setAttestation] = useState<{ attested: boolean; employer?: string; timestamp?: number } | null>(null);
  const [checkingAttestation, setCheckingAttestation] = useState(false);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient({ chainId: galileoTestnet.id });
  const publicClient = usePublicClient({ chainId: galileoTestnet.id });
  const { data: balanceData } = useBalance({
    address: (employee.wallet_address || address) as `0x${string}`,
    chainId: galileoTestnet.id,
  });

  const registryDeployed = !!ARCIUM_REGISTRY_ADDRESS;

  const verifyAttestation = useCallback(async () => {
    if (!registryDeployed || !employee.compute_hash || !publicClient) return;
    setCheckingAttestation(true);
    try {
      const attested = await publicClient.readContract({
        address: ARCIUM_REGISTRY_ADDRESS,
        abi: ARCIUM_REGISTRY_ABI,
        functionName: 'isAttested',
        args: [employee.compute_hash as `0x${string}`],
      });
      if (attested) {
        const [employer, timestamp] = await publicClient.readContract({
          address: ARCIUM_REGISTRY_ADDRESS,
          abi: ARCIUM_REGISTRY_ABI,
          functionName: 'getAttestation',
          args: [employee.compute_hash as `0x${string}`],
        }) as [string, bigint, bigint];
        setAttestation({ attested: true, employer, timestamp: Number(timestamp) });
      } else {
        setAttestation({ attested: false });
      }
    } catch {
      setAttestation({ attested: false });
    } finally {
      setCheckingAttestation(false);
    }
  }, [registryDeployed, employee.compute_hash, publicClient]);

  useEffect(() => {
    if (employee.payroll_status === 'computed' || employee.payroll_status === 'paid') {
      verifyAttestation();
    }
  }, [employee.payroll_status, verifyAttestation]);

  const handleReveal = useCallback(async () => {
    if (salaryUnlocked) {
      setShowSalary(v => !v);
      return;
    }
    if (!address) {
      setSignError('Connect your wallet first to verify identity.');
      return;
    }
    if (!walletClient) return;
    setSigning(true);
    setSignError(null);
    try {
      const message = `ZeroPay: I authorize salary reveal for ${address} at ${new Date().toISOString().split('T')[0]}`;
      await walletClient.signMessage({ message });
      setSalaryUnlocked(true);
      setShowSalary(true);
    } catch (e: any) {
      setSignError(e.code === 4001 ? 'Signature rejected.' : 'Signing failed. Try again.');
    } finally {
      setSigning(false);
    }
  }, [salaryUnlocked, address, walletClient]);

  const weekDates = getWeekDates();
  const chartData = weekDates.map((date, i) => {
    const rec = attendance.find((a: any) => a.date === date);
    return { day: DAYS[i], hours: parseFloat(rec?.payable_hours || 0) };
  });

  const today = new Date().toISOString().split('T')[0];
  const todayAtt = attendance.find((a: any) => a.date === today);
  const totalWeekHours = parseFloat(employee.weekly_hours || 0);
  const estimatedSalary = totalWeekHours * parseFloat(employee.hourly_rate);

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="ZeroPay" width={28} height={28} className="rounded-full logo-spin" />
            <span className="font-bold text-slate-900 text-sm">ZeroPay</span>
            <span className="text-xs text-slate-400">Employee Portal</span>
          </div>
          <WalletConnect />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Profile card */}
        <div className="bg-gradient-to-br from-brand-600 to-violet-700 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {employee.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xl">{employee.name}</div>
              <div className="text-blue-200 text-sm">{employee.role} · {employee.department}</div>
              <div className="text-blue-200 text-xs mt-1 flex items-center gap-1">
                <Mail className="w-3 h-3" />{employee.email}
              </div>
              <div className="text-blue-200 text-xs mt-0.5">
                {companyName}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-blue-200 mb-1">Payroll</div>
              <div className={cn('text-sm font-semibold px-3 py-1 rounded-full',
                employee.payroll_status === 'paid' ? 'bg-emerald-500/30 text-emerald-200' :
                employee.payroll_status === 'computed' ? 'bg-amber-500/30 text-amber-200' :
                'bg-white/10 text-white/60')}>
                {employee.payroll_status === 'paid' ? '✓ Paid' :
                 employee.payroll_status === 'computed' ? '⏳ Computed' : '● Pending'}
              </div>
            </div>
          </div>

          {employee.wallet_address ? (
            <div className="mt-4 bg-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5 text-blue-200" />
              <a
                href={`${EXPLORER_URL}/address/${employee.wallet_address}`}
                target="_blank"
                className="font-mono text-xs text-blue-100 hover:text-white truncate flex-1"
              >
                {employee.wallet_address}
              </a>
              {balanceData && (
                <span className="text-xs text-emerald-300 font-semibold shrink-0">
                  {parseFloat(formatEther(balanceData.value)).toFixed(4)} 0G
                </span>
              )}
            </div>
          ) : (
            <div className="mt-4 bg-white/10 rounded-xl px-4 py-2.5 text-xs text-blue-200">
              No wallet linked — <Link href={`/employee/onboard/${employee.onboarding_id}`} className="text-white underline">complete onboarding</Link> to link yours
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-slate-500">Today</span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              {todayAtt?.payable_hours ? `${parseFloat(todayAtt.payable_hours).toFixed(1)}h` : '—'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {todayAtt?.clock_in
                ? `In: ${new Date(todayAtt.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                : 'Not clocked in'}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              <span className="text-xs text-slate-500">This Week</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{totalWeekHours.toFixed(1)}h</div>
            <div className="text-xs text-slate-400 mt-0.5">{parseFloat(employee.hourly_rate).toFixed(2)} 0G/hr</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-violet-500" />
              <span className="text-xs text-slate-500">Pending Salary</span>
            </div>
            {employee.payroll_status === 'computed' || employee.payroll_status === 'paid' ? (
              <div>
                <div className="flex items-center gap-2">
                  {showSalary && salaryUnlocked ? (
                    <span className="text-xl font-bold text-slate-900 font-mono">{estimatedSalary.toFixed(4)}</span>
                  ) : (
                    <span className="text-xl font-bold text-slate-300">••••</span>
                  )}
                  <button onClick={handleReveal} disabled={signing} className="text-slate-400 hover:text-slate-600">
                    {signing
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : showSalary && salaryUnlocked
                      ? <EyeOff className="w-3.5 h-3.5" />
                      : <Shield className="w-3.5 h-3.5 text-violet-500" />}
                  </button>
                </div>
                {signError && <div className="text-xs text-red-500 mt-0.5">{signError}</div>}
                <div className="flex items-center gap-1 mt-0.5">
                  {signing ? (
                    <span className="text-xs text-violet-600 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Sign in MetaMask...</span>
                  ) : salaryUnlocked ? (
                    <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Identity verified</span>
                  ) : (
                    <span className="text-xs text-violet-600 flex items-center gap-1"><Lock className="w-3 h-3" />Sign to reveal</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-sm">Not computed yet</div>
            )}
          </div>
        </div>

        {/* Weekly chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-brand-600" />
            <span className="font-semibold text-slate-900 text-sm">Weekly Hours</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 8]} />
              <Tooltip
                contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={(v: any) => [`${parseFloat(v).toFixed(2)}h`, 'Payable Hours']}
              />
              <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance log */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-900 text-sm">Attendance Log</span>
          </div>
          {attendance.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">No attendance recorded yet</div>
          ) : (
            <div className="space-y-2">
              {[...attendance].reverse().slice(0, 10).map((rec: any) => (
                <div key={rec.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 text-sm">
                      {new Date(rec.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs text-slate-400">
                      {rec.clock_in ? `In: ${new Date(rec.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : '—'}
                      {rec.clock_out ? ` · Out: ${new Date(rec.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-slate-900">{parseFloat(rec.payable_hours).toFixed(2)}h</div>
                    <div className="text-xs text-slate-400">payable</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment history */}
        {payrollReceipts.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-slate-900 text-sm">Payment History</span>
            </div>
            <div className="space-y-2">
              {payrollReceipts.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div className="flex-1">
                    {r.tx_hash && (
                      <a href={`${EXPLORER_URL}/tx/${r.tx_hash}`} target="_blank"
                        className="font-mono text-xs text-brand-600 hover:underline">
                        {truncateHash(r.tx_hash, 14)}
                      </a>
                    )}
                    <div className="text-xs text-slate-400">
                      {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="font-bold text-emerald-700">{parseFloat(r.amount).toFixed(4)} 0G</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Arcium badge */}
        {(employee.payroll_status === 'computed' || employee.payroll_status === 'paid') && (
          <div className={cn(
            'border rounded-xl p-4',
            attestation?.attested
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-violet-50 border-violet-200'
          )}>
            <div className="flex items-start gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                attestation?.attested ? 'bg-emerald-100' : 'bg-violet-100')}>
                {attestation?.attested
                  ? <CheckCircle className="w-5 h-5 text-emerald-600" />
                  : <Shield className="w-5 h-5 text-violet-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn('font-semibold text-sm', attestation?.attested ? 'text-emerald-900' : 'text-violet-900')}>
                  {attestation?.attested
                    ? 'Arcium Compute Attested On-Chain'
                    : 'Computed with Arcium Confidential Engine'}
                </div>
                <div className={cn('text-xs mt-0.5', attestation?.attested ? 'text-emerald-600' : 'text-violet-500')}>
                  {attestation?.attested
                    ? `Verified by ${attestation.employer?.slice(0, 6)}...${attestation.employer?.slice(-4)} · ${new Date((attestation.timestamp || 0) * 1000).toLocaleDateString()}`
                    : 'Your salary is encrypted with AES-256-GCM. Only authorized parties can decrypt it.'}
                </div>
                {employee.compute_hash && registryDeployed && (
                  <a
                    href={`${EXPLORER_URL}/address/${ARCIUM_REGISTRY_ADDRESS}`}
                    target="_blank"
                    className="text-xs text-brand-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />View ArciumRegistry contract
                  </a>
                )}
              </div>
              {!attestation?.attested && <Lock className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmployeePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!email) return;
    setLoading(true);
    setNotFound(false);
    try {
      // Search by email via employees API using anon supabase client
      const { supabase } = await import('@/lib/supabase');
      const { data: emp } = await supabase
        .from('employees')
        .select('*, companies(name)')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (!emp) { setNotFound(true); return; }

      const { data: att } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', emp.id)
        .order('date', { ascending: false });

      const { data: receipts } = await supabase
        .from('payroll_receipts')
        .select('*')
        .eq('employee_id', emp.id)
        .order('created_at', { ascending: false });

      setResult({ employee: emp, attendance: att || [], payrollReceipts: receipts || [] });
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <EmployeePortalView
        employee={result.employee}
        attendance={result.attendance}
        payrollReceipts={result.payrollReceipts}
        companyName={result.employee.companies?.name || 'Your Company'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="ZeroPay" width={28} height={28} className="rounded-full logo-spin" />
            <span className="font-bold text-slate-900 text-sm">ZeroPay Employee Portal</span>
          </div>
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />Home
          </Link>
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center mx-auto mb-6">
          <User className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Employee Portal</h1>
        <p className="text-slate-500 text-sm mb-8">
          Enter your work email to access your payroll dashboard, attendance records, and confidential salary.
        </p>
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="your@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="text-center"
          />
          <Button className="w-full" onClick={handleSearch} disabled={!email || loading}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Searching...</> : <><Mail className="w-4 h-4" />Access My Dashboard</>}
          </Button>
        </div>
        {notFound && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            No employee found with that email. Check with your employer or use your invite link.
          </div>
        )}
        <p className="text-xs text-slate-400 mt-6">
          Received an onboarding email? Use the <strong>Access Employee Dashboard</strong> button in that email for first-time setup.
        </p>
      </div>
    </div>
  );
}
