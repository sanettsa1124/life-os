import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Transaction, Task, Goal, ScheduleEvent, EnergyLog, Badge } from '../types';
import { ENERGY } from '../config';
import { format } from 'date-fns';

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const defaultState: AppState = {
  profile: {
    name: '',
    monthlyBudget: 80000,
    currency: '₽',
    dayStart: '08:00',
    onboarded: false,
  },
  energy: ENERGY.START,
  xp: 0,
  transactions: [],
  tasks: [],
  goals: [],
  schedule: [],
  energyLog: [],
  badges: [],
  schemaVersion: 1,
};

// Демо-данные
function getDemoData(): Partial<AppState> {
  const today = new Date();
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

  const tasks: Task[] = [
    { id: uid(), title: 'Разобрать почту', description: 'Ответить на важные письма', priority: 'medium', category: 'work', deadline: fmt(today), time: '10:00', goalId: null, difficulty: 'easy', status: 'planned', scheduleDate: fmt(today), scheduleTime: '10:00', completedAt: null, createdAt: fmt(today) },
    { id: uid(), title: 'Тренировка', description: '30 минут кардио', priority: 'high', category: 'health', deadline: fmt(today), time: '18:00', goalId: null, difficulty: 'medium', status: 'planned', scheduleDate: fmt(today), scheduleTime: '18:00', completedAt: null, createdAt: fmt(today) },
    { id: uid(), title: 'Подготовить презентацию', description: 'Слайды для пятницы', priority: 'high', category: 'work', deadline: fmt(addDays(today, 2)), time: '14:00', goalId: 'goal1', difficulty: 'hard', status: 'planned', scheduleDate: null, scheduleTime: null, completedAt: null, createdAt: fmt(today) },
    { id: uid(), title: 'Купить продукты', description: 'Список в заметках', priority: 'low', category: 'personal', deadline: fmt(today), time: '', goalId: null, difficulty: 'easy', status: 'planned', scheduleDate: fmt(today), scheduleTime: '19:00', completedAt: null, createdAt: fmt(today) },
    { id: uid(), title: 'Прочитать 20 страниц', description: 'Книга по саморазвитию', priority: 'low', category: 'learning', deadline: fmt(addDays(today, 1)), time: '21:00', goalId: 'goal2', difficulty: 'easy', status: 'planned', scheduleDate: null, scheduleTime: null, completedAt: null, createdAt: fmt(today) },
    { id: uid(), title: 'Позвонить маме', description: '', priority: 'medium', category: 'personal', deadline: fmt(addDays(today, 1)), time: '12:00', goalId: null, difficulty: 'easy', status: 'planned', scheduleDate: null, scheduleTime: null, completedAt: null, createdAt: fmt(today) },
    { id: uid(), title: 'Оплатить подписки', description: 'Музыка, облако', priority: 'medium', category: 'finance', deadline: fmt(addDays(today, 3)), time: '', goalId: null, difficulty: 'easy', status: 'planned', scheduleDate: null, scheduleTime: null, completedAt: null, createdAt: fmt(today) },
    { id: uid(), title: 'Пробежать 5 км', description: 'Подготовка к забегу', priority: 'high', category: 'health', deadline: fmt(addDays(today, 5)), time: '07:00', goalId: 'goal2', difficulty: 'hard', status: 'planned', scheduleDate: null, scheduleTime: null, completedAt: null, createdAt: fmt(today) },
  ];

  const transactions: Transaction[] = [
    { id: uid(), amount: 80000, type: 'income', category: 'other', date: fmt(addDays(today, -25)), comment: 'Зарплата', recurring: 'monthly', createdAt: fmt(today) },
    { id: uid(), amount: 25000, type: 'expense', category: 'housing', date: fmt(addDays(today, -24)), comment: 'Аренда', recurring: 'monthly', createdAt: fmt(today) },
    { id: uid(), amount: 1200, type: 'expense', category: 'food', date: fmt(addDays(today, -3)), comment: 'Супермаркет', recurring: 'none', createdAt: fmt(today) },
    { id: uid(), amount: 450, type: 'expense', category: 'transport', date: fmt(addDays(today, -2)), comment: 'Такси', recurring: 'none', createdAt: fmt(today) },
    { id: uid(), amount: 890, type: 'expense', category: 'food', date: fmt(addDays(today, -2)), comment: 'Кафе с друзьями', recurring: 'none', createdAt: fmt(today) },
    { id: uid(), amount: 3500, type: 'expense', category: 'entertainment', date: fmt(addDays(today, -1)), comment: 'Концерт', recurring: 'none', createdAt: fmt(today) },
    { id: uid(), amount: 2100, type: 'expense', category: 'food', date: fmt(today), comment: 'Продукты на неделю', recurring: 'none', createdAt: fmt(today) },
    { id: uid(), amount: 600, type: 'expense', category: 'health', date: fmt(today), comment: 'Аптека', recurring: 'none', createdAt: fmt(today) },
    { id: uid(), amount: 15000, type: 'income', category: 'other', date: fmt(addDays(today, -5)), comment: 'Фриланс', recurring: 'none', createdAt: fmt(today) },
    { id: uid(), amount: 3200, type: 'expense', category: 'food', date: fmt(addDays(today, -7)), comment: 'Ресторан', recurring: 'none', createdAt: fmt(today) },
    { id: uid(), amount: 900, type: 'expense', category: 'transport', date: fmt(addDays(today, -10)), comment: 'Бензин', recurring: 'none', createdAt: fmt(today) },
    { id: uid(), amount: 1500, type: 'expense', category: 'other', date: fmt(addDays(today, -4)), comment: 'Подарок', recurring: 'none', createdAt: fmt(today) },
  ];

  const goals: Goal[] = [
    {
      id: 'goal1', title: 'Новый ноутбук', type: 'financial', deadline: fmt(addDays(today, 60)),
      targetAmount: 120000, savedAmount: 35000,
      milestones: [
        { id: uid(), title: 'Выбрать модель', done: true },
        { id: uid(), title: 'Накопить 60 000', done: false },
        { id: uid(), title: 'Накопить 90 000', done: false },
        { id: uid(), title: 'Купить', done: false },
      ],
      status: 'active', createdAt: fmt(addDays(today, -30)),
    },
    {
      id: 'goal2', title: 'Пробежать полумарафон', type: 'habit', deadline: fmt(addDays(today, 90)),
      targetAmount: 0, savedAmount: 0,
      milestones: [
        { id: uid(), title: 'Пробежать 3 км без остановки', done: true },
        { id: uid(), title: 'Пробежать 5 км', done: false },
        { id: uid(), title: 'Пробежать 10 км', done: false },
        { id: uid(), title: 'Пробежать 15 км', done: false },
        { id: uid(), title: 'Финиш: 21.1 км', done: false },
      ],
      status: 'active', createdAt: fmt(addDays(today, -45)),
    },
  ];

  const schedule: ScheduleEvent[] = [
    { id: uid(), title: 'Разобрать почту', date: fmt(today), startTime: '10:00', endTime: '10:30', taskId: tasks[0].id, type: 'task', color: '#3E8E7E' },
    { id: uid(), title: 'Обед', date: fmt(today), startTime: '13:00', endTime: '14:00', taskId: null, type: 'rest', color: '#D69A3C' },
    { id: uid(), title: 'Тренировка', date: fmt(today), startTime: '18:00', endTime: '19:00', taskId: tasks[1].id, type: 'task', color: '#5B8DB8' },
    { id: uid(), title: 'Покупки', date: fmt(today), startTime: '19:00', endTime: '19:30', taskId: tasks[3].id, type: 'task', color: '#3E8E7E' },
    { id: uid(), title: 'Отдых', date: fmt(today), startTime: '20:00', endTime: '21:00', taskId: null, type: 'rest', color: '#8B6DB0' },
    { id: uid(), title: 'Презентация', date: fmt(addDays(today, 2)), startTime: '14:00', endTime: '16:00', taskId: tasks[2].id, type: 'task', color: '#D97777' },
    { id: uid(), title: 'Звонок маме', date: fmt(addDays(today, 1)), startTime: '12:00', endTime: '12:30', taskId: tasks[5].id, type: 'task', color: '#3E8E7E' },
  ];

  return { tasks, transactions, goals, schedule };
}

