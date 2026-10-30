import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckCircle2, Wallet, Target, Clock, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { calcFreeMoney, calcLevel, calcXpProgress, calcGoalProgress, calcAccentColor } from '../store/energyEngine';
import { CircularProgress, ProgressBar, GlassCard } from '../components/ui';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Screen } from '../types';

interface DashboardProps {
  onNavigate?: (screen: Screen) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const state = useStore();
  const completeTask = useStore(s => s.completeTask);
  const accent = calcAccentColor(state);
  const accentColor = accent === 'success' ? '#3E8E7E' : accent === 'warning' ? '#D69A3C' : '#D97777';

  const level = calcLevel(state.xp);
  const xpProgress = calcXpProgress(state.xp);
  const freeMoney = calcFreeMoney(state);

  // Главная задача дня
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = state.tasks.filter(t =>
    (t.deadline === todayStr || t.scheduleDate === todayStr) && t.status !== 'done' && t.status !== 'postponed'
  );
  const mainQuest = todayTasks.sort((a, b) => {
    const p = { high: 3, medium: 2, low: 1 };
    return p[b.priority] - p[a.priority];
  })[0];

  // Ближайшая цель
  const activeGoals = state.goals.filter(g => g.status === 'active');
  const nearestGoal = activeGoals.sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
  const goalProgress = nearestGoal ? calcGoalProgress(nearestGoal, state.tasks) : 0;

  // Сегодняшнее расписание
  const todaySchedule = state.schedule
    .filter(e => e.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Последние события
  const recentLogs = state.energyLog
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 5);

  // История энергии за 7 дней
  const energyHistory = useMemo(() => {
    const days: { date: string; energy: number }[] = [];
    let runningEnergy = state.energy;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayLogs = state.energyLog.filter(l => l.date === dateStr);
      const dayDelta = dayLogs.reduce((s, l) => s + l.delta, 0);
      runningEnergy = runningEnergy - dayDelta;
      days.push({ date: format(d, 'EEE', { locale: ru }), energy: Math.max(0, Math.min(100, runningEnergy)) });
    }
    days[days.length - 1].energy = state.energy;
    return days;
  }, [state.energy, state.energyLog]);

  const handleComplete = () => {
    if (mainQuest) {
      completeTask(mainQuest.id);
    }
  };

  const formatDay = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Сегодня';
    if (isTomorrow(d)) return 'Завтра';
    return format(d, 'd MMM', { locale: ru });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope' }}>
            Привет, {state.profile.name || 'друг'} 👋
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {format(new Date(), 'EEEE, d MMMM', { locale: ru })}
          </p>
        </div>
      </div>

      {/* 4 плитки */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Энергия */}
        <GlassCard delay={0.05} className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3 self-start">
            <Zap size={16} style={{ color: accentColor }} />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Энергия</span>
          </div>
          <CircularProgress value={state.energy} size={100} strokeWidth={7} color={accentColor}>
            <div className="text-center">
              <span className="text-2xl font-bold tabular-nums">{state.energy}</span>
              <span className="text-xs text-[var(--color-text-secondary)]">/100</span>
            </div>
          </CircularProgress>
          <div className="mt-3 w-full">
            <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
              <span>Ур. {level}</span>
              <span>{Math.round(xpProgress * 100)}%</span>
            </div>
            <ProgressBar value={xpProgress * 100} color={accentColor} height={4} />
          </div>
        </GlassCard>

        {/* Квест дня */}
        <GlassCard delay={0.1} className="flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} style={{ color: accentColor }} />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Квест дня</span>
          </div>
          {mainQuest ? (
            <>
              <h3 className="font-semibold text-sm mb-1">{mainQuest.title}</h3>
              {mainQuest.time && (
                <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 mb-3">
                  <Clock size={12} /> {mainQuest.time}
                </p>
              )}
              <button onClick={handleComplete} className="btn btn-primary text-sm mt-auto" style={{ background: accentColor }}>
                <CheckCircle2 size={16} /> Выполнено
              </button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-[var(--color-text-secondary)]">
              Нет задач на сегодня 🎉
            </div>
          )}
        </GlassCard>

        {/* Свободные деньги */}
        <GlassCard delay={0.15} className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate?.('finance')}>
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={16} style={{ color: accentColor }} />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Свободные деньги</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums">{freeMoney.amount.toLocaleString()}</span>
            <span className="text-sm text-[var(--color-text-secondary)]">{state.profile.currency}/день</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: freeMoney.status === 'ok' ? '#3E8E7E' : freeMoney.status === 'risk' ? '#D69A3C' : '#D97777' }} />
            <span className="text-xs" style={{ color: freeMoney.status === 'ok' ? '#3E8E7E' : freeMoney.status === 'risk' ? '#D69A3C' : '#D97777' }}>
              {freeMoney.status === 'ok' ? 'В норме' : freeMoney.status === 'risk' ? 'Есть риск' : 'Перерасход'}
            </span>
          </div>
        </GlassCard>

        {/* Ближайшая цель */}
        <GlassCard delay={0.2} className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onNavigate?.('goals')}>
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} style={{ color: accentColor }} />
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Ближайшая цель</span>
          </div>
          {nearestGoal ? (
            <>
              <h3 className="font-semibold text-sm mb-2">{nearestGoal.title}</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-xl font-bold tabular-nums">{goalProgress}%</span>
              </div>
              <ProgressBar value={goalProgress} color={accentColor} height={6} />
              {nearestGoal.type === 'financial' && nearestGoal.targetAmount > 0 && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                  {nearestGoal.savedAmount.toLocaleString()} / {nearestGoal.targetAmount.toLocaleString()} {state.profile.currency}
                </p>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-[var(--color-text-secondary)]">
              Создайте первую цель
            </div>
          )}
        </GlassCard>
      </div>

      {/* Сегодня: расписание */}
      <GlassCard delay={0.25}>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} style={{ color: accentColor }} />
          <h3 className="font-semibold text-sm">Сегодня</h3>
        </div>
        {todaySchedule.length > 0 ? (
          <div className="space-y-2">
            {todaySchedule.map(event => (
              <div key={event.id} className="flex items-center gap-3 py-2 px-3 rounded-xl" style={{ background: `${event.color}10` }}>
                <div className="w-1 h-8 rounded-full" style={{ background: event.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{event.startTime} — {event.endTime}</p>
                </div>
                {event.type === 'rest' && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">Отдых</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">Расписание пустое</p>
        )}
      </GlassCard>

      {/* Лента событий */}
      <GlassCard delay={0.3}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} style={{ color: accentColor }} />
          <h3 className="font-semibold text-sm">Последние события</h3>
        </div>
        {recentLogs.length > 0 ? (
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 py-1.5">
                <span className={`text-sm font-bold tabular-nums ${log.delta > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {log.delta > 0 ? '+' : ''}{log.delta}
                </span>
                <span className="text-sm text-[var(--color-text-secondary)]">{log.reason}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">
            Выполняйте задачи, чтобы видеть историю энергии
          </p>
        )}
      </GlassCard>
    </div>
  );
}
