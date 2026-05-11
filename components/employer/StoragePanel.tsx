'use client';

import { Database, CheckCircle, HardDrive, User, Clock, Zap, Shield, Activity } from 'lucide-react';
import { cn, truncateHash } from '@/lib/utils';

const CAT_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  employee: { icon: User, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Employee' },
  attendance: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Attendance' },
  payroll: { icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Payroll' },
  compute: { icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50', label: 'Arcium' },
  system: { icon: Activity, color: 'text-slate-600', bg: 'bg-slate-100', label: 'System' },
};

interface Props {
  receipts: any[];
}

export function StoragePanel({ receipts }: Props) {
  const totalSizeKb = receipts.reduce((s, r) => {
    const match = r.data_size?.match(/([\d.]+)/);
    return s + (match ? parseFloat(match[1]) : 0);
  }, 0);

  const byCategory = receipts.reduce((acc: Record<string, number>, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-card overflow-hidden">
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-white text-sm">0G Decentralized Storage</div>
              <div className="text-xs text-blue-200">0G Mainnet · Content-Addressed</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white font-bold text-lg">{receipts.length}</div>
            <div className="text-blue-200 text-xs">Records Stored</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        <div className="p-3 text-center">
          <div className="text-sm font-bold text-slate-900">{totalSizeKb.toFixed(1)} KB</div>
          <div className="text-xs text-slate-400">Total Size</div>
        </div>
        <div className="p-3 text-center">
          <div className="text-sm font-bold text-emerald-600">{receipts.filter(r => r.status === 'confirmed').length}</div>
          <div className="text-xs text-slate-400">Confirmed</div>
        </div>
        <div className="p-3 text-center">
          <div className="text-sm font-bold text-slate-900">0G</div>
          <div className="text-xs text-slate-400">Network</div>
        </div>
      </div>

      {Object.keys(byCategory).length > 0 && (
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap gap-2">
          {Object.entries(byCategory).map(([cat, count]) => {
            const cfg = CAT_CONFIG[cat];
            if (!cfg) return null;
            return (
              <div key={cat} className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', cfg.bg, cfg.color)}>
                <cfg.icon className="w-3 h-3" />
                {cfg.label}: {count}
              </div>
            );
          })}
        </div>
      )}

      <div className="max-h-72 overflow-y-auto hide-scrollbar">
        {receipts.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2 text-slate-400">
            <HardDrive className="w-8 h-8 opacity-30" />
            <span className="text-xs">No storage receipts yet</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {receipts.map((r: any) => {
              const cfg = CAT_CONFIG[r.category] || CAT_CONFIG.system;
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
                    <cfg.icon className={cn('w-3.5 h-3.5', cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-700 truncate">{r.action}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-slate-400">{truncateHash(r.tx_hash || '', 10)}</span>
                      {r.data_size && <><span className="text-slate-300">·</span><span className="text-xs text-slate-400">{r.data_size}</span></>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">Saved</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(r.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          <span className="text-xs text-slate-500">Immutable records on 0G Mainnet · Content-addressed</span>
        </div>
      </div>
    </div>
  );
}
