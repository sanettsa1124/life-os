import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, Calendar, TrendingUp, CheckCircle2, Circle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { calcAccentColor, calcGoalProgress } from '../store/energyEngine';
import { GlassCard, Modal, ProgressBar, EmptyState } from '../components/ui';
import { format, parseISO, differenceInWeeks } from 'date-fns';
import { ru } from 'date-fns/locale';

export function Goals() {
  const state = useStore();
  const addGoal = useStore(s => s.addGoal);
  const updateGoal = useStore(s => s.updateGoal);
  const deleteGoal = useStore(s => s.deleteGoal);
  const toggleMilestone = useStore(s => s.toggleMilestone);
  const addTask = useStore(s => s.addTask);
  const accent = calcAccentColor(state);
  const accentColor = accent === 'success' ? '#3E8E7E' : accent === 'warning' ? '#D69A3C' : '#D97777';

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<{
    title: string; type: 'financial' | 'habit' | 'project'; deadline: string;
    targetAmount: string; milestones: string;
  }>({
    title: '', type: 'financial', deadline: format(new Date(Date.now() + 90 * 86400000), 'yyyy-MM-dd'),
    targetAmount: '', milestones: '',
  });

  const activeGoals = state.goals.filter(g => g.status === 'active');
  const completedGoals = state.goals.filter(g => g.status === 'completed');

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    const milestones = formData.milestones.split('\n').filter(s => s.trim()).map(s => ({
      id: Math.random().toString(36).slice(2, 10),
      title: s.trim(),
      done: false,
    }));
    addGoal({
      title: formData.title,
      type: formData.type,
      deadline: formData.deadline,
      targetAmount: Number(formData.targetAmount) || 0,
      savedAmount: 0,
      milestones,
      status: 'active',
    });
    setShowModal(false);
    setFormData({ title: '', type: 'financial', deadline: format(new Date(Date.now() + 90 * 86400000), 'yyyy-MM-dd'), targetAmount: '', milestones: '' });
  };

  const handlePlanSteps = (goal: typeof state.goals[0]) => {
    const now = new Date();
    const deadline = parseISO(goal.deadline);
    const weeks = Math.max(1, differenceInWeeks(deadline, now));

    if (goal.type === 'financial' && goal.targetAmount > 0) {
      const remaining = goal.targetAmount - goal.savedAmount;
      const weeklyAmount = Math.round(remaining / weeks);
      // Создаём задачу-напоминание
      addTask({
        title: `Отложить ${weeklyAmount.toLocaleString()} ${state.profile.currency} на «${goal.title}»`,
        description: `Еженедельный шаг. Нужно ${weeklyAmount.toLocaleString()}/нед.`,
        priority: 'high',
        category: 'finance',
        deadline: format(new Date(now.getTime() + 7 * 86400000), 'yyyy-MM-dd'),
        time: '',
        goalId: goal.id,
        difficulty: 'easy',
        status: 'planned',
        scheduleDate: null,
        scheduleTime: null,
      });
    }

    // Создаём задачи для невыполненных вех
    const undoneMilestones = goal.milestones.filter(m => !m.done);
    undoneMilestones.slice(0, 3).forEach((m, i) => {
      const taskDate = new Date(now.getTime() + (i + 1) * 7 * 86400000);
      addTask({
        title: `Веха: ${m.title}`,
        description: `Шаг к цели «${goal.title}»`,
        priority: 'medium',
        category: 'goal',
        deadline: format(taskDate, 'yyyy-MM-dd'),
        time: '',
        goalId: goal.id,
        difficulty: 'medium',
        status: 'planned',
        scheduleDate: null,
        scheduleTime: null,
      });
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'financial': return '💰';
      case 'habit': return '🔄';
      case 'project': return '🚀';
      default: return '🎯';
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope' }}>Цели</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary text-sm" style={{ background: accentColor }}>
          <Plus size={16} /> Новая цель
        </button>
      </div>

      {/* Active goals */}
      {activeGoals.length > 0 ? (
        <div className="space-y-4">
          {activeGoals.map((goal, i) => {
            const progress = calcGoalProgress(goal, state.tasks);
            const now = new Date();
            const deadline = parseISO(goal.deadline);
            const weeksLeft = Math.max(0, differenceInWeeks(deadline, now));

            let weeklyTip = '';
            if (goal.type === 'financial' && goal.targetAmount > 0 && weeksLeft > 0) {
              const remaining = goal.targetAmount - goal.savedAmount;
              weeklyTip = `Нужно откладывать ${Math.round(remaining / weeksLeft).toLocaleString()} ${state.profile.currency}/нед`;
            }
            const goalTasks = state.tasks.filter(t => t.goalId === goal.id && t.status !== 'done');
            if (goalTasks.length > 0 && weeksLeft > 0) {
              const tasksPerWeek = Math.ceil(goalTasks.length / Math.max(1, weeksLeft));
              weeklyTip += (weeklyTip ? ' · ' : '') + `Нужно ${tasksPerWeek} задач/нед`;
            }

            return (
              <GlassCard key={goal.id} delay={i * 0.05}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getTypeIcon(goal.type)}</span>
                    <div>
                      <h3 className="font-semibold text-sm">{goal.title}</h3>
                      <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
                        <Calendar size={10} />
                        {format(deadline, 'd MMM yyyy', { locale: ru })} · {weeksLeft} нед.
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold tabular-nums" style={{ color: accentColor }}>{progress}%</span>
                </div>

                <ProgressBar value={progress} color={accentColor} height={6} />

                {goal.type === 'financial' && goal.targetAmount > 0 && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-2 tabular-nums">
                    {goal.savedAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()} {state.profile.currency}
                  </p>
                )}

                {weeklyTip && (
                  <p className="text-xs mt-2 px-2 py-1 rounded-lg" style={{ background: `${accentColor}10`, color: accentColor }}>
                    <TrendingUp size={10} className="inline mr-1" />{weeklyTip}
                  </p>
                )}

                {/* Milestones */}
                {goal.milestones.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {goal.milestones.map(m => (
                      <button
                        key={m.id}
                        onClick={() => toggleMilestone(goal.id, m.id)}
                        className="flex items-center gap-2 w-full text-left py-1"
                      >
                        {m.done ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Circle size={14} className="text-[var(--color-text-secondary)]" />}
                        <span className={`text-xs ${m.done ? 'line-through text-[var(--color-text-secondary)]' : ''}`}>{m.title}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button onClick={() => handlePlanSteps(goal)} className="btn btn-secondary text-xs flex-1">
                    <Target size={12} /> Запланировать шаги
                  </button>
                  <button onClick={() => deleteGoal(goal.id)} className="btn btn-danger text-xs">
                    Удалить
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <EmptyState icon="🎯" title="Нет активных целей" description="Создайте первую цель, чтобы начать движение"
          action={<button onClick={() => setShowModal(true)} className="btn btn-primary text-sm" style={{ background: accentColor }}>Создать цель</button>}
        />
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">Закрытые цели</h3>
          <div className="space-y-2">
            {completedGoals.map(g => (
              <div key={g.id} className="glass-card-sm p-3 flex items-center gap-3 opacity-70">
                <span className="text-lg">✅</span>
                <span className="text-sm line-through">{g.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Новая цель">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Название</label>
            <input type="text" value={formData.title} onChange={e => setFormData(d => ({ ...d, title: e.target.value }))} placeholder="Например: Накопить на путешествие" autoFocus />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Тип</label>
            <select value={formData.type} onChange={e => setFormData(d => ({ ...d, type: e.target.value as 'financial' | 'habit' | 'project' }))}>
              <option value="financial">💰 Финансовая</option>
              <option value="habit">🔄 Привычка</option>
              <option value="project">🚀 Проект</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Дедлайн</label>
            <input type="date" value={formData.deadline} onChange={e => setFormData(d => ({ ...d, deadline: e.target.value }))} />
          </div>
          {formData.type === 'financial' && (
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Целевая сумма</label>
              <input type="number" value={formData.targetAmount} onChange={e => setFormData(d => ({ ...d, targetAmount: e.target.value }))} placeholder="100000" />
            </div>
          )}
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Вехи (каждая с новой строки)</label>
            <textarea value={formData.milestones} onChange={e => setFormData(d => ({ ...d, milestones: e.target.value }))} placeholder={"Шаг 1\nШаг 2\nШаг 3"} rows={4} />
          </div>
          <button onClick={handleSubmit} className="btn btn-primary w-full" style={{ background: accentColor }}>
            Создать цель
          </button>
        </div>
      </Modal>
    </div>
  );
}
