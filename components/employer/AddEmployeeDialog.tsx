'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, CheckCircle, Loader2, Mail, AlertTriangle } from 'lucide-react';

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Marketing', 'Sales',
  'Operations', 'Finance', 'HR', 'Legal', 'Customer Success',
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyName: string;
  onAdd: (data: any) => Promise<{ employee: any; emailSent: boolean } | null>;
}

export function AddEmployeeDialog({ open, onOpenChange, companyName, onAdd }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; emailSent: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', walletAddress: '', hourlyRate: '', department: '', role: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await onAdd({
        company_name: companyName,
        name: form.name,
        email: form.email,
        wallet_address: form.walletAddress || undefined,
        hourly_rate: parseFloat(form.hourlyRate),
        department: form.department,
        role: form.role,
      });
      if (res?.employee) {
        setResult({ success: true, emailSent: res.emailSent });
        setTimeout(() => {
          setResult(null);
          setForm({ name: '', email: '', walletAddress: '', hourlyRate: '', department: '', role: '' });
          onOpenChange(false);
        }, 2500);
      } else {
        setError('Failed to register employee. Check your Supabase connection.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const isValid = form.name && form.email && form.hourlyRate && form.department && form.role;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
              <UserPlus className="w-4.5 h-4.5 text-brand-600" />
            </div>
            <div>
              <DialogTitle>Register New Employee</DialogTitle>
              <DialogDescription>Add to {companyName} payroll workforce</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {result?.success ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-slate-900">Employee Registered!</div>
              <div className="text-sm text-slate-500 mt-1">
                {result.emailSent
                  ? 'Onboarding invite sent to their email'
                  : 'Registered — share invite link manually (email API not configured)'}
              </div>
            </div>
            {!result.emailSent && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5" />
                Add RESEND_API_KEY to .env.local for real email delivery
              </div>
            )}
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              Saved to 0G Storage
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Full Name *</Label>
                <Input placeholder="Sarah Johnson" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Work Email *</Label>
                <Input type="email" placeholder="sarah@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Wallet Address <span className="text-slate-400 font-normal">(optional — can link later)</span></Label>
                <Input className="font-mono text-xs" placeholder="0x..." value={form.walletAddress} onChange={e => setForm(f => ({ ...f, walletAddress: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Department *</Label>
                <Select onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Rate / Hour (0G) *</Label>
                <Input type="number" min="0" step="0.01" placeholder="5.00" value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))} required />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Job Title *</Label>
                <Input placeholder="Senior Engineer" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required />
              </div>
            </div>

            <div className="bg-brand-50 rounded-lg p-3 text-xs text-brand-700 flex items-start gap-2">
              <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              A real onboarding email is sent to the employee with a unique access link.
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={!isValid || loading}>
                {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Registering...</> : <><UserPlus className="w-3.5 h-3.5" />Register</>}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
