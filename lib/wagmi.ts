import { createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { defineChain } from 'viem';

export const galileoTestnet = defineChain({
  id: 16602,
  name: '0G-Galileo-Testnet',
  nativeCurrency: {
    decimals: 18,
    name: '0G',
    symbol: '0G',
  },
  rpcUrls: {
    default: {
      http: ['https://evmrpc-testnet.0g.ai'],
    },
    public: {
      http: ['https://evmrpc-testnet.0g.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Galileo Explorer',
      url: 'https://chainscan-galileo.0g.ai',
    },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [galileoTestnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
      metadata: {
        name: 'ZeroPay Confidential',
        description: 'Autonomous AI Payroll on 0G Galileo',
        url: 'http://localhost:3000',
        icons: [],
      },
    }),
  ],
  transports: {
    [16602]: http('https://evmrpc-testnet.0g.ai'),
  },
  ssr: true,
});

export const CHAIN_ID = galileoTestnet.id;
export const EXPLORER_URL = 'https://chainscan-galileo.0g.ai';
