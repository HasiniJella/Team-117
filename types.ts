export interface HealthLog {
  id: string;
  date: string; // ISO string
  heartRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  sleepHours?: number;
  steps?: number;
  symptoms?: string;
}

export interface PeriodCycle {
  id: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
}

export interface MedicationReminder {
  id: string;
  name: string;
  dosage: string;
  time: string; // "HH:mm"
  active: boolean;
}

export interface MedicalDocument {
  id: string;
  name: string;
  type: string;
  data?: string; // base64 encoded data URL
  uploadedAt: string; // ISO string
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  isLoading?: boolean;
}

export interface UserProfile {
  name?: string;
  age?: number;
  gender?: 'Female' | 'Male' | 'Other';
  bloodType?: string;
  allergies?: string;
  medications?: string;
  conditions?: string;
  weight?: number; // in kg
  height?: number; // in cm
  healthGoals?: string;
}

export interface PeriodLog {
  date: string; // "YYYY-MM-DD"
  moods: string[];
  symptoms: string[];
  notes?: string;
}

export interface DetectedReminder {
    name: string;
    dosage: string;
    time: string;
}

export interface AnalysisResult {
    summary?: string;
    medication_reminders?: DetectedReminder[];
    error?: string;
}
