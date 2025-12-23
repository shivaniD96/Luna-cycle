
export enum CyclePhase {
  MENSTRUAL = 'Menstrual',
  FOLLICULAR = 'Follicular',
  OVULATION = 'Ovulation',
  LUTEAL = 'Luteal',
}

export type AIProvider = 'gemini' | 'grok';

export interface SymptomLog {
  date: string;
  moods: string[];
  energy: number; // 1-5
  physicalSymptoms: string[];
  notes: string;
}

export interface PeriodLog {
  date: string;
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
    aiProvider: AIProvider;
    customApiKey?: string;
  };
}

export interface LogPayload {
  date: string;
  period: PeriodLog | null;
  symptom: SymptomLog | null;
}

export interface AIAdviceRequest {
  phase: CyclePhase;
  daysRemaining: number;
  symptoms: string[];
  role: 'user' | 'partner';
  provider?: AIProvider;
  customKey?: string;
}

// Added provider and customKey to PartnerData to fix type mismatch errors when 
// sharing cycle data and AI configuration with the partner view.
export interface PartnerData {
  phase: CyclePhase;
  daysUntilNext: number;
  symptoms: string[];
  avgCycle: number;
  provider?: AIProvider;
  customKey?: string;
}
