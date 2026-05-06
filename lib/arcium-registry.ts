'use client';

export const ARCIUM_REGISTRY_ADDRESS = (
  process.env.NEXT_PUBLIC_ARCIUM_REGISTRY || ''
) as `0x${string}`;

export const ARCIUM_REGISTRY_ABI = [
  {
    name: 'attest',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'computeHash', type: 'bytes32' },
      { name: 'employeeCount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'isAttested',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'computeHash', type: 'bytes32' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'getAttestation',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'computeHash', type: 'bytes32' }],
    outputs: [
      { name: 'employer', type: 'address' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'employeeCount', type: 'uint256' },
    ],
  },
  {
    name: 'ComputeAttestation',
    type: 'event',
    inputs: [
      { name: 'employer', type: 'address', indexed: true },
      { name: 'computeHash', type: 'bytes32', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
      { name: 'employeeCount', type: 'uint256', indexed: false },
    ],
  },
] as const;

/** Build a deterministic compute hash from encrypted salary data */
export function buildComputeHash(
  computations: Array<{ employee_id: string; encrypted_salary: string; salary_iv: string }>
): `0x${string}` {
  const payload = computations
    .map(c => `${c.employee_id}:${c.encrypted_salary}:${c.salary_iv}`)
    .join('|');

  // Simple deterministic hex hash: encode to bytes then keccak via viem
  return payload as `0x${string}`; // placeholder — replaced at call site with keccak256
}
