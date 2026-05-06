'use client';

import { getWeekDates } from '@/lib/payroll';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

interface Props {
  employees: any[];
  attendance: any[];
}

export function AttendanceChart({ employees, attendance }: Props) {
  const weekDates = getWeekDates();
  const today = new Date().toISOString().split('T')[0];

  const chartData = weekDates.map((date, i) => {
    const dayAtt = attendance.filter(a => a.date === date);
    const totalHours = dayAtt.reduce((s: number, a: any) => s + (parseFloat(a.payable_hours) || 0), 0);
    const present = dayAtt.filter((a: any) => a.clock_in).length;
    return { day: DAYS[i], hours: parseFloat(totalHours.toFixed(2)), present, total: employees.length, date };
  });

  const totalWeekHours = chartData.reduce((s, d) => s + d.hours, 0);
  const avgHours = employees.length > 0 ? (totalWeekHours / employees.length).toFixed(1) : '0';
  const todayIndex = weekDates.indexOf(today);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
        <div className="font-semibold text-slate-900 mb-2">{label}</div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4"><span className="text-slate-500">Total Hours</span><span className="font-mono font-medium text-brand-700">{d.hours}h</span></div>
          <div className="flex justify-between gap-4"><span className="text-slate-500">Present</span><span className="font-medium text-emerald-700">{d.present}/{d.total}</span></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm">Weekly Attendance Analytics</div>
            <div className="text-xs text-slate-400">Payable hours Mon–Fri</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="text-lg font-bold text-slate-900">{totalWeekHours.toFixed(1)}h</div>
            <div className="text-xs text-slate-400">Total This Week</div>
          </div>
          <div>
            <div className="text-lg font-bold text-brand-600">{avgHours}h</div>
            <div className="text-xs text-slate-400">Avg Per Employee</div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barSize={32} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 'dataMax + 2']} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={index === todayIndex ? '#2563eb' : entry.hours > 0 ? '#93c5fd' : '#e2e8f0'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-brand-600" /><span className="text-slate-500">Today</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-300" /><span className="text-slate-500">Recorded</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-200" /><span className="text-slate-500">No data</span></div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="w-3 h-3" />
          <span>Week of {new Date(weekDates[0] || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}
