'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { zgMainnet, EXPLORER_URL } from '@/lib/wagmi';

export function WalletConnect() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;
        const wrongChain = connected && chain.id !== 16661;

        if (!ready) return null;

        if (!connected) {
          return (
            <Button onClick={openConnectModal} variant="gradient" size="sm" className="gap-2">
              <Wallet className="w-3.5 h-3.5" />
              Connect Wallet
            </Button>
          );
        }

        if (wrongChain) {
          return (
            <Button onClick={openChainModal} variant="warning" size="sm" className="gap-2">
              Wrong Network — Switch to 0G Galileo
            </Button>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={openChainModal}
              className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              0G Galileo
            </button>
            <button
              onClick={openAccountModal}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                {account.displayName.slice(0, 1).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700 font-mono text-xs">
                {account.displayName}
              </span>
              <span className="text-brand-600 font-semibold text-xs">
                {account.displayBalance}
              </span>
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
