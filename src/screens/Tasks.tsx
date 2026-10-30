import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, Circle, Clock, AlertCircle, Pause } from 'lucide-react';
import { useStore } from '../store/useStore';
import { calcAccentColor } from '../store/energyEngine';
import { GlassCard, Modal, EmptyState } from '../components/ui';
import { TASK_PRIORITIES, TASK_DIFFICULTIES } from '../config';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { ru } from 'date-fns/locale';

type TabFilter = 'today' | 'tomorrow' | 'all' | 'overdue';

export function Tasks() {
  const state = useStore();
  const addTask = useStore(s => s.addTask);
  const completeTask = useStore(s => s.completeTask);
  const updateTask = useStore(s => s.updateTask);
  const deleteTask = useStore(s => s.deleteTask);
  const accent = calcAccentColor(state);
  const accentColor = accent === 'success' ? '#3E8E7E' : accent === 'warning' ? '#D69A3C' : '#D97777';

  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<TabFilter>('today');
  const [xpFlash, setXpFlash] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string; description: string; priority: 'low' | 'medium' | 'high'; category: string;
    deadline: string; time: string; goalId: string;
    difficulty: 'easy' | 'medium' | 'hard'; status: 'planned' | 'in_progress' | 'done' | 'postponed';
    scheduleDate: string; scheduleTime: string;
  }>({
    title: '', description: '', priority: 'medium', category: 'work',
    deadline: format(new Date(), 'yyyy-MM-dd'), time: '', goalId: '',
    difficulty: 'easy', status: 'planned',
    scheduleDate: '', scheduleTime: '',
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  const filteredTasks = state.tasks.filter(t => {
    switch (tab) {
      case 'today':
        return t.deadline === today || t.scheduleDate === today;
      case 'tomorrow':
        return t.deadline === tomorrow || t.scheduleDate === tomorrow;
      case 'overdue':
        return t.status !== 'done' && t.status !== 'postponed' && isPast(parseISO(t.deadline)) && !isToday(parseISO(t.deadline));
      case 'all':
        return true;
      default:
        return true;
    }
  }).sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    return a.deadline.localeCompare(b.deadline);
  });

  const handleComplete = (id: string) => {
    completeTask(id);
    setXpFlash(id);
    setTimeout(() => setXpFlash(null), 1000);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    addTask({
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      category: formData.category,
      deadline: formData.deadline,
      time: formData.time,
      goalId: formData.goalId || null,
      difficulty: formData.difficulty,
      status: formData.status,
      scheduleDate: formData.scheduleDate || null,
      scheduleTime: formData.scheduleTime || null,
    });
    setShowModal(false);
    setFormData({
      title: '', description: '', priority: 'medium', category: 'work',
      deadline: format(new Date(), 'yyyy-MM-dd'), time: '', goalId: '',
      difficulty: 'easy', status: 'planned', scheduleDate: '', scheduleTime: '',
    });
  };

  const getStatusIcon = (task: typeof state.tasks[0]) => {
    if (task.status === 'done') return <CheckCircle2 size={18} className="text-emerald-500" />;
    if (task.status === 'postponed') return <Pause size={18} className="text-[var(--color-text-secondary)]" />;
    if (task.status === 'in_progress') return <AlertCircle size={18} style={{ color: accentColor }} />;
    return <Circle size={18} className="text-[var(--color-text-secondary)]" />;
  };

  const getPriorityColor = (p: string) => TASK_PRIORITIES.find(tp => tp.id === p)?.color || '#6B7785';
  const getDifficultyLabel = (d: string) => TASK_DIFFICULTIES.find(td => td.id === d)?.label || d;

  const tabs: { id: TabFilter; label: string }[] = [
    { id: 'today', label: 'Сегодня' },
    { id: 'tomorrow', label: 'Завтра' },
    { id: 'overdue', label: 'Просроченные' },
    { id: 'all', label: 'Все' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope' }}>Квесты</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary text-sm" style={{ background: accentColor }}>
          <Plus size={16} /> Новый квест
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="text-sm px-4 py-2 rounded-xl whitespace-nowrap transition-colors"
            style={{
              background: tab === t.id ? `${accentColor}15` : 'rgba(255,255,255,0.4)',
              color: tab === t.id ? accentColor : '#6B7785',
              fontWeight: tab === t.id ? 600 : 400,
            }}
          >
            {t.label}
            {t.id === 'overdue' && state.tasks.filter(tk => tk.status !== 'done' && tk.status !== 'postponed' && isPast(parseISO(tk.deadline)) && !isToday(parseISO(tk.deadline))).length > 0 && (
              <span className="ml-1 text-xs">•</span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredTasks.length > 0 ? filteredTasks.map((task, i) => (
            <motion.div
              key={task.id}
              className="glass-card-sm p-4 relative overflow-hidden"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.03 }}
            >
              {xpFlash === task.id && (
                <div className="absolute top-2 right-2 text-xs font-bold text-emerald-500 xp-flash">+XP ✨</div>
              )}
              <div className="flex items-start gap-3">
                <button
                  onClick={() => task.status !== 'done' ? handleComplete(task.id) : null}
                  className="mt-0.5 flex-shrink-0"
                >
                  {getStatusIcon(task)}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-[var(--color-text-secondary)]' : ''}`}>
                      {task.title}
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${getPriorityColor(task.priority)}15`, color: getPriorityColor(task.priority) }}>
                      {getDifficultyLabel(task.difficulty)}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--color-text-secondary)]">
                    {task.time && <span className="flex items-center gap-0.5"><Clock size={10} /> {task.time}</span>}
                    <span>{format(parseISO(task.deadline), 'd MMM', { locale: ru })}</span>
                    {task.goalId && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">связана с целью</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {task.status !== 'done' && (
                    <button
                      onClick={() => updateTask(task.id, { status: task.status === 'postponed' ? 'planned' : 'postponed' })}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 text-[var(--color-text-secondary)]"
                      title={task.status === 'postponed' ? 'Вернуть' : 'Отложить'}
                    >
                      <Pause size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-50 text-rose-400"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          )) : (
            <EmptyState
              icon={tab === 'overdue' ? '🎉' : '📋'}
              title={tab === 'overdue' ? 'Нет просроченных!' : 'Пока пусто'}
              description={tab === 'overdue' ? 'Все задачи выполнены или отложены' : 'Создайте первый квест'}
              action={tab !== 'overdue' ? <button onClick={() => setShowModal(true)} className="btn btn-primary text-sm" style={{ background: accentColor }}>Создать квест</button> : undefined}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Add modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Новый квест">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Название</label>
            <input type="text" value={formData.title} onChange={e => setFormData(d => ({ ...d, title: e.target.value }))} placeholder="Что нужно сделать?" autoFocus />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Описание</label>
            <textarea value={formData.description} onChange={e => setFormData(d => ({ ...d, description: e.target.value }))} placeholder="Необязательно" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Дедлайн</label>
              <input type="date" value={formData.deadline} onChange={e => setFormData(d => ({ ...d, deadline: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Время</label>
              <input type="time" value={formData.time} onChange={e => setFormData(d => ({ ...d, time: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Приоритет</label>
              <select value={formData.priority} onChange={e => setFormData(d => ({ ...d, priority: e.target.value as 'low' | 'medium' | 'high' }))}>
                {TASK_PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Сложность</label>
              <select value={formData.difficulty} onChange={e => setFormData(d => ({ ...d, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}>
                {TASK_DIFFICULTIES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Привязать к цели</label>
            <select value={formData.goalId} onChange={e => setFormData(d => ({ ...d, goalId: e.target.value }))}>
              <option value="">Не привязана</option>
              {state.goals.filter(g => g.status === 'active').map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </div>
          <button onClick={handleSubmit} className="btn btn-primary w-full" style={{ background: accentColor }}>
            Создать квест
          </button>
        </div>
      </Modal>
    </div>
  );
}
