import { createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { defineChain } from 'viem';

export const zgMainnet = defineChain({
  id: 16661,
  name: '0G-Newton-Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: '0G',
    symbol: '0G',
  },
  rpcUrls: {
    default: {
      http: ['https://evmrpc.0g.ai'],
    },
    public: {
      http: ['https://evmrpc.0g.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Explorer',
      url: 'https://chainscan.0g.ai',
    },
  },
  testnet: false,
});

export const wagmiConfig = createConfig({
  chains: [zgMainnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
      metadata: {
        name: 'ZeroPay Confidential',
        description: 'Autonomous AI Payroll on 0G Mainnet',
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        icons: [],
      },
    }),
  ],
  transports: {
    [16661]: http('https://evmrpc.0g.ai'),
  },
  ssr: true,
});

export const CHAIN_ID = zgMainnet.id;
export const EXPLORER_URL = 'https://chainscan.0g.ai';
