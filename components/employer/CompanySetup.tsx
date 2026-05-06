'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'E-Commerce', 'Media', 'Education', 'Legal', 'Manufacturing', 'Consulting', 'Other'];
const SIZES = ['1–10', '11–50', '51–200', '201–500', '500+'];

interface Props {
  walletAddress: string;
  onComplete: (data: { name: string; industry: string; size: string }) => Promise<void>;
}

export function CompanySetup({ walletAddress, onComplete }: Props) {
  const [step, setStep] = useState<'form' | 'saving'>('form');
  const [form, setForm] = useState({ name: '', industry: '', size: '' });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('saving');
    setError(null);
    try {
      await onComplete(form);
    } catch (err: any) {
      setError(err.message || 'Setup failed. Check your Supabase connection.');
      setStep('form');
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Company Profile</h2>
          <p className="text-slate-500 text-sm">Your company data is stored on 0G Decentralized Storage.</p>
          <div className="mt-2 font-mono text-xs text-slate-400 bg-slate-50 rounded px-3 py-1.5 inline-block">
            {walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
        )}

        {step === 'saving' ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <div className="text-sm text-slate-600">Creating company profile on 0G Storage...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Company Name *</Label>
              <Input placeholder="Acme Corporation" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Industry *</Label>
              <Select onValueChange={v => setForm(f => ({ ...f, industry: v }))}>
                <SelectTrigger><SelectValue placeholder="Select industry..." /></SelectTrigger>
                <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Company Size *</Label>
              <Select onValueChange={v => setForm(f => ({ ...f, size: v }))}>
                <SelectTrigger><SelectValue placeholder="Select size..." /></SelectTrigger>
                <SelectContent>{SIZES.map(s => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="pt-2">
              <Button type="submit" className="w-full" size="lg" disabled={!form.name || !form.industry || !form.size}>
                Create Payroll Profile
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
