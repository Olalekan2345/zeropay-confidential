export interface Employee {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
  hourlyRate: number;
  department: string;
  role: string;
  onboardingId: string;
  inviteStatus: 'pending' | 'sent' | 'accepted';
  inviteSentAt?: string;
  payrollStatus: 'pending' | 'computed' | 'paid';
  weeklyHours: number;
  confidentialSalary?: number;
  salaryRevealed: boolean;
  registeredAt: string;
  avatarSeed?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  payableHours: number;
}

export interface StorageReceipt {
  id: string;
  action: string;
  timestamp: string;
  txHash: string;
  dataSize: string;
  status: 'confirmed' | 'pending';
  category: 'employee' | 'attendance' | 'payroll' | 'compute' | 'system';
}

export interface PayrollReceipt {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  txHash: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  fromWallet: string;
  toWallet: string;
}

export interface AIAgentLog {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

export interface ArciumComputeReceipt {
  id: string;
  employeeId: string;
  employeeName: string;
  computedAt: string;
  inputHash: string;
  outputHash: string;
  status: 'pending' | 'computing' | 'complete';
  encryptedResult: string;
}

export interface CompanyProfile {
  name: string;
  walletAddress: string;
  industry: string;
  size: string;
  createdAt: string;
  autoPayEnabled: boolean;
  balance: string;
}

export interface OnboardingInvite {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  companyName: string;
  sentAt: string;
  link: string;
  status: 'sent' | 'opened' | 'completed';
}
