'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useWalletClient } from 'wagmi';
import { zgMainnet } from '@/lib/wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WalletConnect } from '@/components/employer/WalletConnect';
import {
  Zap, CheckCircle, Wallet, Shield, Lock, ArrowRight,
  User, Mail, Building2, Loader2, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [employee, setEmployee] = useState<any>(null);
  const [step, setStep] = useState<'loading' | 'verify' | 'wallet' | 'complete' | 'invalid'>('loading');
  const [walletInput, setWalletInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = params.id as string;
    fetch(`/api/employees/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.employee) {
          setEmployee(json.employee);
          setStep(json.employee.invite_status === 'accepted' ? 'complete' : 'verify');
        } else {
          setStep('invalid');
        }
      })
      .catch(() => setStep('invalid'));
  }, [params.id]);

  // Pre-fill wallet input from connected wallet
  useEffect(() => {
    if (address && step === 'wallet') setWalletInput(address);
  }, [address, step]);

  const handleVerify = () => setStep('wallet');

  const handleLinkWallet = async () => {
    const walletAddr = walletInput || address;
    if (!walletAddr) { setError('Please enter or connect a wallet address'); return; }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddr,
          invite_status: 'accepted',
        }),
      });
      const json = await res.json();
      if (json.employee) {
        setEmployee(json.employee);
        setStep('complete');
      } else {
        setError(json.error || 'Failed to save. Try again.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const steps = ['verify', 'wallet', 'complete'];

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (step === 'invalid') {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid Invite Link</h2>
          <p className="text-slate-500 text-sm mb-6">This onboarding link is invalid or has expired. Contact your employer for a new invite.</p>
          <Link href="/"><Button variant="outline">Return to Home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">ZeroPay Confidential</span>
          </div>
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
                  step === s ? 'bg-brand-600 border-brand-600 text-white' :
                  steps.indexOf(step) > i ? 'bg-emerald-500 border-emerald-500 text-white' :
                  'border-slate-200 text-slate-400'
                }`}>
                  {steps.indexOf(step) > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                {i < 2 && <div className={`w-8 h-0.5 ${steps.indexOf(step) > i ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Verify Step */}
          {step === 'verify' && employee && (
            <div className="p-7">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                  {employee.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <h2 className="text-xl font-bold text-slate-900">Welcome, {employee.name.split(' ')[0]}!</h2>
                <p className="text-slate-500 text-sm mt-1">
                  You've been added to <strong>{employee.companies?.name || 'your company'}</strong> payroll on ZeroPay
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { icon: User, label: 'Full Name', value: employee.name },
                  { icon: Mail, label: 'Email', value: employee.email },
                  { icon: Building2, label: 'Role · Department', value: `${employee.role} · ${employee.department}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="text-xs text-slate-400">{label}</div>
                      <div className="font-medium text-slate-900 text-sm">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 mb-6 text-xs text-violet-700 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Your salary is computed privately using Arcium's confidential compute. Paid every Saturday to your wallet on 0G Galileo.
              </div>

              <Button className="w-full" size="lg" onClick={handleVerify}>
                Confirm Profile & Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Wallet Step */}
          {step === 'wallet' && (
            <div className="p-7">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-3">
                  <Wallet className="w-7 h-7 text-violet-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Link Your Wallet</h2>
                <p className="text-slate-500 text-sm mt-1">Your 0G salary arrives here every Saturday</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="mb-4">
                <div className="text-sm font-medium text-slate-700 mb-2">Option 1 — Connect MetaMask</div>
                <WalletConnect />
                {isConnected && address && (
                  <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Connected: {address.slice(0, 8)}...{address.slice(-6)}
                  </div>
                )}
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">or</span></div>
              </div>

              <div className="space-y-1.5 mb-6">
                <Label>Option 2 — Paste Wallet Address</Label>
                <Input
                  className="font-mono text-xs"
                  placeholder="0x..."
                  value={walletInput}
                  onChange={e => setWalletInput(e.target.value)}
                />
                <div className="text-xs text-slate-400">Must be a 0G Mainnet compatible address (EVM)</div>
              </div>

              <Button className="w-full" size="lg" onClick={handleLinkWallet} disabled={saving || (!walletInput && !address)}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Wallet className="w-4 h-4" />Link Wallet & Complete Setup</>}
              </Button>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="p-7 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">You're All Set!</h2>
              <p className="text-slate-500 text-sm mb-6">
                Your ZeroPay account is active. Salary payments land every Saturday directly in your wallet on 0G Mainnet.
              </p>
              {employee?.wallet_address && (
                <div className="bg-slate-50 rounded-xl px-4 py-3 mb-6 font-mono text-xs text-slate-600 text-center break-all">
                  {employee.wallet_address}
                </div>
              )}
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-violet-600" />
                  <span className="text-sm font-semibold text-violet-700">Arcium Privacy Active</span>
                </div>
                <div className="text-xs text-violet-600">Your salary is encrypted. Even your employer cannot see the exact amount until you reveal it in your portal.</div>
              </div>
              <Button className="w-full mb-3" size="lg" onClick={() => router.push('/employee')}>
                Open My Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Link href="/" className="text-xs text-slate-400 hover:text-slate-600">Back to home</Link>
            </div>
          )}
        </div>

        <div className="text-center mt-4 text-xs text-slate-400">
          ZeroPay Confidential · 0G Mainnet · Arcium Confidential Compute
        </div>
      </div>
    </div>
  );
}
