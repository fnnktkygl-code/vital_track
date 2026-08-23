export type Language = 'fr' | 'en' | 'es';
export type Theme = 'dark' | 'light' | 'system';

export type VitalityCategory = 
  | 'electric' 
  | 'hybrid' 
  | 'mucus-forming' 
  | 'alkalizing' 
  | 'acid-forming';

export interface FoodItem {
  id: string;
  name: string;
  nameEn?: string;
  nameEs?: string;
  category: string;
  emoji: string;
  pral: number;
  nova: 1 | 2 | 3 | 4;
  electric?: boolean;
  hybrid?: boolean;
  mucusForming?: boolean;
  freshness?: number; // 0 - 100
  waterContent?: number; // percentage
  family?: string;
  benefits?: string[];
  precautions?: string[];
  minerals?: {
    potassium?: number;
    magnesium?: number;
    calcium?: number;
    sodium?: number;
    phosphorus?: number;
  };
}

export interface MealItemComponent {
  foodId?: string;
  name: string;
  portionGrams?: number;
  pral: number;
  nova: number;
  isElectric?: boolean;
  isHybrid?: boolean;
}

export interface MealEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'juice';
  name: string;
  emoji: string;
  items: MealItemComponent[];
  pral: number;
  nova: number;
  hybrid: boolean;
  freshnessScore: number; // 0 - 100
  photoDataUrl?: string;
  aiAnalyzed?: boolean;
  notes?: string;
}

export type FastingType = '16:8' | '18:6' | '20:4' | '24h' | '36h' | '48h' | '72h' | 'dry' | 'custom';

export interface FastingSession {
  id: string;
  startTime: number; // timestamp ms
  endTime?: number; // timestamp ms
  targetHours: number;
  type: FastingType;
  isActive: boolean;
  notes?: string;
  feelingScore?: number; // 1 to 5
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // in kg
  note?: string;
  hasPhoto?: boolean;
  photoDataUrl?: string;
  photoTag?: 'front' | 'side' | 'back' | 'scale';
}

export interface BreathingSession {
  id: string;
  date: string; // YYYY-MM-DD HH:mm
  type: 'wim-hof' | 'cardiac-coherence' | '4-7-8' | 'box';
  rounds: number;
  avgRetentionSec: number;
  retentions: number[]; // seconds per round
}

export interface UserProfile {
  name: string;
  age: number;
  height: number; // cm
  currentWeight: number; // kg
  targetWeight: number; // kg
  fastingGoalHours: number;
  bioregion: 'boreal' | 'temperate' | 'mediterranean' | 'tropical' | 'arid';
  country: string;
  city: string;
  restrictions: string; // e.g. "sans gluten, intolérance arachides"
  memories: string; // custom instructions for AI
  customGeminiKey?: string;
  protocol: 'VITALIST' | 'SEBI' | 'EHRET' | 'MORSE' | 'HYGIENIST';
  language: Language;
  theme: Theme;
}

export interface DailyRoutineItem {
  id: string;
  title: string;
  timeSlot: string;
  description: string;
  emoji: string;
  completed: boolean;
}

export interface ClinicalEmunctoryStatus {
  name: string;
  score: number; // 0 - 100
  status: 'optimal' | 'moderate' | 'congested' | 'critical';
  details: string;
  recommendations: string[];
}

export interface ClinicalAssessment {
  id: string;
  date: string;
  overallScore: number;
  emunctories: {
    kidneys: ClinicalEmunctoryStatus;
    colon: ClinicalEmunctoryStatus;
    liver: ClinicalEmunctoryStatus;
    lungs: ClinicalEmunctoryStatus;
    skin: ClinicalEmunctoryStatus;
  };
  summary: string;
  actionPlan: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  isThinking?: boolean;
  thoughtProcess?: string[];
  latencyMs?: number;
  modelUsed?: string;
}
