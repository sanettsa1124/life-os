import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from './store/useStore';
import { calcAccentColor } from './store/energyEngine';
import { Navigation } from './components/Navigation';
import { Onboarding } from './screens/Onboarding';
import { Dashboard } from './screens/Dashboard';
import { Finance } from './screens/Finance';
import { Tasks } from './screens/Tasks';
import { Goals } from './screens/Goals';
import { Schedule } from './screens/Schedule';
import { Profile } from './screens/Profile';
import { Screen } from './types';

function App() {
  const profile = useStore(s => s.profile);
  const [screen, setScreen] = useState<Screen>('dashboard');

  // Update CSS accent color based on state
  const state = useStore();
  const accent = calcAccentColor(state);
  const accentColor = accent === 'success' ? '#3E8E7E' : accent === 'warning' ? '#D69A3C' : '#D97777';

  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', accentColor);
  }, [accentColor]);

  // Show onboarding if not completed
  if (!profile.onboarded) {
    return <Onboarding />;
  }

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard': return <Dashboard onNavigate={setScreen} />;
      case 'finance': return <Finance />;
      case 'tasks': return <Tasks />;
      case 'goals': return <Goals />;
      case 'schedule': return <Schedule />;
      case 'profile': return <Profile />;
      default: return <Dashboard onNavigate={setScreen} />;
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation current={screen} onNavigate={setScreen} />

      {/* Main content */}
      <main className="md:ml-64 pb-24 md:pb-8 px-4 sm:px-6 lg:px-8 pt-6 max-w-[1280px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
