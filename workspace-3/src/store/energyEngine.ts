import { AppState, Task, Transaction, Goal, ScheduleEvent, EnergyLog } from '../types';
import { ENERGY } from '../config';
import { startOfDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isPast, parseISO, differenceInDays, format } from 'date-fns';

// ═══════════════════════════════════════
// Свободные деньги сегодня
// ═══════════════════════════════════════
export function calcFreeMoney(state: AppState): { amount: number; status: 'ok' | 'risk' | 'overspend' } {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
  const today = startOfDay(now);
  const daysLeft = differenceInDays(monthEnd, today) + 1;

  const monthExpenses = state.transactions
    .filter(t => t.type === 'expense' && parseISO(t.date) >= monthStart && parseISO(t.date) <= monthEnd)
    .reduce((sum, t) => sum + t.amount, 0);

  const remaining = state.profile.monthlyBudget - monthExpenses;

  if (remaining <= 0) {
    return { amount: 0, status: 'overspend' };
  }

  const dailyAllowance = remaining / daysLeft;
  const riskThreshold = state.profile.monthlyBudget * 0.1;

  if (dailyAllowance < riskThreshold && daysLeft > 1) {
    return { amount: Math.round(dailyAllowance), status: 'risk' };
  }

  return { amount: Math.round(dailyAllowance), status: 'ok' };
}

// ═══════════════════════════════════════
// Уровень
// ═══════════════════════════════════════
export function calcLevel(xp: number): number {
  return Math.floor(xp / ENERGY.XP_PER_LEVEL) + 1;
}

export function calcXpProgress(xp: number): number {
  return (xp % ENERGY.XP_PER_LEVEL) / ENERGY.XP_PER_LEVEL;
}

// ═══════════════════════════════════════
// Прогресс цели
// ═══════════════════════════════════════
export function calcGoalProgress(goal: Goal, tasks: Task[]): number {
  if (goal.status === 'completed') return 100;

  let financialProgress = 0;
  if (goal.type === 'financial' && goal.targetAmount > 0) {
    financialProgress = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
  }

  const milestonesDone = goal.milestones.filter(m => m.done).length;
  const totalMilestones = goal.milestones.length || 1;
  const milestoneProgress = (milestonesDone / totalMilestones) * 100;

  const goalTasks = tasks.filter(t => t.goalId === goal.id);
  const tasksDone = goalTasks.filter(t => t.status === 'done').length;
  const totalGoalTasks = goalTasks.length || 1;
  const taskProgress = (tasksDone / totalGoalTasks) * 100;

  if (goal.type === 'financial') {
    return Math.round(financialProgress * 0.6 + taskProgress * 0.4);
  }
  return Math.round(milestoneProgress * 0.6 + taskProgress * 0.4);
}

// ═══════════════════════════════════════
// Динамический акцент
// ═══════════════════════════════════════
export function calcAccentColor(state: AppState): 'success' | 'warning' | 'danger' {
  const freeMoney = calcFreeMoney(state);
  if (freeMoney.status === 'overspend') return 'danger';

  const today = startOfDay(new Date());
  const overdueTasks = state.tasks.filter(t => {
    if (t.status === 'done' || t.status === 'postponed') return false;
    const dl = parseISO(t.deadline);
    return isPast(dl) && !isToday(dl);
  });

  if (overdueTasks.length > 3) return 'danger';
  if (freeMoney.status === 'risk' || overdueTasks.length > 0) return 'warning';
  return 'success';
}

// ═══════════════════════════════════════
// Обработка выполнения задачи
// ═══════════════════════════════════════
export function processTaskCompletion(task: Task, state: AppState): { energyDelta: number; xpDelta: number; reason: string } {
  const isHard = task.difficulty === 'hard';
  const energyGain = isHard ? ENERGY.TASK_HARD_DONE : ENERGY.TASK_DONE;
  let xpGain = isHard ? ENERGY.XP_PER_HARD_TASK : ENERGY.XP_PER_TASK;

  const deadline = parseISO(task.deadline);
  const today = startOfDay(new Date());

  // Раннее выполнение — бонус
  if (deadline > today) {
    xpGain += ENERGY.EARLY_BONUS_XP;
  }

  return {
    energyDelta: energyGain,
    xpDelta: xpGain,
    reason: `квест «${task.title}»`,
  };
}

// ═══════════════════════════════════════
// Обработка просроченных задач (при входе в день)
// ═══════════════════════════════════════
export function processOverdueTasks(tasks: Task[]): { energyDelta: number; xpDelta: number; reasons: string[] } {
  const today = startOfDay(new Date());
  const overdue = tasks.filter(t => {
    if (t.status === 'done' || t.status === 'postponed') return false;
    const dl = startOfDay(parseISO(t.deadline));
    return dl < today;
  });

  let energyDelta = 0;
  let xpDelta = 0;
  const reasons: string[] = [];

  for (const task of overdue) {
    const eDelta = Math.max(energyDelta + ENERGY.OVERDUE_ENERGY, ENERGY.OVERDUE_DAILY_CAP);
    if (eDelta === energyDelta) break; // достигли дневного лимита
    energyDelta = eDelta;
    xpDelta += ENERGY.OVERDUE_XP;
    reasons.push(`просрочен «${task.title}»`);
  }

  return { energyDelta, xpDelta, reasons };
}

// ═══════════════════════════════════════
// Обработка перерасхода
// ═══════════════════════════════════════
export function processOverspend(state: AppState): { energyDelta: number; reason: string } | null {
  const freeMoney = calcFreeMoney(state);
  if (freeMoney.status === 'overspend') {
    // Проверяем, был ли уже штраф сегодня
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayLogs = state.energyLog.filter(l => l.date === today && l.reason.includes('перерасход'));
    if (todayLogs.length > 0) return null;
    return { energyDelta: ENERGY.OVERSPEND_ENERGY, reason: 'перерасход бюджета' };
  }
  return null;
}

// ═══════════════════════════════════════
// Статистика по дням для графика
// ═══════════════════════════════════════
export function getDailyExpenses(transactions: Transaction[], days: number = 30): { date: string; amount: number }[] {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days + 1);

  const daysArr = eachDayOfInterval({ start: startDate, end: now });

  return daysArr.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const amount = transactions
      .filter(t => t.type === 'expense' && t.date === dayStr)
      .reduce((sum, t) => sum + t.amount, 0);
    return { date: format(day, 'dd.MM'), amount };
  });
}

// ═══════════════════════════════════════
// Распределение по категориям
// ═══════════════════════════════════════
export function getCategoryDistribution(transactions: Transaction[]): { category: string; amount: number }[] {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const expenses = transactions.filter(
    t => t.type === 'expense' && parseISO(t.date) >= monthStart && parseISO(t.date) <= monthEnd
  );

  const map = new Map<string, number>();
  for (const t of expenses) {
    map.set(t.category, (map.get(t.category) || 0) + t.amount);
  }

  return Array.from(map.entries()).map(([category, amount]) => ({ category, amount }));
}
