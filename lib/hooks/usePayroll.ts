'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Database } from '@/lib/supabase';
import { useWalletClient, useBalance, usePublicClient } from 'wagmi';
import { parseEther, formatEther, keccak256, toHex, encodePacked } from 'viem';
import { galileoTestnet } from '@/lib/wagmi';
import {
  deriveEncryptionKey, encryptSalary, decryptSalary,
  getCachedKey, setCachedKey, getKeyDerivationMessage
} from '@/lib/arcium';
import { BATCH_CONTRACT_ADDRESS, BATCH_PAY_ABI, buildBatchPayArgs } from '@/lib/batch-pay';
import { ARCIUM_REGISTRY_ADDRESS, ARCIUM_REGISTRY_ABI } from '@/lib/arcium-registry';

export type PayrollReceipt = Database['payroll_receipts'];

export function usePayrollReceipts(companyId: string | null) {
  const [receipts, setReceipts] = useState<PayrollReceipt[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetch = useCallback(async () => {
    if (!companyId) return;
    const res = await window.fetch(`/api/payroll/receipts?company_id=${companyId}`);
    const json = await res.json();
    // Only update if we got real data — never wipe existing receipts with empty
    if (json.receipts?.length > 0) {
      setReceipts(json.receipts);
    } else if (json.receipts !== undefined) {
      setReceipts(prev => prev.length === 0 ? [] : prev);
    }
  }, [companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!companyId) return;
    channelRef.current = supabase
      .channel(`payroll:${companyId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payroll_receipts', filter: `company_id=eq.${companyId}` },
        payload => setReceipts(prev => [payload.new as PayrollReceipt, ...prev])
      )
      .subscribe();
    return () => { channelRef.current?.unsubscribe(); };
  }, [companyId]);

  return { receipts, refetch: fetch };
}

type EmployeeForPayroll = {
  id: string;
  name: string;
  wallet_address: string | null;
  weekly_hours: number;
  hourly_rate: number;
  encrypted_salary: string | null;
  salary_iv: string | null;
  salary_key_hint: string | null;
  compute_hash: string | null;
  payroll_status: string;
};

function buildComputeHash(
  computations: Array<{ employee_id: string; encrypted_salary: string; salary_iv: string }>
): `0x${string}` {
  const packed = computations
    .map(c => `${c.employee_id}|${c.encrypted_salary}|${c.salary_iv}`)
    .join('::');
  return keccak256(toHex(packed));
}

export function usePayrollActions(companyId: string | null, walletAddress: string | null) {
  const [isComputing, setIsComputing] = useState(false);
  const [isAttesting, setIsAttesting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: walletClient } = useWalletClient({ chainId: galileoTestnet.id });
  const publicClient = usePublicClient({ chainId: galileoTestnet.id });

  const registryDeployed = !!ARCIUM_REGISTRY_ADDRESS;

  const getOrDeriveKey = useCallback(async () => {
    if (!walletAddress || !walletClient) throw new Error('Wallet not connected');
    const cached = getCachedKey(walletAddress);
    if (cached) return cached;
    const message = getKeyDerivationMessage(walletAddress);
    const signature = await walletClient.signMessage({ message });
    const key = await deriveEncryptionKey(walletAddress, signature);
    setCachedKey(key, walletAddress);
    return key;
  }, [walletAddress, walletClient]);

  /** Step 1: Encrypt salaries + submit on-chain attestation tx */
  const runArciumCompute = useCallback(async (employees: EmployeeForPayroll[]) => {
    if (!companyId || !walletAddress) return;
    setIsComputing(true);
    setError(null);

    try {
      const key = await getOrDeriveKey();
      const eligible = employees.filter(e => e.weekly_hours > 0 && e.payroll_status !== 'paid');

      if (eligible.length === 0) {
        throw new Error('No employees with recorded hours this week.');
      }

      // Encrypt each salary
      const computations = [];
      for (const emp of eligible) {
        const salary = emp.weekly_hours * emp.hourly_rate;
        const { ciphertext, iv } = await encryptSalary(salary, key);
        computations.push({
          employee_id: emp.id,
          employee_name: emp.name,
          encrypted_salary: ciphertext,
          salary_iv: iv,
          salary_key_hint: walletAddress,
        });
      }

      // Derive compute hash
      const computeHash = buildComputeHash(computations);

      // Submit on-chain attestation (if registry deployed)
      if (registryDeployed && walletClient) {
        setIsAttesting(true);
        try {
          const txHash = await walletClient.writeContract({
            address: ARCIUM_REGISTRY_ADDRESS,
            abi: ARCIUM_REGISTRY_ABI,
            functionName: 'attest',
            args: [computeHash as `0x${string}`, BigInt(eligible.length)],
            chain: galileoTestnet,
          });
          // Wait for confirmation
          await publicClient?.waitForTransactionReceipt({ hash: txHash });
        } finally {
          setIsAttesting(false);
        }
      }

      // Store encrypted salaries + compute_hash in DB
      const res = await window.fetch('/api/payroll/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, computations, compute_hash: computeHash }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return { ...json, computeHash };
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setIsComputing(false);
      setIsAttesting(false);
    }
  }, [companyId, walletAddress, walletClient, publicClient, getOrDeriveKey, registryDeployed]);

  /** Decrypt a single employee's salary, verifying on-chain attestation first */
  const decryptEmployeeSalary = useCallback(async (
    encryptedSalary: string,
    iv: string,
    computeHash?: string | null
  ): Promise<number> => {
    if (!walletAddress) throw new Error('Wallet not connected');

    // Verify on-chain attestation before revealing
    if (registryDeployed && computeHash && publicClient) {
      const attested = await publicClient.readContract({
        address: ARCIUM_REGISTRY_ADDRESS,
        abi: ARCIUM_REGISTRY_ABI,
        functionName: 'isAttested',
        args: [computeHash as `0x${string}`],
      });
      if (!attested) {
        throw new Error('Salary not attested on-chain. Run Arcium compute first.');
      }
    }

    const key = await getOrDeriveKey();
    return decryptSalary(encryptedSalary, iv, key);
  }, [walletAddress, publicClient, getOrDeriveKey, registryDeployed]);

  /** Verify attestation status for a given compute hash (read-only) */
  const checkAttestation = useCallback(async (
    computeHash: string
  ): Promise<{ attested: boolean; employer?: string; timestamp?: number; employeeCount?: number }> => {
    if (!registryDeployed || !publicClient) return { attested: false };
    try {
      const attested = await publicClient.readContract({
        address: ARCIUM_REGISTRY_ADDRESS,
        abi: ARCIUM_REGISTRY_ABI,
        functionName: 'isAttested',
        args: [computeHash as `0x${string}`],
      });
      if (!attested) return { attested: false };

      const [employer, timestamp, employeeCount] = await publicClient.readContract({
        address: ARCIUM_REGISTRY_ADDRESS,
        abi: ARCIUM_REGISTRY_ABI,
        functionName: 'getAttestation',
        args: [computeHash as `0x${string}`],
      }) as [string, bigint, bigint];

      return {
        attested: true,
        employer,
        timestamp: Number(timestamp),
        employeeCount: Number(employeeCount),
      };
    } catch {
      return { attested: false };
    }
  }, [publicClient, registryDeployed]);

  const executePayroll = useCallback(async (
    employees: EmployeeForPayroll[],
    decryptedAmounts: Record<string, number>
  ) => {
    if (!companyId || !walletAddress || !walletClient) {
      throw new Error('Wallet not connected');
    }
    setIsPaying(true);
    setError(null);

    try {
      const eligible = employees.filter(
        e => e.payroll_status === 'computed' && e.wallet_address && decryptedAmounts[e.id] > 0
      );

      if (eligible.length === 0) {
        throw new Error('No eligible employees. Ensure wallet addresses are set and salaries are computed.');
      }

      const paymentArgs = eligible.map(e => ({
        wallet: e.wallet_address!,
        amount: decryptedAmounts[e.id],
      }));

      const { recipients, amounts, total } = buildBatchPayArgs(paymentArgs);

      const txHash = await walletClient.writeContract({
        address: BATCH_CONTRACT_ADDRESS,
        abi: BATCH_PAY_ABI,
        functionName: 'batchPay',
        args: [recipients, amounts],
        value: total,
        chain: galileoTestnet,
      });

      const payments = eligible.map(emp => ({
        employee_id: emp.id,
        employee_name: emp.name,
        amount: decryptedAmounts[emp.id],
        tx_hash: txHash,
        from_wallet: walletAddress,
        to_wallet: emp.wallet_address,
      }));

      const res = await window.fetch('/api/payroll/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, payments }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setIsPaying(false);
    }
  }, [companyId, walletAddress, walletClient]);

  return {
    runArciumCompute, executePayroll, decryptEmployeeSalary, checkAttestation,
    isComputing, isAttesting, isPaying, error,
    registryDeployed,
  };
}
