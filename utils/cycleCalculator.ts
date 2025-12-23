
import { addDays, differenceInDays, format, parseISO, startOfDay, isSameDay, isWithinInterval, subDays } from 'date-fns';
import { PeriodLog, CyclePhase } from '../types';

export const calculateNextPeriod = (logs: PeriodLog[], avgCycle: number = 28) => {
  if (logs.length === 0) return null;
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const lastStart = parseISO(sorted[sorted.length - 1].date);
  return addDays(lastStart, avgCycle);
};

export const getCurrentCycleDay = (logs: PeriodLog[]) => {
  if (logs.length === 0) return 0;
  // To find the current cycle day, we need the start date of the *current* period
  // We look for the most recent log that is more than a few days away from the previous one
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  let currentPeriodStart = parseISO(sorted[sorted.length - 1].date);
  
  // Trace back to the first day of this specific streak
  for (let i = sorted.length - 1; i > 0; i--) {
    const d1 = parseISO(sorted[i].date);
    const d2 = parseISO(sorted[i-1].date);
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
  if (logs.length === 0) return [];
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const starts: Date[] = [parseISO(sorted[0].date)];
  
  for (let i = 1; i < sorted.length; i++) {
    const d1 = parseISO(sorted[i].date);
    const d2 = parseISO(sorted[i-1].date);
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
