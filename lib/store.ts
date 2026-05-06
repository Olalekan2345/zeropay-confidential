'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Employee, AttendanceRecord, StorageReceipt, PayrollReceipt, AIAgentLog, ArciumComputeReceipt, CompanyProfile, OnboardingInvite } from '@/types';
import { nanoid } from 'nanoid';
import { computePayableHours, generateTxHash, generateStorageTxHash } from './payroll';

interface ZeroPayStore {
  // Wallet
  walletAddress: string | null;
  isWalletConnected: boolean;
  walletBalance: string;
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;

  // Company
  company: CompanyProfile | null;
  setCompany: (profile: CompanyProfile) => void;

  // Employees
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'onboardingId' | 'inviteStatus' | 'weeklyHours' | 'salaryRevealed' | 'registeredAt' | 'payrollStatus'>) => Employee;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  revealSalary: (id: string) => void;

  // Attendance
  attendance: AttendanceRecord[];
  clockIn: (employeeId: string) => void;
  clockOut: (employeeId: string) => void;
  getEmployeeAttendance: (employeeId: string) => AttendanceRecord[];

  // Invites
  invites: OnboardingInvite[];
  sendInvite: (employeeId: string) => void;

  // Storage receipts
  storageReceipts: StorageReceipt[];
  addStorageReceipt: (action: string, category: StorageReceipt['category']) => void;

  // Payroll receipts
  payrollReceipts: PayrollReceipt[];

  // Arcium compute
  arciumReceipts: ArciumComputeReceipt[];
  runArciumCompute: () => Promise<void>;

  // AI agent
  agentLogs: AIAgentLog[];
  addAgentLog: (message: string, type: AIAgentLog['type']) => void;
  agentStatus: 'idle' | 'running' | 'complete';

  // Auto payroll
  autoPayEnabled: boolean;
  toggleAutoPay: () => void;
  runPayroll: (employeeId?: string) => Promise<void>;

  // UI
  isComputingArcium: boolean;
  isRunningPayroll: boolean;
}

