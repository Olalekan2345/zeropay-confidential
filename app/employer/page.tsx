'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatEther } from 'viem';
import { galileoTestnet } from '@/lib/wagmi';
import { WalletConnect } from '@/components/employer/WalletConnect';
import { AddEmployeeDialog } from '@/components/employer/AddEmployeeDialog';
import { CompanySetup } from '@/components/employer/CompanySetup';
import { EmployerDashboardContent } from '@/components/employer/EmployerDashboardContent';
import { useCompany } from '@/lib/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Shield, Zap, ArrowLeft, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function EmployerPage() {
  const { address, isConnected, isConnecting } = useAccount();
  const { company, loading: companyLoading, createCompany, toggleAutoPay, refetch: refetchCompany } = useCompany(address || null);

  if (isConnected && address && companyLoading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <div className="text-sm text-slate-500">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-10 w-full max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 animate-float">
            <Image src="/logo.png" alt="ZeroPay" width={80} height={80} className="rounded-full logo-spin" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Employer Dashboard</h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Connect your wallet to access the ZeroPay confidential payroll system on 0G Galileo Testnet.
          </p>
          <WalletConnect />
          <p className="text-xs text-slate-400 mt-4">
            Ensure MetaMask is installed and set to 0G Galileo Testnet (Chain ID: 16602)
          </p>
          <div className="mt-4">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <CompanySetup
        walletAddress={address}
        onComplete={async (data) => {
          await createCompany(data);
        }}
      />
    );
  }

  return (
    <EmployerDashboardContent
      company={company}
      walletAddress={address}
      onToggleAutoPay={toggleAutoPay}
    />
  );
}
