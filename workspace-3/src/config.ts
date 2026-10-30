// ═══════════════════════════════════════
// Life OS — Игровые константы
// ═══════════════════════════════════════

export const ENERGY = {
  MAX: 100,
  START: 70,
  TASK_DONE: 8,
  TASK_HARD_DONE: 12,
  EARLY_BONUS_XP: 5,
  OVERDUE_ENERGY: -5,
  OVERDUE_XP: -10,
  OVERDUE_DAILY_CAP: -15,
  OVERSPEND_ENERGY: -10,
  GOAL_COMPLETED_ENERGY: 25,
  GOAL_COMPLETED_XP: 100,
  REST_DONE_ENERGY: 5,
  XP_PER_TASK: 20,
  XP_PER_HARD_TASK: 35,
  XP_PER_LEVEL: 200,
} as const;

export const CATEGORIES = [
  { id: 'food', label: 'Еда', color: '#3E8E7E' },
  { id: 'transport', label: 'Транспорт', color: '#5B8DB8' },
  { id: 'housing', label: 'Жильё', color: '#8B6DB0' },
  { id: 'health', label: 'Здоровье', color: '#D97777' },
  { id: 'entertainment', label: 'Развлечения', color: '#D69A3C' },
  { id: 'other', label: 'Другое', color: '#6B7785' },
] as const;

export const TASK_PRIORITIES = [
  { id: 'low', label: 'Низкий', color: '#6B7785' },
  { id: 'medium', label: 'Средний', color: '#D69A3C' },
  { id: 'high', label: 'Высокий', color: '#D97777' },
] as const;

export const TASK_DIFFICULTIES = [
  { id: 'easy', label: 'Лёгкая', xpMultiplier: 1, energyMultiplier: 1 },
  { id: 'medium', label: 'Средняя', xpMultiplier: 1.2, energyMultiplier: 1 },
  { id: 'hard', label: 'Сложная', xpMultiplier: 1.75, energyMultiplier: 1.5 },
] as const;

export const BADGES = [
  { id: 'week_budget', label: 'Неделя в бюджете', description: '7 дней без перерасхода', icon: '💰' },
  { id: 'streak_5', label: '5 квестов подряд', description: '5 задач подряд без просрочки', icon: '⚡' },
  { id: 'goal_done', label: 'Цель закрыта', description: 'Закрыта первая цель', icon: '🎯' },
  { id: 'level_5', label: 'Уровень 5', description: 'Достигнут 5 уровень', icon: '⭐' },
  { id: 'energy_full', label: 'Полная энергия', description: 'Энергия достигла 100', icon: '🔋' },
] as const;

export const THEME_COLORS = {
  success: '#3E8E7E',
  warning: '#D69A3C',
  danger: '#D97777',
} as const;
