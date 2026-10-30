import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { calcAccentColor } from '../store/energyEngine';
import { GlassCard, Modal, EmptyState } from '../components/ui';
import { format, addDays, startOfWeek, eachDayOfInterval, isToday, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

export function Schedule() {
  const state = useStore();
  const addScheduleEvent = useStore(s => s.addScheduleEvent);
  const deleteScheduleEvent = useStore(s => s.deleteScheduleEvent);
  const accent = calcAccentColor(state);
  const accentColor = accent === 'success' ? '#3E8E7E' : accent === 'warning' ? '#D69A3C' : '#D97777';

  const [view, setView] = useState<'day' | 'week'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '', date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00', endTime: '10:00', type: 'task' as 'task' | 'rest' | 'no_budget' | 'custom',
    color: '#3E8E7E',
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 - 21:00

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return state.schedule.filter(e => e.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Проверка перегрузки
  const todayEvents = getEventsForDay(new Date());
  const totalHoursToday = todayEvents.reduce((sum, e) => {
    const [sh, sm] = e.startTime.split(':').map(Number);
    const [eh, em] = e.endTime.split(':').map(Number);
    return sum + (eh + em / 60 - sh - sm / 60);
  }, 0);
  const isOverloaded = totalHoursToday > 6;

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    const colors: Record<string, string> = { task: '#3E8E7E', rest: '#8B6DB0', no_budget: '#D69A3C', custom: '#5B8DB8' };
    addScheduleEvent({
      title: formData.title,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      taskId: null,
      type: formData.type,
      color: colors[formData.type] || formData.color,
    });
    setShowModal(false);
    setFormData({ title: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '10:00', type: 'task', color: '#3E8E7E' });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'task': return 'Задача';
      case 'rest': return 'Отдых';
      case 'no_budget': return 'Без бюджета';
      case 'custom': return 'Событие';
      default: return type;
    }
  };

  const getEventPosition = (startTime: string, endTime: string) => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMinutes = (sh - 6) * 60 + sm;
    const endMinutes = (eh - 6) * 60 + em;
    const top = (startMinutes / (16 * 60)) * 100;
    const height = ((endMinutes - startMinutes) / (16 * 60)) * 100;
    return { top: `${top}%`, height: `${Math.max(height, 3)}%` };
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope' }}>Расписание</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary text-sm" style={{ background: accentColor }}>
          <Plus size={16} /> Событие
        </button>
      </div>

      {/* Overload warning */}
      {isOverloaded && (
        <motion.div
          className="glass-card-sm p-3 flex items-center gap-2"
          style={{ background: 'rgba(214,154,60,0.1)', border: '1px solid rgba(214,154,60,0.3)' }}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertTriangle size={16} style={{ color: '#D69A3C' }} />
          <span className="text-xs" style={{ color: '#D69A3C' }}>
            Слишком плотный день ({Math.round(totalHoursToday)}ч задач). Может, перенести что-нибудь?
          </span>
        </motion.div>
      )}

      {/* View toggle + navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setView('day')}
            className="text-sm px-3 py-1.5 rounded-lg"
            style={{ background: view === 'day' ? `${accentColor}15` : 'transparent', color: view === 'day' ? accentColor : '#6B7785' }}
          >
            День
          </button>
          <button
            onClick={() => setView('week')}
            className="text-sm px-3 py-1.5 rounded-lg"
            style={{ background: view === 'week' ? `${accentColor}15` : 'transparent', color: view === 'week' ? accentColor : '#6B7785' }}
          >
            Неделя
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(d => view === 'week' ? addDays(d, -7) : addDays(d, -1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="text-xs px-2 py-1 rounded-lg hover:bg-black/5">
            Сегодня
          </button>
          <button onClick={() => setCurrentDate(d => view === 'week' ? addDays(d, 7) : addDays(d, 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Week view */}
      {view === 'week' && (
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => {
            const events = getEventsForDay(day);
            const isCurrentDay = isToday(day);
            return (
              <div key={day.toISOString()} className="glass-card-sm p-2 min-h-[120px]">
                <div className={`text-xs font-medium mb-2 text-center ${isCurrentDay ? 'text-white px-2 py-0.5 rounded-full' : 'text-[var(--color-text-secondary)]'}`}
                  style={isCurrentDay ? { background: accentColor } : {}}>
                  {format(day, 'EEE', { locale: ru })} {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {events.slice(0, 3).map(e => (
                    <div key={e.id} className="text-[10px] px-1.5 py-0.5 rounded truncate" style={{ background: `${e.color}20`, color: e.color }}>
                      {e.startTime} {e.title}
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="text-[10px] text-[var(--color-text-secondary)] text-center">+{events.length - 3}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Day view */}
      {view === 'day' && (
        <GlassCard>
          <h3 className="text-sm font-semibold mb-3">
            {format(currentDate, 'EEEE, d MMMM', { locale: ru })}
          </h3>
          <div className="relative" style={{ height: '500px' }}>
            {/* Hour lines */}
            {hours.map(h => (
              <div key={h} className="absolute left-0 right-0 flex items-start" style={{ top: `${((h - 6) / 16) * 100}%` }}>
                <span className="text-[10px] text-[var(--color-text-secondary)] w-10 flex-shrink-0 tabular-nums">{h}:00</span>
                <div className="flex-1 border-t border-black/5" />
              </div>
            ))}
            {/* Events */}
            {getEventsForDay(currentDate).map(e => {
              const pos = getEventPosition(e.startTime, e.endTime);
              return (
                <motion.div
                  key={e.id}
                  className="absolute left-12 right-2 rounded-lg p-2 overflow-hidden group cursor-pointer"
                  style={{ top: pos.top, height: pos.height, background: `${e.color}15`, border: `1px solid ${e.color}30` }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <p className="text-xs font-medium truncate" style={{ color: e.color }}>{e.title}</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">{e.startTime}–{e.endTime}</p>
                  {e.type !== 'task' && <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: `${e.color}20`, color: e.color }}>{getTypeLabel(e.type)}</span>}
                  <button
                    onClick={(ev) => { ev.stopPropagation(); deleteScheduleEvent(e.id); }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-xs text-rose-400"
                  >
                    ✕
                  </button>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Add modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Новое событие">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Название</label>
            <input type="text" value={formData.title} onChange={e => setFormData(d => ({ ...d, title: e.target.value }))} placeholder="Что запланировано?" autoFocus />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Тип</label>
            <div className="grid grid-cols-4 gap-2">
              {(['task', 'rest', 'no_budget', 'custom'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setFormData(d => ({ ...d, type: t }))}
                  className="text-xs py-2 rounded-lg transition-colors"
                  style={{
                    background: formData.type === t ? `${accentColor}15` : 'rgba(0,0,0,0.03)',
                    color: formData.type === t ? accentColor : '#6B7785',
                    fontWeight: formData.type === t ? 600 : 400,
                  }}
                >
                  {getTypeLabel(t)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Дата</label>
            <input type="date" value={formData.date} onChange={e => setFormData(d => ({ ...d, date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Начало</label>
              <input type="time" value={formData.startTime} onChange={e => setFormData(d => ({ ...d, startTime: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Конец</label>
              <input type="time" value={formData.endTime} onChange={e => setFormData(d => ({ ...d, endTime: e.target.value }))} />
            </div>
          </div>
          <button onClick={handleSubmit} className="btn btn-primary w-full" style={{ background: accentColor }}>
            Добавить
          </button>
        </div>
      </Modal>
    </div>
  );
}
