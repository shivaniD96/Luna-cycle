
import { addDays, differenceInDays, format, parseISO, startOfDay } from 'date-fns';
import { PeriodLog, CyclePhase } from '../types';

export const calculateNextPeriod = (logs: PeriodLog[], avgCycle: number = 28) => {
  if (logs.length === 0) return null;
  const lastStart = parseISO(logs[logs.length - 1].startDate);
  return addDays(lastStart, avgCycle);
};

export const getCurrentCycleDay = (logs: PeriodLog[]) => {
  if (logs.length === 0) return 0;
  const lastStart = parseISO(logs[logs.length - 1].startDate);
  return differenceInDays(startOfDay(new Date()), startOfDay(lastStart)) + 1;
};

export const determinePhase = (day: number, avgCycle: number = 28, avgPeriod: number = 5): CyclePhase => {
  if (day <= avgPeriod) return CyclePhase.MENSTRUAL;
  if (day <= avgCycle - 14 - 3) return CyclePhase.FOLLICULAR;
  if (day <= avgCycle - 14 + 3) return CyclePhase.OVULATION;
  return CyclePhase.LUTEAL;
};

export const getCycleSummary = (logs: PeriodLog[], avgCycle: number = 28) => {
  if (logs.length < 2) return avgCycle;
  let totalDays = 0;
  for (let i = 1; i < logs.length; i++) {
    totalDays += differenceInDays(parseISO(logs[i].startDate), parseISO(logs[i-1].startDate));
  }
  return Math.round(totalDays / (logs.length - 1));
};

export const getDetailedHistory = (logs: PeriodLog[]) => {
  return logs.map((log, index) => {
    const nextLog = logs[index + 1];
    const cycleLength = nextLog 
      ? differenceInDays(parseISO(nextLog.startDate), parseISO(log.startDate)) 
      : null;
    
    return {
      ...log,
      cycleLength
    };
  }).reverse(); // Most recent first
};
