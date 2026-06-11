import React, { useEffect } from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/layout/Sidebar';
import PlayerBar from './components/layout/PlayerBar';
import Home from './pages/Home';
import LiveVibes from './pages/LiveVibes';
import Search from './pages/Search';
import ExamMode from './pages/ExamMode';
import { Library, Settings } from './pages/Stubs';
import MusicPlayerFullScreen from './components/MusicPlayerFullScreen';

import { useAuth } from './hooks/useAuth';
import { useThemeStore } from './store/themeStore';
import { useVibeStore } from './store/vibeStore';
import TopRightProfile from './components/layout/TopRightProfile';
import { audioEngine } from './lib/audioEngine';

import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const pageTransition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.3
} as const;

import AppSkeleton from './components/layout/AppSkeleton';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const { theme, isSidebarCollapsed } = useThemeStore();
  const location = useLocation();

  const { fetchLocation } = useVibeStore();
  const isOnboarded = useVibeStore(state => state.preferences.isOnboarded);

  useEffect(() => {
    fetchLocation();

    // Audio Context Primer: Unlocks audio on first click/touch
    const primeAudio = async () => {
      try {
        await audioEngine.resume();
        console.log('🔊 AudioEngine primed on user gesture');
        window.removeEventListener('click', primeAudio);
        window.removeEventListener('touchstart', primeAudio);
      } catch (e) { }
    };
    window.addEventListener('click', primeAudio, { once: true });
    window.addEventListener('touchstart', primeAudio, { once: true });

    // Pre-fetch critical data for Home page early
    import('./services/audiusService').then(({ audiusService }) => {
      audiusService.getTrendingTracks();
      audiusService.getTrendingIndianTracks();
    });

    // Apply theme class to body
    document.body.className = '';
    document.body.classList.add(`theme-${theme}`);

    // Add mobile-friendly viewport meta if missing
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0';
      document.head.appendChild(meta);
    }
  }, [theme]);

  if (loading) {
    return <AppSkeleton theme={theme} isSidebarCollapsed={isSidebarCollapsed} />;
  }

  // If no user, show the Auth page
  if (!user) {
    return <Auth />;
  }

  if (!isOnboarded) {
    return <Onboarding onComplete={() => window.location.reload()} />;
  }

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      <Sidebar />
      <TopRightProfile />
      <main className="main-content">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/search" element={<PageWrapper><Search /></PageWrapper>} />
            <Route path="/library" element={<PageWrapper><Library /></PageWrapper>} />
            <Route path="/vibes/:id" element={<PageWrapper><LiveVibes /></PageWrapper>} />
            <Route path="/exam" element={<PageWrapper><ExamMode /></PageWrapper>} />
            <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </main>
      <PlayerBar />
      <AnimatePresence>
        <MusicPlayerFullScreen />
      </AnimatePresence>
    </div>
  );
};

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageVariants}
    transition={pageTransition}
    style={{ height: '100%', width: '100%' }}
  >
    {children}
  </motion.div>
);

export default App;
