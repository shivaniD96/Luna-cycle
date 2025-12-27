import { addDays, differenceInDays, format, isSameDay, isBefore } from 'date-fns';
import { PeriodLog, CyclePhase } from '../types';

// Use native Date constructor instead of missing parseISO
// Use manual midnight setting instead of missing startOfDay

export const calculateNextPeriod = (logs: PeriodLog[], avgCycle: number = 28) => {
  if (!logs || logs.length === 0) return null;
  const starts = getPeriodStartDates(logs);
  if (starts.length === 0) return null;
  
  const lastStart = starts[starts.length - 1];
  return addDays(lastStart, avgCycle);
};

export const getCurrentCycleDay = (logs: PeriodLog[]) => {
  if (!logs || logs.length === 0) return 0;
  const starts = getPeriodStartDates(logs);
  if (starts.length === 0) return 0;
  
  const lastStart = starts[starts.length - 1];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastStartDay = new Date(lastStart);
  lastStartDay.setHours(0, 0, 0, 0);
  
  return differenceInDays(today, lastStartDay) + 1;
};

export const getPhaseForDate = (targetDate: Date, logs: PeriodLog[], avgCycle: number = 28, avgPeriod: number = 5): CyclePhase => {
  const starts = getPeriodStartDates(logs);
  if (starts.length === 0) return CyclePhase.FOLLICULAR;

  const sortedStarts = [...starts].sort((a, b) => b.getTime() - a.getTime());
  let lastStart = sortedStarts.find(s => isBefore(s, targetDate) || isSameDay(s, targetDate));

  if (!lastStart) {
    const firstStart = sortedStarts[sortedStarts.length - 1];
    const daysBefore = differenceInDays(firstStart, targetDate);
    const dayInCycle = (avgCycle - (daysBefore % avgCycle)) % avgCycle;
    return determinePhase(dayInCycle || avgCycle, avgCycle, avgPeriod);
  }

  const d1 = new Date(targetDate);
  d1.setHours(0, 0, 0, 0);
  const d2 = new Date(lastStart);
  d2.setHours(0, 0, 0, 0);
  const day = differenceInDays(d1, d2) + 1;
  const normalizedDay = ((day - 1) % avgCycle) + 1;

  return determinePhase(normalizedDay, avgCycle, avgPeriod);
};

export const determinePhase = (day: number, avgCycle: number = 28, avgPeriod: number = 5): CyclePhase => {
  if (day <= 0) return CyclePhase.FOLLICULAR;
  if (day <= avgPeriod) return CyclePhase.MENSTRUAL;
  if (day <= avgCycle - 14 - 3) return CyclePhase.FOLLICULAR;
  if (day <= avgCycle - 14 + 2) return CyclePhase.OVULATION;
  return CyclePhase.LUTEAL;
};

/**
 * Predicts the fertility window (approx. 5 days leading to ovulation + day of)
 */
export const isFertileWindow = (date: Date, lastStart: Date, avgCycle: number = 28): boolean => {
  const d1 = new Date(date);
  d1.setHours(0, 0, 0, 0);
  const d2 = new Date(lastStart);
  d2.setHours(0, 0, 0, 0);
  const day = differenceInDays(d1, d2) + 1;
  const normalizedDay = ((day - 1) % avgCycle) + 1;
  const ovulationDay = avgCycle - 14;
  return normalizedDay >= (ovulationDay - 5) && normalizedDay <= ovulationDay;
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
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    
  if (sorted.length === 0) return [];

  // Use native Date constructor instead of missing parseISO
  const starts: Date[] = [new Date(sorted[0].date)];
  
  for (let i = 1; i < sorted.length; i++) {
    const d1 = new Date(sorted[i].date);
    const d2 = new Date(sorted[i-1].date);
    if (differenceInDays(d1, d2) > 2) {
      starts.push(d1);
    }
  }
  return starts;
};