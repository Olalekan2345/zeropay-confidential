'use client';

import { CheckCircle, XCircle, Clock, ArrowRight, Zap, ExternalLink } from 'lucide-react';
import { cn, truncateHash } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { EXPLORER_URL } from '@/lib/wagmi';

interface Props {
  receipts: any[];
}

export function PayrollTimeline({ receipts }: Props) {
  if (receipts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm">Payroll History</div>
            <div className="text-xs text-slate-400">On-chain payment records</div>
          </div>
        </div>
        <div className="text-center py-8 text-slate-400">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <div className="text-sm">No payroll executed yet</div>
          <div className="text-xs mt-1">Run Arcium compute then execute payroll</div>
        </div>
      </div>
    );
  }

  const totalPaid = receipts.filter(r => r.status === 'success').reduce((s, r) => s + parseFloat(r.amount), 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm">Payroll History</div>
            <div className="text-xs text-slate-400">{receipts.length} transactions · 0G Galileo</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-emerald-600">{totalPaid.toFixed(4)} 0G</div>
          <div className="text-xs text-slate-400">Total Paid</div>
        </div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto hide-scrollbar">
        {receipts.map(r => (
          <div key={r.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0',
              r.status === 'success' ? 'bg-emerald-100' : r.status === 'failed' ? 'bg-red-100' : 'bg-amber-100')}>
              {r.status === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                : r.status === 'failed' ? <XCircle className="w-4 h-4 text-red-600" />
                  : <Clock className="w-4 h-4 text-amber-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-slate-900">{r.employee_name}</span>
                <Badge variant={r.status === 'success' ? 'success' : 'destructive'} className="text-xs">{r.status}</Badge>
              </div>
              {r.from_wallet && r.to_wallet && (
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                  <span className="font-mono">{truncateHash(r.from_wallet, 8)}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="font-mono">{truncateHash(r.to_wallet, 8)}</span>
                </div>
              )}
              {r.tx_hash && (
                <a
                  href={`${EXPLORER_URL}/tx/${r.tx_hash}`}
                  target="_blank"
                  className="font-mono text-xs text-brand-600 hover:underline flex items-center gap-1 mt-0.5"
                >
                  {truncateHash(r.tx_hash, 12)}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold text-sm text-slate-900">{parseFloat(r.amount).toFixed(4)}</div>
              <div className="text-xs text-slate-400">0G</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {new Date(r.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
