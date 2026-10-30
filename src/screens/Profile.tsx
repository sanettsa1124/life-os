import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Award, Star, Download, Upload, RotateCcw, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';
import { calcLevel, calcXpProgress, calcAccentColor } from '../store/energyEngine';
import { GlassCard, ProgressBar, CircularProgress } from '../components/ui';
import { BADGES } from '../config';
import { format } from 'date-fns';

export function Profile() {
  const state = useStore();
  const updateProfile = useStore(s => s.updateProfile);
  const resetToDemo = useStore(s => s.resetToDemo);
  const importData = useStore(s => s.importData);
  const exportData = useStore(s => s.exportData);
  const clearAll = useStore(s => s.clearAll);
  const accent = calcAccentColor(state);
  const accentColor = accent === 'success' ? '#3E8E7E' : accent === 'warning' ? '#D69A3C' : '#D97777';

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(state.profile.name);
  const [editBudget, setEditBudget] = useState(String(state.profile.monthlyBudget));
  const fileRef = useRef<HTMLInputElement>(null);

  const level = calcLevel(state.xp);
  const xpProgress = calcXpProgress(state.xp);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-os-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        importData(data);
        alert('Данные импортированы!');
      } catch {
        alert('Ошибка: неверный формат файла');
      }
    };
    reader.readAsText(file);
  };

  const handleSave = () => {
    updateProfile({ name: editName, monthlyBudget: Number(editBudget) || 80000 });
    setEditing(false);
  };

  // Geometric avatar based on level
  const avatarShapes = level >= 5 ? 5 : level >= 3 ? 4 : level >= 2 ? 3 : 2;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope' }}>Профиль</h1>

      {/* Avatar + Level */}
      <GlassCard className="flex flex-col items-center py-8">
        {/* Geometric avatar */}
        <div className="relative mb-4">
          <CircularProgress value={xpProgress * 100} size={120} strokeWidth={6} color={accentColor}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}40)` }}>
              {/* Geometric shapes */}
              <svg width="60" height="60" viewBox="0 0 60 60">
                <circle cx="30" cy="22" r="10" fill={accentColor} opacity="0.6" />
                {avatarShapes >= 3 && <rect x="18" y="35" width="24" height="12" rx="4" fill={accentColor} opacity="0.4" />}
                {avatarShapes >= 4 && <polygon points="30,8 35,16 25,16" fill={accentColor} opacity="0.8" />}
                {avatarShapes >= 5 && <circle cx="30" cy="22" r="14" fill="none" stroke={accentColor} strokeWidth="1" opacity="0.5" />}
              </svg>
            </div>
          </CircularProgress>
        </div>

        <h2 className="text-lg font-bold">{state.profile.name}</h2>
        <div className="flex items-center gap-2 mt-1">
          <Star size={14} style={{ color: accentColor }} />
          <span className="text-sm font-semibold">Уровень {level}</span>
        </div>

        <div className="w-full max-w-xs mt-4">
          <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
            <span>{state.xp} XP</span>
            <span>{200 - Math.round(xpProgress * 200)} до ур. {level + 1}</span>
          </div>
          <ProgressBar value={xpProgress * 100} color={accentColor} height={6} />
        </div>

        <div className="flex gap-4 mt-4 text-center">
          <div>
            <p className="text-lg font-bold tabular-nums" style={{ color: accentColor }}>{state.energy}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)]">Энергия</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{state.tasks.filter(t => t.status === 'done').length}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)]">Квестов</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">{state.goals.filter(g => g.status === 'completed').length}</p>
            <p className="text-[10px] text-[var(--color-text-secondary)]">Целей</p>
          </div>
        </div>
      </GlassCard>

      {/* Badges */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Award size={16} style={{ color: accentColor }} />
          <h3 className="font-semibold text-sm">Бейджи</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BADGES.map(badge => {
            const earned = state.badges.find(b => b.id === badge.id);
            return (
              <div key={badge.id} className={`p-3 rounded-xl text-center transition-opacity ${earned ? '' : 'opacity-30'}`}
                style={{ background: earned ? `${accentColor}08` : 'rgba(0,0,0,0.02)' }}>
                <span className="text-2xl">{badge.icon}</span>
                <p className="text-xs font-medium mt-1">{badge.label}</p>
                <p className="text-[10px] text-[var(--color-text-secondary)]">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Settings */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Settings size={16} style={{ color: accentColor }} />
          <h3 className="font-semibold text-sm">Настройки</h3>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Имя</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Месячный бюджет</label>
              <input type="number" value={editBudget} onChange={e => setEditBudget(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="btn btn-primary text-sm flex-1" style={{ background: accentColor }}>Сохранить</button>
              <button onClick={() => setEditing(false)} className="btn btn-secondary text-sm">Отмена</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-black/5">
              <span className="text-sm text-[var(--color-text-secondary)]">Имя</span>
              <span className="text-sm font-medium">{state.profile.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-black/5">
              <span className="text-sm text-[var(--color-text-secondary)]">Бюджет/мес</span>
              <span className="text-sm font-medium tabular-nums">{state.profile.monthlyBudget.toLocaleString()} {state.profile.currency}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-[var(--color-text-secondary)]">Валюта</span>
              <span className="text-sm font-medium">{state.profile.currency}</span>
            </div>
            <button onClick={() => setEditing(true)} className="btn btn-secondary text-sm w-full mt-2">Редактировать</button>
          </div>
        )}
      </GlassCard>

      {/* Data management */}
      <GlassCard>
        <h3 className="font-semibold text-sm mb-4">Данные</h3>
        <div className="space-y-2">
          <button onClick={handleExport} className="btn btn-secondary text-sm w-full">
            <Download size={14} /> Экспорт JSON
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn btn-secondary text-sm w-full">
            <Upload size={14} /> Импорт JSON
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <button onClick={resetToDemo} className="btn btn-secondary text-sm w-full">
            <RotateCcw size={14} /> Сбросить демо-данные
          </button>
          <button onClick={() => { if (confirm('Удалить все данные? Это действие необратимо.')) clearAll(); }} className="btn btn-danger text-sm w-full">
            Удалить все данные
          </button>
        </div>
      </GlassCard>
    </div>
  );
}


