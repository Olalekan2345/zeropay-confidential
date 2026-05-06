export function computePayableHours(clockInISO: string, clockOutISO: string): number {
  const WORK_START = 9; // 9:00 AM
  const WORK_END = 17;  // 5:00 PM
  const MAX_HOURS = 8;

  const clockIn = new Date(clockInISO);
  const clockOut = new Date(clockOutISO);

  const dayOfWeek = clockIn.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return 0;

  const workStart = new Date(clockIn);
  workStart.setHours(WORK_START, 0, 0, 0);

  const workEnd = new Date(clockIn);
  workEnd.setHours(WORK_END, 0, 0, 0);

  const effectiveStart = clockIn < workStart ? workStart : clockIn;
  const effectiveEnd = clockOut > workEnd ? workEnd : clockOut;

  if (effectiveEnd <= effectiveStart) return 0;

  const hours = (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60);
  return Math.min(hours, MAX_HOURS);
}

export function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function generateStorageTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0g';
  for (let i = 0; i < 40; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function formatWalletAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getWeekDates(): string[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));

  const dates: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function isSaturday(): boolean {
  return new Date().getDay() === 6;
}

export function nextSaturdayMs(): number {
  const now = new Date();
  const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7;
  const nextSat = new Date(now);
  nextSat.setDate(now.getDate() + daysUntilSat);
  nextSat.setHours(9, 0, 0, 0);
  return nextSat.getTime() - now.getTime();
}

export function generateMockWalletAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}