export const useZeroPayStore = create<ZeroPayStore>()(
  persist(
    (set, get) => ({
      walletAddress: null,
      isWalletConnected: false,
      walletBalance: '0',
      connectWallet: (address: string) => {
        const balance = (Math.random() * 900 + 100).toFixed(4);
        set({ walletAddress: address, isWalletConnected: true, walletBalance: balance });
        get().addAgentLog(`Employer wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`, 'success');
        get().addStorageReceipt('Employer wallet session authenticated', 'system');
      },
      disconnectWallet: () => {
        set({ walletAddress: null, isWalletConnected: false, walletBalance: '0' });
      },

      company: null,
      setCompany: (profile: CompanyProfile) => {
        set({ company: profile });
        get().addStorageReceipt(`Company profile created: ${profile.name}`, 'system');
        get().addAgentLog(`Company profile "${profile.name}" saved to 0G Storage`, 'success');
      },

      employees: [],
      addEmployee: (employeeData) => {
        const id = nanoid(10);
        const onboardingId = nanoid(20);
        const newEmployee: Employee = {
          ...employeeData,
          id,
          onboardingId,
          inviteStatus: 'pending',
          weeklyHours: 0,
          salaryRevealed: false,
          payrollStatus: 'pending',
          registeredAt: new Date().toISOString(),
          avatarSeed: id,
        };
        set(state => ({ employees: [...state.employees, newEmployee] }));
        get().addStorageReceipt(`Employee registered: ${newEmployee.name}`, 'employee');
        get().addAgentLog(`New employee ${newEmployee.name} registered and stored on 0G Storage`, 'success');
        get().sendInvite(id);
        return newEmployee;
      },
      updateEmployee: (id, updates) => {
        set(state => ({
          employees: state.employees.map(e => e.id === id ? { ...e, ...updates } : e)
        }));
      },
      revealSalary: (id) => {
        set(state => ({
          employees: state.employees.map(e => e.id === id ? { ...e, salaryRevealed: true } : e)
        }));
        get().addAgentLog(`Confidential salary revealed for employee`, 'info');
      },

      attendance: [],
      clockIn: (employeeId: string) => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const existing = get().attendance.find(a => a.employeeId === employeeId && a.date === today);
        if (existing) return;

        const record: AttendanceRecord = {
          id: nanoid(10),
          employeeId,
          date: today,
          clockIn: now.toISOString(),
          payableHours: 0,
        };
        set(state => ({ attendance: [...state.attendance, record] }));
        const emp = get().employees.find(e => e.id === employeeId);
        get().addStorageReceipt(`Clock-in recorded: ${emp?.name} at ${now.toLocaleTimeString()}`, 'attendance');
        get().addAgentLog(`${emp?.name} clocked in at ${now.toLocaleTimeString()}`, 'info');
      },
      clockOut: (employeeId: string) => {
        const today = new Date().toISOString().split('T')[0];
        set(state => ({
          attendance: state.attendance.map(a => {
            if (a.employeeId === employeeId && a.date === today && !a.clockOut) {
              const clockOut = new Date().toISOString();
              const payableHours = computePayableHours(a.clockIn!, clockOut);
              return { ...a, clockOut, payableHours };
            }
            return a;
          })
        }));

        // Update weekly hours
        const weeklyHours = get().attendance
          .filter(a => a.employeeId === employeeId)
          .reduce((sum, a) => sum + a.payableHours, 0);
        get().updateEmployee(employeeId, { weeklyHours });

        const emp = get().employees.find(e => e.id === employeeId);
        const now = new Date();
        get().addStorageReceipt(`Clock-out recorded: ${emp?.name} at ${now.toLocaleTimeString()}`, 'attendance');
        get().addAgentLog(`${emp?.name} clocked out. Weekly hours updated: ${weeklyHours.toFixed(2)}h`, 'info');
      },
      getEmployeeAttendance: (employeeId: string) => {
        return get().attendance.filter(a => a.employeeId === employeeId);
      },

      invites: [],
      sendInvite: (employeeId: string) => {
        const employee = get().employees.find(e => e.id === employeeId);
        if (!employee) return;
        const company = get().company;

        const invite: OnboardingInvite = {
          id: nanoid(10),
          employeeId,
          employeeName: employee.name,
          employeeEmail: employee.email,
          companyName: company?.name || 'Your Company',
          sentAt: new Date().toISOString(),
          link: `/employee/onboard/${employee.onboardingId}`,
          status: 'sent',
        };

        set(state => ({
          invites: [...state.invites, invite],
          employees: state.employees.map(e =>
            e.id === employeeId
              ? { ...e, inviteStatus: 'sent', inviteSentAt: new Date().toISOString() }
              : e
          )
        }));
        get().addStorageReceipt(`Onboarding invite sent to ${employee.email}`, 'employee');
        get().addAgentLog(`Onboarding invite dispatched to ${employee.email}`, 'success');
      },

      storageReceipts: [],
      addStorageReceipt: (action: string, category: StorageReceipt['category']) => {
        const receipt: StorageReceipt = {
          id: nanoid(10),
          action,
          timestamp: new Date().toISOString(),
          txHash: generateStorageTxHash(),
          dataSize: `${(Math.random() * 4 + 0.5).toFixed(2)} KB`,
          status: 'confirmed',
          category,
        };
        set(state => ({ storageReceipts: [receipt, ...state.storageReceipts].slice(0, 100) }));
      },

      payrollReceipts: [],

      arciumReceipts: [],
      isComputingArcium: false,
      runArciumCompute: async () => {
        set({ isComputingArcium: true });
        get().addAgentLog('Initiating Arcium confidential compute engine...', 'info');
        get().addStorageReceipt('Arcium compute job submitted', 'compute');

        await new Promise(r => setTimeout(r, 2000));

        const employees = get().employees;
        const newReceipts: ArciumComputeReceipt[] = [];

        for (const emp of employees) {
          if (emp.weeklyHours > 0) {
            const salary = emp.weeklyHours * emp.hourlyRate;
            const receipt: ArciumComputeReceipt = {
              id: nanoid(10),
              employeeId: emp.id,
              employeeName: emp.name,
              computedAt: new Date().toISOString(),
              inputHash: generateTxHash().slice(0, 16),
              outputHash: generateTxHash().slice(0, 16),
              status: 'complete',
              encryptedResult: btoa(salary.toString()).slice(0, 24) + '==',
            };
            newReceipts.push(receipt);
            get().updateEmployee(emp.id, { confidentialSalary: salary, payrollStatus: 'computed' });
          }
        }

        set(state => ({
          arciumReceipts: [...newReceipts, ...state.arciumReceipts],
          isComputingArcium: false,
        }));

        get().addStorageReceipt('Arcium compute results sealed on 0G Storage', 'compute');
        get().addAgentLog(`Arcium confidential compute complete. ${newReceipts.length} salaries computed privately.`, 'success');
      },

      agentLogs: [],
      agentStatus: 'idle',
      addAgentLog: (message: string, type: AIAgentLog['type']) => {
        const log: AIAgentLog = {
          id: nanoid(6),
          message,
          type,
          timestamp: new Date().toISOString(),
        };
        set(state => ({ agentLogs: [log, ...state.agentLogs].slice(0, 50) }));
      },

      autoPayEnabled: false,
      toggleAutoPay: () => {
        const next = !get().autoPayEnabled;
        set({ autoPayEnabled: next });
        get().addAgentLog(
          next ? 'Autonomous Saturday payroll enabled. Agent will execute payroll every Saturday.' : 'Autonomous payroll disabled.',
          next ? 'success' : 'warning'
        );
        if (next) get().addStorageReceipt('AutoPay permission granted by employer', 'system');
      },

      isRunningPayroll: false,
      runPayroll: async (employeeId?: string) => {
        const { employees, walletAddress, walletBalance } = get();
        const targets = employeeId
          ? employees.filter(e => e.id === employeeId && e.payrollStatus === 'computed')
          : employees.filter(e => e.payrollStatus === 'computed');

        if (targets.length === 0) {
          get().addAgentLog('No employees with computed salaries ready for payroll.', 'warning');
          return;
        }

        const totalPayout = targets.reduce((sum, e) => sum + (e.confidentialSalary || 0), 0);
        const balance = parseFloat(walletBalance);

        if (balance < totalPayout) {
          get().addAgentLog(`Insufficient Employer Payroll Balance. Required: ${totalPayout.toFixed(4)} 0G — Available: ${balance.toFixed(4)} 0G`, 'error');
          return;
        }

        set({ isRunningPayroll: true, agentStatus: 'running' });
        get().addAgentLog('Autonomous Payroll Execution initiated from employer wallet...', 'info');

        await new Promise(r => setTimeout(r, 1500));

        const newReceipts: PayrollReceipt[] = [];

        for (const emp of targets) {
          await new Promise(r => setTimeout(r, 600));
          const txHash = generateTxHash();
          const receipt: PayrollReceipt = {
            id: nanoid(10),
            employeeId: emp.id,
            employeeName: emp.name,
            amount: emp.confidentialSalary || 0,
            txHash,
            timestamp: new Date().toISOString(),
            status: 'success',
            fromWallet: walletAddress || '',
            toWallet: emp.walletAddress || '0x000...0000',
          };
          newReceipts.push(receipt);
          get().updateEmployee(emp.id, { payrollStatus: 'paid' });
          get().addStorageReceipt(`Salary paid to ${emp.name}: ${emp.confidentialSalary?.toFixed(4)} 0G`, 'payroll');
          get().addAgentLog(`Payment sent to ${emp.name} — TX: ${txHash.slice(0, 10)}...`, 'success');
        }

        const newBalance = (balance - totalPayout).toFixed(4);
        set(state => ({
          payrollReceipts: [...newReceipts, ...state.payrollReceipts],
          walletBalance: newBalance,
          isRunningPayroll: false,
          agentStatus: 'complete',
        }));

        get().addStorageReceipt('Payroll batch receipts sealed on 0G Storage', 'payroll');
        get().addAgentLog(`Autonomous Payroll Execution Complete. ${newReceipts.length} payments processed.`, 'success');
      },
    }),
    {
      name: 'zeropay-store',
    }
  )
);
