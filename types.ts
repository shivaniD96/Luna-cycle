
export enum CyclePhase {
  MENSTRUAL = 'Menstrual',
  FOLLICULAR = 'Follicular',
  OVULATION = 'Ovulation',
  LUTEAL = 'Luteal',
}

export interface SymptomLog {
  date: string;
  moods: string[]; // Changed from mood: string
  energy: number; // 1-5
  physicalSymptoms: string[];
  notes: string;
}

export interface PeriodLog {
  startDate: string;
  endDate?: string;
  intensity: 'light' | 'medium' | 'heavy';
}

export interface UserData {
  logs: PeriodLog[];
  symptoms: SymptomLog[];
  settings: {
    averageCycleLength: number;
    averagePeriodLength: number;
    privacyPin?: string;
    lockMethod?: 'pin' | 'google';
    googleUserEmail?: string;
  };
}

export interface LogPayload {
  period: PeriodLog | null;
  symptom: SymptomLog | null;
}

export interface AIAdviceRequest {
  phase: CyclePhase;
  daysRemaining: number;
  symptoms: string[];
  role: 'user' | 'partner';
}

export interface PartnerData {
  phase: CyclePhase;
  daysUntilNext: number;
  symptoms: string[];
  avgCycle: number;
}
