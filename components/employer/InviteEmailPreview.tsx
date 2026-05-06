'use client';

import { useState } from 'react';
import { Mail, ExternalLink, Check, Clock, ChevronDown, ChevronUp, Copy, CheckCircle } from 'lucide-react';

interface Props {
  employees: any[];
  companyName: string;
  appUrl: string;
}

export function InviteEmailPreview({ employees, companyName, appUrl }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const sentEmployees = employees.filter(e => e.invite_status !== 'pending');

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (sentEmployees.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Mail className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm">Onboarding Emails</div>
            <div className="text-xs text-slate-400">Employee invite previews</div>
          </div>
        </div>
        <div className="text-center py-8 text-slate-400">
          <Mail className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <div className="text-sm">No invites sent yet</div>
          <div className="text-xs mt-1">Register employees to send onboarding emails</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Mail className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm">Onboarding Emails</div>
            <div className="text-xs text-slate-400">{sentEmployees.length} invite(s) dispatched via Resend</div>
          </div>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto hide-scrollbar">
        {sentEmployees.map(emp => {
          const onboardingUrl = `${appUrl}/employee/onboard/${emp.onboarding_id}`;
          return (
            <div key={emp.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900">{emp.name}</div>
                  <div className="text-xs text-slate-400">{emp.email}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <Check className="w-3 h-3" />
                    {emp.invite_status === 'accepted' ? 'Onboarded' : 'Sent'}
                  </div>
                  {expandedId === emp.id ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </div>
              </button>

              {expandedId === emp.id && (
                <div className="border-t border-slate-100 p-4 bg-slate-50">
                  {/* Email preview */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-w-sm mx-auto">
                    <div className="bg-gradient-to-r from-brand-600 to-violet-600 px-5 py-4 text-center">
                      <div className="text-white font-bold text-base">⚡ ZeroPay Confidential</div>
                      <div className="text-blue-200 text-xs mt-0.5">AI Payroll · 0G Galileo Testnet</div>
                    </div>
                    <div className="px-5 py-4">
                      <div className="text-sm font-semibold text-slate-900 mb-2">Welcome to {companyName}! 🎉</div>
                      <div className="text-xs text-slate-600 leading-relaxed mb-4">
                        Hi <strong>{emp.name}</strong>, you've been added to the ZeroPay payroll workforce. Your salary is computed privately using Arcium and paid to your wallet every Saturday.
                      </div>
                      <div className="block w-full bg-gradient-to-r from-brand-600 to-violet-600 text-white text-center py-2.5 rounded-lg text-xs font-semibold">
                        Access Employee Dashboard →
                      </div>
                    </div>
                    <div className="border-t border-slate-100 px-5 py-2 bg-slate-50 text-center">
                      <div className="text-xs text-slate-400">ZeroPay · 0G Galileo · Arcium</div>
                    </div>
                  </div>

                  {/* Invite link */}
                  <div className="mt-4 space-y-2">
                    <div className="text-xs text-slate-500 font-medium">Onboarding Link</div>
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
                      <span className="font-mono text-xs text-slate-600 flex-1 truncate">{onboardingUrl}</span>
                      <button
                        onClick={() => copyLink(onboardingUrl, emp.id)}
                        className="text-brand-600 hover:text-brand-700"
                      >
                        {copied === emp.id ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a href={onboardingUrl} target="_blank" className="text-brand-600 hover:text-brand-700">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    {emp.invite_sent_at && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        Sent {new Date(emp.invite_sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
