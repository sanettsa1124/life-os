import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Sparkles, Wallet, Target } from 'lucide-react';

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('80000');
  const [goalTitle, setGoalTitle] = useState('');
  const setOnboarded = useStore(s => s.setOnboarded);

  const steps = [
    {
      icon: <Sparkles size={40} style={{ color: '#3E8E7E' }} />,
      title: 'Привет! Как тебя зовут?',
      subtitle: 'Это имя будет отображаться в профиле',
      content: (
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Твоё имя"
          className="text-lg text-center"
          autoFocus
        />
      ),
      canNext: name.trim().length > 0,
    },
    {
      icon: <Wallet size={40} style={{ color: '#D69A3C' }} />,
      title: 'Какой у тебя месячный бюджет?',
      subtitle: 'Это поможет рассчитать «свободные деньги» на каждый день',
      content: (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder="80000"
            className="text-lg text-center tabular-nums"
          />
          <span className="text-lg font-medium text-[var(--color-text-secondary)]">₽</span>
        </div>
      ),
      canNext: Number(budget) > 0,
    },
    {
      icon: <Target size={40} style={{ color: '#5B8DB8' }} />,
      title: 'Какая у тебя главная цель?',
      subtitle: 'Можешь изменить позже. Например: «Накопить на путешествие»',
      content: (
        <input
          type="text"
          value={goalTitle}
          onChange={e => setGoalTitle(e.target.value)}
          placeholder="Например: Новый ноутбук"
          className="text-lg text-center"
          autoFocus
        />
      ),
      canNext: goalTitle.trim().length > 0,
    },
  ];

  const current = steps[step];

  const handleFinish = () => {
    setOnboarded(name.trim(), Number(budget), goalTitle.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        className="glass-card w-full max-w-md p-8 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-center mb-6">{current.icon}</div>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Manrope' }}>{current.title}</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">{current.subtitle}</p>
            <div className="mb-6">{current.content}</div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-colors" style={{ background: i <= step ? '#3E8E7E' : 'rgba(0,0,0,0.1)' }} />
            ))}
          </div>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="btn btn-secondary text-sm">Назад</button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} disabled={!current.canNext} className="btn btn-primary text-sm disabled:opacity-40">
                Далее
              </button>
            ) : (
              <button onClick={handleFinish} disabled={!current.canNext} className="btn btn-primary text-sm disabled:opacity-40">
                Начать ✨
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
