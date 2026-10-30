// ═══════════════════════════════════════
// Life OS — Типы данных
// ═══════════════════════════════════════

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string; // ISO date
  comment: string;
  recurring: 'none' | 'daily' | 'weekly' | 'monthly';
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  deadline: string; // ISO date
  time: string; // HH:mm or ''
  goalId: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'planned' | 'in_progress' | 'done' | 'postponed';
  scheduleDate: string | null; // when scheduled
  scheduleTime: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  type: 'financial' | 'habit' | 'project';
  deadline: string;
  targetAmount: number;
  savedAmount: number;
  milestones: { id: string; title: string; done: boolean }[];
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  taskId: string | null;
  type: 'task' | 'rest' | 'no_budget' | 'custom';
  color: string;
}

export interface EnergyLog {
  id: string;
  delta: number;
  reason: string;
  timestamp: string;
  date: string;
}

export interface Badge {
  id: string;
  earnedAt: string;
}

export interface UserProfile {
  name: string;
  monthlyBudget: number;
  currency: string;
  dayStart: string; // HH:mm
  onboarded: boolean;
}

export interface AppState {
  profile: UserProfile;
  energy: number;
  xp: number;
  transactions: Transaction[];
  tasks: Task[];
  goals: Goal[];
  schedule: ScheduleEvent[];
  energyLog: EnergyLog[];
  badges: Badge[];
  schemaVersion: number;
}

export type Screen = 'dashboard' | 'finance' | 'tasks' | 'goals' | 'schedule' | 'profile';
