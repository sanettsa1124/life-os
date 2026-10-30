import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { calcFreeMoney, calcAccentColor, getDailyExpenses, getCategoryDistribution } from '../store/energyEngine';
import { GlassCard, Modal, ProgressBar, EmptyState } from '../components/ui';
import { CATEGORIES } from '../config';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, ReferenceLine, PieChart, Pie, Cell, Tooltip } from 'recharts';

export function Finance() {
  const state = useStore();
  const addTransaction = useStore(s => s.addTransaction);
  const deleteTransaction = useStore(s => s.deleteTransaction);
  const accent = calcAccentColor(state);
  const accentColor = accent === 'success' ? '#3E8E7E' : accent === 'warning' ? '#D69A3C' : '#D97777';

  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [formData, setFormData] = useState({
    amount: '', type: 'expense' as 'income' | 'expense', category: 'food',
    date: format(new Date(), 'yyyy-MM-dd'), comment: '', recurring: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
  });

  const freeMoney = calcFreeMoney(state);

  const filteredTransactions = state.transactions
    .filter(t => filter === 'all' || t.type === filter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalIncome = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const dailyExpenses = getDailyExpenses(state.transactions, 14);
  const categoryDist = getCategoryDistribution(state.transactions);
  const dailyBudget = Math.round(state.profile.monthlyBudget / 30);

  const handleSubmit = () => {
    if (!formData.amount || Number(formData.amount) <= 0) return;
    addTransaction({
      amount: Number(formData.amount),
      type: formData.type,
      category: formData.category,
      date: formData.date,
      comment: formData.comment,
      recurring: formData.recurring,
    });
    setShowModal(false);
    setFormData({ amount: '', type: 'expense', category: 'food', date: format(new Date(), 'yyyy-MM-dd'), comment: '', recurring: 'none' });
  };

  const getCategoryLabel = (id: string) => CATEGORIES.find(c => c.id === id)?.label || id;
  const getCategoryColor = (id: string) => CATEGORIES.find(c => c.id === id)?.color || '#6B7785';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope' }}>Финансы</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary text-sm" style={{ background: accentColor }}>
          <Plus size={16} /> Добавить
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard delay={0.05}>
          <p className="text-xs text-[var(--color-text-secondary)] mb-1">Доход за месяц</p>
          <p className="text-xl font-bold tabular-nums text-emerald-600">+{totalIncome.toLocaleString()} {state.profile.currency}</p>
        </GlassCard>
        <GlassCard delay={0.1}>
          <p className="text-xs text-[var(--color-text-secondary)] mb-1">Расход за месяц</p>
          <p className="text-xl font-bold tabular-nums text-rose-500">−{totalExpense.toLocaleString()} {state.profile.currency}</p>
        </GlassCard>
        <GlassCard delay={0.15}>
          <p className="text-xs text-[var(--color-text-secondary)] mb-1">Свободно сегодня</p>
          <p className="text-xl font-bold tabular-nums" style={{ color: accentColor }}>{freeMoney.amount.toLocaleString()} {state.profile.currency}</p>
          <div className="mt-2">
            <ProgressBar
              value={Math.min(100, (totalExpense / state.profile.monthlyBudget) * 100)}
              color={freeMoney.status === 'ok' ? '#3E8E7E' : freeMoney.status === 'risk' ? '#D69A3C' : '#D97777'}
              height={4}
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {Math.round((totalExpense / state.profile.monthlyBudget) * 100)}% бюджета
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard delay={0.2}>
          <h3 className="font-semibold text-sm mb-4">Расходы по дням</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyExpenses}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Bar dataKey="amount" fill={accentColor} radius={[4, 4, 0, 0]} />
              <ReferenceLine y={dailyBudget} stroke="#D69A3C" strokeDasharray="4 4" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">Пунктир — дневной лимит ({dailyBudget.toLocaleString()} {state.profile.currency})</p>
        </GlassCard>

        <GlassCard delay={0.25}>
          <h3 className="font-semibold text-sm mb-4">По категориям</h3>
          {categoryDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={categoryDist} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
                  {categoryDist.map((entry, i) => (
                    <Cell key={i} fill={getCategoryColor(entry.category)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} ${state.profile.currency}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-[var(--color-text-secondary)]">Нет данных</div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {categoryDist.slice(0, 4).map(c => (
              <span key={c.category} className="text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: getCategoryColor(c.category) }} />
                {getCategoryLabel(c.category)}
              </span>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Transactions list */}
      <GlassCard delay={0.3}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Операции</h3>
          <div className="flex gap-1">
            {(['all', 'income', 'expense'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: filter === f ? `${accentColor}15` : 'transparent',
                  color: filter === f ? accentColor : '#6B7785',
                }}
              >
                {f === 'all' ? 'Все' : f === 'income' ? 'Доходы' : 'Расходы'}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredTransactions.map(t => (
              <motion.div
                key={t.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/30 transition-colors group"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${getCategoryColor(t.category)}15` }}>
                  {t.type === 'income' ? <TrendingUp size={14} className="text-emerald-600" /> : <TrendingDown size={14} className="text-rose-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.comment || getCategoryLabel(t.category)}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{getCategoryLabel(t.category)} · {format(parseISO(t.date), 'd MMM', { locale: ru })}</p>
                </div>
                <span className={`text-sm font-bold tabular-nums ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {t.type === 'income' ? '+' : '−'}{t.amount.toLocaleString()}
                </span>
                <button
                  onClick={() => deleteTransaction(t.id)}
                  className="opacity-0 group-hover:opacity-100 text-xs text-rose-400 hover:text-rose-600 transition-opacity ml-1"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState icon="💸" title="Нет операций" description="Добавьте первую операцию, чтобы начать следить за бюджетом" />
        )}
      </GlassCard>

      {/* Add modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Новая операция">
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFormData(d => ({ ...d, type: 'expense' }))}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ background: formData.type === 'expense' ? 'rgba(217,119,119,0.1)' : 'rgba(0,0,0,0.03)', color: formData.type === 'expense' ? '#D97777' : '#6B7785' }}
            >
              Расход
            </button>
            <button
              onClick={() => setFormData(d => ({ ...d, type: 'income' }))}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ background: formData.type === 'income' ? 'rgba(62,142,126,0.1)' : 'rgba(0,0,0,0.03)', color: formData.type === 'income' ? '#3E8E7E' : '#6B7785' }}
            >
              Доход
            </button>
          </div>

          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Сумма</label>
            <input type="number" value={formData.amount} onChange={e => setFormData(d => ({ ...d, amount: e.target.value }))} placeholder="0" className="tabular-nums text-lg" />
          </div>

          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Категория</label>
            <select value={formData.category} onChange={e => setFormData(d => ({ ...d, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Дата</label>
            <input type="date" value={formData.date} onChange={e => setFormData(d => ({ ...d, date: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Комментарий</label>
            <input type="text" value={formData.comment} onChange={e => setFormData(d => ({ ...d, comment: e.target.value }))} placeholder="Необязательно" />
          </div>

          <button onClick={handleSubmit} className="btn btn-primary w-full" style={{ background: accentColor }}>
            Добавить
          </button>
        </div>
      </Modal>
    </div>
  );
}
