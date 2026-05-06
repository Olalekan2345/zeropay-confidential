'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  Shield, Zap, Users, Lock, ArrowRight, CheckCircle,
  Globe, Database, Cpu, ChevronRight, Sparkles, Wallet
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Arcium Confidential Compute',
    description: 'Salaries computed privately using zero-knowledge cryptographic proofs. No one sees the numbers except the recipient.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: Database,
    title: '0G Decentralized Storage',
    description: 'All workforce memory — attendance, records, and receipts — stored immutably on 0G Labs Galileo Testnet.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Cpu,
    title: 'Autonomous AI Payroll Agent',
    description: 'AI agent monitors attendance, computes salaries, and executes direct wallet-to-wallet payroll every Saturday.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: Wallet,
    title: 'Non-Custodial Payments',
    description: 'Payroll flows directly from employer wallet to employee wallets. No intermediaries. No platform control.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
];

const stats = [
  { value: '100%', label: 'Non-Custodial' },
  { value: '0G', label: 'Chain Native' },
  { value: 'ZK', label: 'Confidential' },
  { value: 'Auto', label: 'Saturday Pay' },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 sticky top-0 z-50 bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="ZeroPay" width={36} height={36} className="rounded-full logo-spin" />
            <span className="font-bold text-slate-900 text-lg tracking-tight">ZeroPay</span>
            <span className="text-xs bg-brand-50 text-brand-700 border border-brand-200 rounded-full px-2 py-0.5 font-medium">
              Confidential
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/employee')}>
              Employee Portal
            </Button>
            <Button size="sm" onClick={() => router.push('/employer')}>
              Employer Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-20">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-brand-100/60 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-80 h-80 bg-violet-100/40 rounded-full blur-3xl" />
          <div className="absolute top-40 left-0 w-60 h-60 bg-emerald-100/30 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-sm text-brand-700 font-medium">Built on 0G Labs Galileo Testnet</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Confidential AI Payroll
            <span className="block gradient-text mt-1">for the Web3 Workforce</span>
          </h1>

          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Autonomous payroll agent that computes salaries privately with Arcium, stores workforce data on 0G decentralized storage, and pays employees every Saturday directly from your wallet.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="xl" variant="gradient" onClick={() => router.push('/employer')} className="w-full sm:w-auto">
              <Shield className="w-5 h-5" />
              Launch Employer Dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="xl" variant="outline" onClick={() => router.push('/employee')} className="w-full sm:w-auto">
              <Users className="w-4 h-4" />
              Employee Portal
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold gradient-text">{s.value}</div>
                <div className="text-sm text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture visual */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How ZeroPay Works</h2>
            <p className="text-slate-500">End-to-end confidential payroll in 4 steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Register Workforce', desc: 'Add employees and store all records on 0G decentralized storage', icon: Users, color: 'brand' },
              { step: '02', title: 'Track Attendance', desc: 'Employer marks clock in/out. AI computes payable hours Mon–Fri', icon: Zap, color: 'violet' },
              { step: '03', title: 'Arcium Compute', desc: 'Weekly hours × rate computed privately in confidential enclave', icon: Lock, color: 'emerald' },
              { step: '04', title: 'Auto Payroll', desc: 'AI agent pays every Saturday directly from employer wallet', icon: Globe, color: 'orange' },
            ].map((item, i) => (
              <div key={i} className="relative bg-white rounded-xl border border-slate-200 p-5 shadow-card">
                {i < 3 && (
                  <ChevronRight className="absolute -right-3 top-1/2 -translate-y-1/2 text-slate-300 hidden md:block z-10 bg-white rounded-full" />
                )}
                <div className="text-xs font-mono text-slate-400 mb-3">{item.step}</div>
                <div className={`w-9 h-9 rounded-lg bg-${item.color}-50 flex items-center justify-center mb-3`}>
                  <item.icon className={`w-4.5 h-4.5 text-${item.color}-600`} />
                </div>
                <div className="font-semibold text-slate-900 text-sm mb-1">{item.title}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Enterprise-Grade Privacy</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Built on cutting-edge cryptographic infrastructure so salary information remains private end to end
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-xl border border-slate-200 bg-white shadow-card hover:shadow-card-hover transition-shadow duration-300">
                <div className={`w-10 h-10 ${feature.bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-brand-600 to-violet-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/90 to-violet-700/90" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%)' }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <Sparkles className="w-10 h-10 text-white/60 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Run Confidential Payroll?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            Connect your wallet, register your team, and let ZeroPay handle the rest autonomously.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="xl"
              className="bg-white text-brand-700 hover:bg-slate-50 shadow-lg"
              onClick={() => router.push('/employer')}
            >
              <Shield className="w-5 h-5" />
              Start as Employer
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
              onClick={() => router.push('/employee')}
            >
              <Users className="w-4 h-4" />
              Access Employee Portal
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="ZeroPay" width={24} height={24} className="rounded-full logo-spin" />
            <span className="font-semibold text-slate-700 text-sm">ZeroPay Confidential</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <span>Built on 0G Labs Galileo Testnet</span>
            <span>•</span>
            <span>Powered by Arcium Confidential Compute</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs text-slate-500">Non-Custodial</span>
            <Lock className="w-3.5 h-3.5 text-brand-500 ml-2" />
            <span className="text-xs text-slate-500">ZK-Private</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