interface StoreActions {
  setOnboarded: (name: string, budget: number, goalTitle: string) => void;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => void;
  updateTask: (id: string, t: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  addGoal: (g: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, g: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  addScheduleEvent: (e: Omit<ScheduleEvent, 'id'>) => void;
  updateScheduleEvent: (id: string, e: Partial<ScheduleEvent>) => void;
  deleteScheduleEvent: (id: string) => void;
  updateProfile: (p: Partial<AppState['profile']>) => void;
  addEnergyLog: (log: Omit<EnergyLog, 'id'>) => void;
  addBadge: (badge: Omit<Badge, 'earnedAt'>) => void;
  resetToDemo: () => void;
  importData: (data: AppState) => void;
  exportData: () => AppState;
  clearAll: () => void;
}

export const useStore = create<AppState & StoreActions>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setOnboarded: (name, budget, goalTitle) => {
        const demo = getDemoData();
        const today = format(new Date(), 'yyyy-MM-dd');
        const goalId = uid();
        const newGoal: Goal = {
          id: goalId, title: goalTitle, type: 'financial',
          deadline: format(new Date(Date.now() + 90 * 86400000), 'yyyy-MM-dd'),
          targetAmount: 50000, savedAmount: 0, milestones: [], status: 'active', createdAt: today,
        };
        set({
          profile: { ...get().profile, name, monthlyBudget: budget, onboarded: true },
          tasks: demo.tasks || [],
          transactions: demo.transactions || [],
          goals: [newGoal, ...(demo.goals || [])],
          schedule: demo.schedule || [],
        });
      },

      addTransaction: (t) => {
        const transaction: Transaction = { ...t, id: uid(), createdAt: format(new Date(), 'yyyy-MM-dd') };
        const state = get();
        set({ transactions: [...state.transactions, transaction] });
        // Проверка перерасхода
        const newState = get();
        const freeMoney = calcFreeMoneyQuick(newState);
        if (freeMoney === 'overspend' && t.type === 'expense') {
          const today = format(new Date(), 'yyyy-MM-dd');
          const todayLogs = get().energyLog.filter(l => l.date === today && l.reason.includes('перерасход'));
          if (todayLogs.length === 0) {
            const log: EnergyLog = { id: uid(), delta: ENERGY.OVERSPEND_ENERGY, reason: 'перерасход бюджета', timestamp: new Date().toISOString(), date: today };
            set(s => ({
              energy: Math.max(0, Math.min(ENERGY.MAX, s.energy + ENERGY.OVERSPEND_ENERGY)),
              energyLog: [...s.energyLog, log],
            }));
          }
        }
      },

      updateTransaction: (id, t) => set(s => ({
        transactions: s.transactions.map(tr => tr.id === id ? { ...tr, ...t } : tr),
      })),

      deleteTransaction: (id) => set(s => ({
        transactions: s.transactions.filter(t => t.id !== id),
      })),

      addTask: (t) => {
        const task: Task = { ...t, id: uid(), createdAt: format(new Date(), 'yyyy-MM-dd'), completedAt: null };
        set(s => ({ tasks: [...s.tasks, task] }));
      },

      updateTask: (id, t) => set(s => ({
        tasks: s.tasks.map(task => task.id === id ? { ...task, ...t } : task),
      })),

      deleteTask: (id) => set(s => ({
        tasks: s.tasks.filter(t => t.id !== id),
      })),

      completeTask: (id) => {
        const state = get();
        const task = state.tasks.find(t => t.id === id);
        if (!task || task.status === 'done') return;

        const isHard = task.difficulty === 'hard';
        const energyGain = isHard ? ENERGY.TASK_HARD_DONE : ENERGY.TASK_DONE;
        let xpGain = isHard ? ENERGY.XP_PER_HARD_TASK : ENERGY.XP_PER_TASK;

        const deadline = new Date(task.deadline + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (deadline > today) {
          xpGain += ENERGY.EARLY_BONUS_XP;
        }

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const log: EnergyLog = {
          id: uid(),
          delta: energyGain,
          reason: `квест «${task.title}»`,
          timestamp: new Date().toISOString(),
          date: todayStr,
        };

        set(s => ({
          tasks: s.tasks.map(t => t.id === id ? { ...t, status: 'done' as const, completedAt: new Date().toISOString() } : t),
          energy: Math.min(ENERGY.MAX, s.energy + energyGain),
          xp: s.xp + xpGain,
          energyLog: [...s.energyLog, log],
        }));
      },

      addGoal: (g) => {
        const goal: Goal = { ...g, id: uid(), createdAt: format(new Date(), 'yyyy-MM-dd') };
        set(s => ({ goals: [...s.goals, goal] }));
      },

      updateGoal: (id, g) => set(s => ({
        goals: s.goals.map(goal => goal.id === id ? { ...goal, ...g } : goal),
      })),

      deleteGoal: (id) => set(s => ({
        goals: s.goals.filter(g => g.id !== id),
      })),

      toggleMilestone: (goalId, milestoneId) => set(s => ({
        goals: s.goals.map(g => g.id === goalId ? {
          ...g,
          milestones: g.milestones.map(m => m.id === milestoneId ? { ...m, done: !m.done } : m),
        } : g),
      })),

      addScheduleEvent: (e) => {
        const event: ScheduleEvent = { ...e, id: uid() };
        set(s => ({ schedule: [...s.schedule, event] }));
      },

      updateScheduleEvent: (id, e) => set(s => ({
        schedule: s.schedule.map(ev => ev.id === id ? { ...ev, ...e } : ev),
      })),

      deleteScheduleEvent: (id) => set(s => ({
        schedule: s.schedule.filter(e => e.id !== id),
      })),

      updateProfile: (p) => set(s => ({
        profile: { ...s.profile, ...p },
      })),

      addEnergyLog: (log) => {
        const entry: EnergyLog = { ...log, id: uid() };
        set(s => ({
          energyLog: [...s.energyLog, entry],
          energy: Math.max(0, Math.min(ENERGY.MAX, s.energy + log.delta)),
          xp: Math.max(0, s.xp + (log.delta > 0 ? 0 : log.delta)),
        }));
      },

      addBadge: (badge) => {
        const entry: Badge = { ...badge, earnedAt: new Date().toISOString() };
        set(s => ({ badges: [...s.badges, entry] }));
      },

      resetToDemo: () => {
        const demo = getDemoData();
        set({
          ...defaultState,
          profile: { ...defaultState.profile, name: 'Игрок', onboarded: true },
          tasks: demo.tasks || [],
          transactions: demo.transactions || [],
          goals: demo.goals || [],
          schedule: demo.schedule || [],
          energy: ENERGY.START,
          xp: 0,
          energyLog: [],
          badges: [],
        });
      },

      importData: (data) => set({ ...data }),

      exportData: () => {
        const { setOnboarded, addTransaction, updateTransaction, deleteTransaction, addTask, updateTask, deleteTask, completeTask, addGoal, updateGoal, deleteGoal, toggleMilestone, addScheduleEvent, updateScheduleEvent, deleteScheduleEvent, updateProfile, addEnergyLog, addBadge, resetToDemo, importData, exportData, clearAll, ...state } = get();
        return state as AppState;
      },

      clearAll: () => set(defaultState),
    }),
    {
      name: 'life-os-store',
      version: 1,
    }
  )
);

// Быстрая проверка перерасхода (без импорта engine)
function calcFreeMoneyQuick(state: AppState): 'ok' | 'risk' | 'overspend' {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysLeft = Math.ceil((monthEnd.getTime() - today.getTime()) / 86400000) + 1;

  const monthExpenses = state.transactions
    .filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return t.type === 'expense' && d >= monthStart && d <= monthEnd;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const remaining = state.profile.monthlyBudget - monthExpenses;
  if (remaining <= 0) return 'overspend';
  const dailyAllowance = remaining / daysLeft;
  if (dailyAllowance < state.profile.monthlyBudget * 0.1 && daysLeft > 1) return 'risk';
  return 'ok';
}
