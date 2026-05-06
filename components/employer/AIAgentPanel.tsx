'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Cpu, CheckCircle, AlertCircle, Info, XCircle,
  Zap, Activity, Lock, Shield, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LOG_ICON = { info: Info, success: CheckCircle, warning: AlertCircle, error: XCircle };
const LOG_COLOR = { info: 'text-brand-600', success: 'text-emerald-600', warning: 'text-amber-600', error: 'text-red-600' };
const LOG_BG = { info: 'bg-brand-50', success: 'bg-emerald-50', warning: 'bg-amber-50', error: 'bg-red-50' };

interface Props {
  agentLogs: any[];
  employees: any[];
  autoPayEnabled: boolean;
  onToggleAutoPay: () => void;
  payrollActions: any;
  onPayrollComplete?: () => void;
}

export function AIAgentPanel({ agentLogs, employees, autoPayEnabled, onToggleAutoPay, payrollActions, onPayrollComplete }: Props) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const eligibleForCompute = employees.filter(e => e.weekly_hours > 0 && e.payroll_status !== 'paid');
  const eligibleForPay = employees.filter(e => e.payroll_status === 'computed' && e.wallet_address);

  const handleCompute = async () => {
    setStatus('running');
    setError(null);
    try {
      await payrollActions.runArciumCompute(employees);
      setStatus('done');
    } catch (e: any) {
      setError(e.message);
      setStatus('idle');
    }
  };

  const handlePayAll = async () => {
    if (eligibleForPay.length === 0) return;
    setStatus('running');
    setError(null);
    try {
      const decryptedAmounts: Record<string, number> = {};
      for (const emp of eligibleForPay) {
        if (emp.encrypted_salary && emp.salary_iv) {
          // Pass compute_hash so on-chain attestation is verified before reveal
          const amt = await payrollActions.decryptEmployeeSalary(
            emp.encrypted_salary,
            emp.salary_iv,
            emp.compute_hash
          );
          decryptedAmounts[emp.id] = amt;
        }
      }
      await payrollActions.executePayroll(eligibleForPay, decryptedAmounts);
      setStatus('done');
      setTimeout(() => onPayrollComplete?.(), 1500);
    } catch (e: any) {
      setError(e.message);
      setStatus('idle');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-card overflow-hidden">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', status === 'running' ? 'bg-violet-500' : 'bg-slate-700')}>
              <Cpu className={cn('w-4 h-4 text-white', status === 'running' && 'animate-spin-slow')} />
            </div>
            <div>
              <div className="font-semibold text-white text-sm">ZeroPay AI Agent</div>
              <div className="text-xs text-slate-400">Autonomous Payroll Engine</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-full', status === 'idle' ? 'bg-slate-500' : status === 'running' ? 'bg-violet-400 animate-pulse' : 'bg-emerald-400')} />
            <span className="text-xs text-slate-400 capitalize">{status}</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-slate-100">
        {error && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="sm" onClick={handleCompute}
            disabled={payrollActions.isComputing || payrollActions.isAttesting || eligibleForCompute.length === 0} className="gap-2 h-9">
            {(payrollActions.isComputing || payrollActions.isAttesting)
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <Lock className="w-3.5 h-3.5 text-violet-600" />}
            {payrollActions.isAttesting
              ? 'Attesting on-chain...'
              : payrollActions.isComputing
              ? 'Encrypting...'
              : `Arcium Compute (${eligibleForCompute.length})`}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePayAll}
            disabled={payrollActions.isPaying || eligibleForPay.length === 0} className="gap-2 h-9 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
            {payrollActions.isPaying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {payrollActions.isPaying ? 'Paying...' : `Pay All (${eligibleForPay.length})`}
          </Button>
        </div>

        {payrollActions.registryDeployed && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-100 rounded-lg">
            <Shield className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <span className="text-xs text-violet-700 font-medium">Arcium Registry active — compute hash attested on-chain before salary reveal</span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-slate-700">Autonomous Saturday Payroll</div>
            <div className="text-xs text-slate-400 mt-0.5">AI executes payroll every Saturday 9AM</div>
          </div>
          <Switch checked={autoPayEnabled} onCheckedChange={onToggleAutoPay} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Agent Activity Log</span>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto hide-scrollbar">
          {agentLogs.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">Agent logs will appear here...</div>
          ) : (
            agentLogs.map((log: any) => {
              const Icon = LOG_ICON[log.type as keyof typeof LOG_ICON] || Info;
              return (
                <div key={log.id} className={cn('flex items-start gap-2.5 p-2.5 rounded-lg text-xs', LOG_BG[log.type as keyof typeof LOG_BG])}>
                  <Icon className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', LOG_COLOR[log.type as keyof typeof LOG_COLOR])} />
                  <div className="flex-1 min-w-0">
                    <div className={cn('leading-relaxed', LOG_COLOR[log.type as keyof typeof LOG_COLOR])}>{log.message}</div>
                    <div className="text-slate-400 mt-0.5">{new Date(log.created_at).toLocaleTimeString()}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
