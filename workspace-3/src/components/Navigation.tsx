import { Home, Wallet, CheckSquare, Target, Calendar, User } from 'lucide-react';
import { Screen } from '../types';
import { useStore } from '../store/useStore';
import { calcAccentColor } from '../store/energyEngine';

const navItems: { id: Screen; icon: typeof Home; label: string }[] = [
  { id: 'dashboard', icon: Home, label: 'Главная' },
  { id: 'tasks', icon: CheckSquare, label: 'Квесты' },
  { id: 'goals', icon: Target, label: 'Цели' },
  { id: 'schedule', icon: Calendar, label: 'План' },
  { id: 'finance', icon: Wallet, label: 'Деньги' },
  { id: 'profile', icon: User, label: 'Профиль' },
];

interface NavigationProps {
  current: Screen;
  onNavigate: (screen: Screen) => void;
}

export function Navigation({ current, onNavigate }: NavigationProps) {
  const state = useStore();
  const accent = calcAccentColor(state);
  const accentColor = accent === 'success' ? '#3E8E7E' : accent === 'warning' ? '#D69A3C' : '#D97777';

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="nav-bottom md:hidden">
        <div className="flex items-center justify-around px-1 py-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center gap-0.5 py-1 px-1 min-w-[44px] min-h-[44px] rounded-xl transition-colors"
                style={{ color: active ? accentColor : '#6B7785' }}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.5} />
                <span className="text-[9px] font-medium leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col p-6 z-40"
        style={{ background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.7)' }}>
        <div className="mb-8">
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Manrope' }}>Life OS</h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">Панель управления жизнью</p>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                style={{
                  background: active ? 'rgba(62,142,126,0.1)' : 'transparent',
                  color: active ? accentColor : '#6B7785',
                }}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.5} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="mt-auto pt-4">
          <div className="glass-card-sm p-3">
            <p className="text-xs text-[var(--color-text-secondary)]">Уровень {Math.floor(state.xp / 200) + 1}</p>
            <div className="mt-1 h-1.5 rounded-full bg-black/5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(state.xp % 200) / 2}%`, background: accentColor }} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
