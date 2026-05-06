'use client';

import { useState } from 'react';
import { Employee } from '@/lib/hooks/useEmployees';
import { AttendanceRecord } from '@/lib/hooks/useAttendance';
import { formatWalletAddress } from '@/lib/payroll';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EXPLORER_URL } from '@/lib/wagmi';
import {
  LogIn, LogOut, Zap, Lock, CheckCircle, Clock, Shield,
  User, Mail, ExternalLink, Loader2, Pencil, Trash2, AlertTriangle, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function PayrollBadge({ status }: { status: string }) {
  if (status === 'paid') return <Badge variant="success"><CheckCircle className="w-3 h-3" />Paid</Badge>;
  if (status === 'computed') return <Badge variant="warning"><Shield className="w-3 h-3" />Computed</Badge>;
  return <Badge variant="secondary"><Clock className="w-3 h-3" />Pending</Badge>;
}

function InviteBadge({ status }: { status: string }) {
  if (status === 'accepted') return <Badge variant="success">Onboarded</Badge>;
  if (status === 'sent') return <Badge variant="default">Invite Sent</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

interface Props {
  employees: Employee[];
  attendance: AttendanceRecord[];
  onClockIn: (id: string, name: string) => Promise<any>;
  onClockOut: (id: string, name: string) => Promise<any>;
  getTodayRecord: (id: string) => AttendanceRecord | null;
  payrollActions: any;
  companyName: string;
  onResendInvite: (emp: Employee) => Promise<any>;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<any>;
  onDeleteEmployee: (id: string) => Promise<any>;
  onPayrollComplete?: () => void;
}

export function EmployeeTable({
  employees, attendance, onClockIn, onClockOut, getTodayRecord,
  payrollActions, companyName, onResendInvite, onUpdateEmployee, onDeleteEmployee, onPayrollComplete,
}: Props) {
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [decryptedSalaries, setDecryptedSalaries] = useState<Record<string, number>>({});
  const [revealLoading, setRevealLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Edit dialog state
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', hourly_rate: '' });
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm state
  const [deleteEmp, setDeleteEmp] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openEdit = (emp: Employee) => {
    setEditEmp(emp);
    setEditForm({ name: emp.name, email: emp.email, hourly_rate: emp.hourly_rate.toString() });
  };

  const handleEdit = async () => {
    if (!editEmp) return;
    setEditLoading(true);
    try {
      await onUpdateEmployee(editEmp.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        hourly_rate: parseFloat(editForm.hourly_rate) as any,
      });
      showToast(`${editForm.name} updated`, 'success');
      setEditEmp(null);
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteEmp) return;
    setDeleteLoading(true);
    try {
      await onDeleteEmployee(deleteEmp.id);
      showToast(`${deleteEmp.name} deleted`, 'success');
      setDeleteEmp(null);
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleClockIn = async (emp: Employee) => {
    setActionLoading(p => ({ ...p, [emp.id]: 'in' }));
    try {
      await onClockIn(emp.id, emp.name);
      showToast(`${emp.name} clocked in`, 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[emp.id]; return n; });
    }
  };

  const handleClockOut = async (emp: Employee) => {
    setActionLoading(p => ({ ...p, [emp.id]: 'out' }));
    try {
      await onClockOut(emp.id, emp.name);
      showToast(`${emp.name} clocked out`, 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[emp.id]; return n; });
    }
  };

  const handleRevealSalary = async (emp: Employee) => {
    if (!emp.encrypted_salary || !emp.salary_iv) return;
    setRevealLoading(emp.id);
    showToast('MetaMask will ask you to sign to verify identity...', 'success');
    try {
      const amount = await payrollActions.decryptEmployeeSalary(
        emp.encrypted_salary,
        emp.salary_iv,
        emp.compute_hash
      );
      setDecryptedSalaries(p => ({ ...p, [emp.id]: amount }));
      showToast('Salary revealed — signature verified', 'success');
    } catch (e: any) {
      showToast(`Cannot reveal: ${e.message}`, 'error');
    } finally {
      setRevealLoading(null);
    }
  };

  const handlePayNow = async (emp: Employee) => {
    if (!decryptedSalaries[emp.id]) {
      showToast('Reveal salary first before paying', 'error');
      return;
    }
    setActionLoading(p => ({ ...p, [emp.id]: 'pay' }));
    try {
      await payrollActions.executePayroll([emp], decryptedSalaries);
      showToast(`Paid ${emp.name} — ${decryptedSalaries[emp.id].toFixed(4)} 0G`, 'success');
      onPayrollComplete?.();
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[emp.id]; return n; });
    }
  };

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
          <User className="w-6 h-6 text-slate-400" />
        </div>
        <div className="text-center">
          <div className="font-medium text-slate-700">No employees yet</div>
          <div className="text-sm text-slate-400 mt-1">Register your first employee to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {toast && (
        <div className={cn(
          'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl transition-all',
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        )}>
          {toast.msg}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editEmp} onOpenChange={open => !open && setEditEmp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Hourly Rate (0G)</Label>
              <Input type="number" step="0.0001" min="0" value={editForm.hourly_rate} onChange={e => setEditForm(p => ({ ...p, hourly_rate: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmp(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editLoading || !editForm.name || !editForm.email || !editForm.hourly_rate}>
              {editLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteEmp} onOpenChange={open => !open && setDeleteEmp(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Employee
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently delete <strong>{deleteEmp?.name}</strong>? This will remove all their attendance records and cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteEmp(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Deleting...</> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto">
        <table className="w-full zeropay-table">
          <thead>
            <tr>
              <th className="text-left">Employee</th>
              <th className="text-left">Role</th>
              <th className="text-left">Wallet</th>
              <th className="text-center">Rate/hr</th>
              <th className="text-center">Clock In</th>
              <th className="text-center">Clock Out</th>
              <th className="text-center">Week Hrs</th>
              <th className="text-left">Salary</th>
              <th className="text-center">Invite</th>
              <th className="text-center">Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const todayRec = getTodayRecord(emp.id);
              const isClockedIn = !!(todayRec?.clock_in && !todayRec?.clock_out);
              const isClockedOut = !!(todayRec?.clock_in && todayRec?.clock_out);
              const loading = actionLoading[emp.id];
              const decrypted = decryptedSalaries[emp.id];

              return (
                <tr key={emp.id} className="group">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {emp.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{emp.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Mail className="w-2.5 h-2.5" />{emp.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm font-medium text-slate-700">{emp.role}</div>
                    <div className="text-xs text-slate-400">{emp.department}</div>
                  </td>
                  <td>
                    {emp.wallet_address ? (
                      <a href={`${EXPLORER_URL}/address/${emp.wallet_address}`} target="_blank"
                        className="font-mono text-xs text-brand-600 hover:underline flex items-center gap-1">
                        {formatWalletAddress(emp.wallet_address)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300 italic">Not linked</span>
                    )}
                  </td>
                  <td className="text-center">
                    <span className="font-mono text-sm font-medium">{parseFloat(emp.hourly_rate.toString()).toFixed(2)}</span>
                    <span className="text-xs text-slate-400 ml-1">0G</span>
                  </td>
                  <td className="text-center">
                    {todayRec?.clock_in ? (
                      <div className="text-xs font-mono text-emerald-700 font-medium">
                        {new Date(todayRec.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="text-center">
                    {todayRec?.clock_out ? (
                      <div className="text-xs font-mono text-slate-600 font-medium">
                        {new Date(todayRec.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="text-center">
                    <span className={cn('font-mono text-sm font-semibold', emp.weekly_hours > 0 ? 'text-slate-900' : 'text-slate-300')}>
                      {parseFloat(emp.weekly_hours?.toString() || '0').toFixed(2)}h
                    </span>
                  </td>
                  <td>
                    {emp.payroll_status === 'paid' ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-700 font-medium text-xs">Paid</span>
                      </div>
                    ) : emp.encrypted_salary ? (
                      <div className="flex items-center gap-2">
                        {decrypted !== undefined ? (
                          <span className="font-mono text-sm font-medium text-slate-900">{decrypted.toFixed(4)} 0G</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-violet-500" />
                            <span className="font-mono text-sm text-slate-400">••••••</span>
                          </div>
                        )}
                        {decrypted === undefined && (
                          <button onClick={() => handleRevealSalary(emp)} disabled={revealLoading === emp.id}
                            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium px-2 py-0.5 rounded-md bg-brand-50 hover:bg-brand-100 transition-colors">
                            {revealLoading === emp.id
                              ? <><Loader2 className="w-3 h-3 animate-spin" />Signing...</>
                              : <><Shield className="w-3 h-3" />Sign to Reveal</>}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">Not computed</span>
                    )}
                  </td>
                  <td className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <InviteBadge status={emp.invite_status} />
                      {emp.invite_status === 'sent' && (
                        <button onClick={() => onResendInvite(emp)} className="text-xs text-slate-400 hover:text-brand-600">Resend</button>
                      )}
                    </div>
                  </td>
                  <td className="text-center"><PayrollBadge status={emp.payroll_status} /></td>
                  <td>
                    <div className="flex items-center gap-1 justify-center flex-wrap">
                      {emp.invite_status !== 'accepted' ? (
                        <span className="text-xs text-slate-300 italic">Not onboarded</span>
                      ) : (
                        <>
                          {!isClockedIn && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => handleClockIn(emp)} disabled={loading === 'in'}>
                              {loading === 'in' ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogIn className="w-3 h-3" />}In
                            </Button>
                          )}
                          {isClockedIn && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-amber-700 border-amber-200 hover:bg-amber-50"
                              onClick={() => handleClockOut(emp)} disabled={loading === 'out'}>
                              {loading === 'out' ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}Out
                            </Button>
                          )}
                        </>
                      )}
                      {emp.payroll_status === 'computed' && emp.wallet_address && (
                        <Button size="sm" variant="success" className="h-7 text-xs gap-1"
                          onClick={() => handlePayNow(emp)} disabled={loading === 'pay'}>
                          {loading === 'pay' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}Pay
                        </Button>
                      )}
                      <button onClick={() => openEdit(emp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="Edit employee">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteEmp(emp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete employee">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
