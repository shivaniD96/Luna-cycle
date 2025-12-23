import { addDays, differenceInDays, format, parseISO, startOfDay } from 'date-fns';
import { PeriodLog, CyclePhase } from '../types';

export const calculateNextPeriod = (logs: PeriodLog[], avgCycle: number = 28) => {
  if (!logs || logs.length === 0) return null;
  const sorted = [...logs]
    .filter(l => l.date || (l as any).startDate)
    .sort((a, b) => (a.date || (a as any).startDate).localeCompare(b.date || (b as any).startDate));
  
  if (sorted.length === 0) return null;
  const lastDateStr = sorted[sorted.length - 1].date || (sorted[sorted.length - 1] as any).startDate;
  const lastStart = parseISO(lastDateStr);
  return addDays(lastStart, avgCycle);
};

export const getCurrentCycleDay = (logs: PeriodLog[]) => {
  if (!logs || logs.length === 0) return 0;
  
  const sorted = [...logs]
    .filter(l => l.date || (l as any).startDate)
    .sort((a, b) => (a.date || (a as any).startDate).localeCompare(b.date || (b as any).startDate));
  
  if (sorted.length === 0) return 0;

  let lastLog = sorted[sorted.length - 1];
  let currentPeriodStart = parseISO(lastLog.date || (lastLog as any).startDate);
  
  for (let i = sorted.length - 1; i > 0; i--) {
    const d1 = parseISO(sorted[i].date || (sorted[i] as any).startDate);
    const d2 = parseISO(sorted[i-1].date || (sorted[i-1] as any).startDate);
    if (differenceInDays(d1, d2) > 2) {
      currentPeriodStart = d1;
      break;
    } else {
      currentPeriodStart = d2;
    }
  }

  return differenceInDays(startOfDay(new Date()), startOfDay(currentPeriodStart)) + 1;
};

export const determinePhase = (day: number, avgCycle: number = 28, avgPeriod: number = 5): CyclePhase => {
  if (day <= 0) return CyclePhase.FOLLICULAR; // Default if no data
  if (day <= avgPeriod) return CyclePhase.MENSTRUAL;
  if (day <= avgCycle - 14 - 3) return CyclePhase.FOLLICULAR;
  if (day <= avgCycle - 14 + 3) return CyclePhase.OVULATION;
  return CyclePhase.LUTEAL;
};

export const getCycleSummary = (logs: PeriodLog[], defaultAvg: number = 28) => {
  const starts = getPeriodStartDates(logs);
  if (starts.length < 2) return defaultAvg;
  
  let totalDays = 0;
  for (let i = 1; i < starts.length; i++) {
    totalDays += differenceInDays(starts[i], starts[i-1]);
  }
  return Math.round(totalDays / (starts.length - 1));
};

export const getPeriodStartDates = (logs: PeriodLog[]): Date[] => {
  if (!logs || logs.length === 0) return [];
  const sorted = [...logs]
    .filter(l => l.date || (l as any).startDate)
    .sort((a, b) => (a.date || (a as any).startDate).localeCompare(b.date || (b as any).startDate));
    
  if (sorted.length === 0) return [];

  const firstDateStr = sorted[0].date || (sorted[0] as any).startDate;
  const starts: Date[] = [parseISO(firstDateStr)];
  
  for (let i = 1; i < sorted.length; i++) {
    const d1 = parseISO(sorted[i].date || (sorted[i] as any).startDate);
    const d2 = parseISO(sorted[i-1].date || (sorted[i-1] as any).startDate);
    if (differenceInDays(d1, d2) > 2) {
      starts.push(d1);
    }
  }
  return starts;
};

export const getDetailedHistory = (logs: PeriodLog[]) => {
  const starts = getPeriodStartDates(logs);
  return starts.map((start, index) => {
    const nextStart = starts[index + 1];
    const cycleLength = nextStart ? differenceInDays(nextStart, start) : null;
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      cycleLength
    };
  }).reverse();
};