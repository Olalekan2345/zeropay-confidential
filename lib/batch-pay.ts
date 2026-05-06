import { parseEther } from 'viem';

export const BATCH_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_BATCH_CONTRACT || '') as `0x${string}`;

export const BATCH_PAY_ABI = [
  {
    name: 'batchPay',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
    ],
    outputs: [],
  },
] as const;

export function buildBatchPayArgs(payments: { wallet: string; amount: number }[]) {
  const recipients = payments.map(p => p.wallet as `0x${string}`);
  const amounts = payments.map(p => parseEther(p.amount.toFixed(18)));
  const total = amounts.reduce((a, b) => a + b, 0n);
  return { recipients, amounts, total };
}
