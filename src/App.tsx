import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { useUserStore } from './store/userStore';
import { RouteTracker } from './components/RouteTracker';
import { AutoSchema } from './components/seo/AutoSchema';
import { AppShellSkeleton } from './components/skeletons/AppShellSkeleton';

// Layouts - Keep synchronous for immediate shell paint
import { ProtectedLayout } from './layouts/ProtectedLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LandingPage } from './pages/LandingPage';

// Lazy load Login and other pages
const Login = lazy(() => import('./pages/auth/Login').then(module => ({ default: module.Login })));

// Lazy Loaded Routes
const Overview = lazy(() => import('./pages/dashboard/Overview').then(module => ({ default: module.Overview })));
const Syllabus = lazy(() => import('./pages/dashboard/Syllabus').then(module => ({ default: module.Syllabus })));
const Timeline = lazy(() => import('./pages/dashboard/Timeline').then(module => ({ default: module.Timeline })));
const Documents = lazy(() => import('./pages/dashboard/Documents').then(module => ({ default: module.Documents })));
const Analytics = lazy(() => import('./pages/dashboard/Analytics').then(module => ({ default: module.Analytics })));
const MockGenerator = lazy(() => import('./pages/dashboard/MockGenerator').then(module => ({ default: module.MockGenerator })));
const StudyPlan = lazy(() => import('./pages/dashboard/StudyPlan').then(module => ({ default: module.StudyPlan })));
const Lectures = lazy(() => import('./pages/dashboard/Lectures').then(module => ({ default: module.Lectures })));
const PeerBenchmarking = lazy(() => import('./pages/dashboard/PeerBenchmarking').then(module => ({ default: module.PeerBenchmarking })));
const DecisionSimulator = lazy(() => import('./pages/dashboard/DecisionSimulator').then(module => ({ default: module.DecisionSimulator })));
const Resources = lazy(() => import('./pages/dashboard/Resources').then(module => ({ default: module.Resources })));
const VideoLecturePage = lazy(() => import('./pages/dashboard/VideoLecturePage').then(module => ({ default: module.VideoLecturePage })));
const SavedLectures = lazy(() => import('./pages/dashboard/SavedLectures').then(module => ({ default: module.SavedLectures })));
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage').then(module => ({ default: module.ProfilePage })));
const Onboarding = lazy(() => import('./pages/dashboard/Onboarding').then(module => ({ default: module.Onboarding })));
const DiagnosticTest = lazy(() => import('./pages/dashboard/DiagnosticTest').then(module => ({ default: module.DiagnosticTest })));
const TestCenter = lazy(() => import('./pages/dashboard/TestCenter').then(module => ({ default: module.TestCenter })));
const ActiveTest = lazy(() => import('./pages/dashboard/ActiveTest').then(module => ({ default: module.ActiveTest })));
const SubjectSyllabus = lazy(() => import('./pages/dashboard/SubjectSyllabus').then(module => ({ default: module.SubjectSyllabus })));
const RankInfo = lazy(() => import('./pages/dashboard/RankInfo').then(module => ({ default: module.RankInfo })));

const ExamLanding = lazy(() => import('./pages/public/ExamLanding').then(module => ({ default: module.ExamLanding })));
const SubjectPage = lazy(() => import('./pages/public/SubjectPage').then(module => ({ default: module.SubjectPage })));
const TopicPage = lazy(() => import('./pages/public/TopicPage').then(module => ({ default: module.TopicPage })));
const QuestionPage = lazy(() => import('./pages/public/QuestionPage').then(module => ({ default: module.QuestionPage })));
// const NotFound = lazy(() => import('./pages/public/NotFound').then(module => ({ default: module.NotFound })));

// Admin Routes (Lazy)
import { AdminLayout } from './layouts/AdminLayout';
const QuestionReview = lazy(() => import('./pages/admin/QuestionReview').then(module => ({ default: module.QuestionReview })));
const SyllabusUpload = lazy(() => import('./pages/admin/SyllabusUpload').then(module => ({ default: module.SyllabusUpload })));

const Chatbot = lazy(() => import('./components/Chatbot').then(module => ({ default: module.Chatbot })));

import { setUserProperties, trackGlitch, trackWebVitals } from './lib/analytics';
import { getRankByValue } from './services/gamificationService';
const LevelUpModal = lazy(() => import('./components/gamification/LevelUpModal').then(module => ({ default: module.LevelUpModal })));

// Helper component to manage floating UI visibility based on route
const FloatingUI = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useUserStore();

  // Hide chatbot during active tests or video playback
  const isExam = ['/dashboard/test-active', '/dashboard/diagnostic', '/dashboard/mock'].includes(pathname);
  const isLecture = pathname.startsWith('/dashboard/lectures');
  const shouldHide = isExam || isLecture;

  if (!isAuthenticated || shouldHide) return null;

  return (
    <Suspense fallback={null}>
      <Chatbot />
    </Suspense>
  );
};

function App() {
  console.log("🚀 [App] Rendering...");
  const { user, initialize } = useUserStore();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpXp, setLevelUpXp] = useState(0);
  const prevRankNameRef = useRef<string | null>(null);

  useEffect(() => {
    initialize();
    trackWebVitals(); // Start SEO Health Monitoring

    // Capture registration intent from URL
    const searchParams = new URLSearchParams(window.location.search);
    const intentClass = searchParams.get('class');
    const intentExam = searchParams.get('exam');
    if (intentClass || intentExam) {
      const intent = {
        class: intentClass,
        exam: intentExam,
        timestamp: Date.now()
      };
      sessionStorage.setItem('exam_compass_intent', JSON.stringify(intent));
      console.log('🎯 [App] Captured User Intent:', intent);
    }

    // 1. Global Glitch Monitor (Unstoppable Error Tracking)
    const handleError = (event: ErrorEvent) => {
      trackGlitch(event.message, 'Global/App');
    };
    window.addEventListener('error', handleError);

    // 2. Global Promise Rejection Monitor (Async Failures)
    const handleRejection = (event: PromiseRejectionEvent) => {
      // Extract useful message from reason
      const reason = event.reason;
      const message = reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : JSON.stringify(reason);

      trackGlitch(`Unhandled Rejection: ${message}`, 'Global/Async');
    };
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // 2. Sync User Properties whenever user profile changes
  useEffect(() => {
    if (user) {
      setUserProperties({
        user_class: user.userClass || 'unknown',
        selected_exam: user.targetExam || 'General',
        auth_status: 'authenticated'
      });

      // 3. Level Up Detection
      const xp = Number(user.xp || 0);
      const currentRank = getRankByValue(xp);

      if (prevRankNameRef.current && prevRankNameRef.current !== currentRank.name) {
        // Rank changed!
        setLevelUpXp(xp);
        setShowLevelUp(true);
      }
      prevRankNameRef.current = currentRank.name;
    } else {
      setUserProperties({
        auth_status: 'anonymous'
      });
      prevRankNameRef.current = null;
    }
  }, [user?.xp, user?.id]);

  return (
    <BrowserRouter>
      <RouteTracker />
      <AutoSchema />
      <Suspense fallback={<AppShellSkeleton />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* SEO Public Routes */}
          <Route path="/:exam" element={<ExamLanding />} />
          <Route path="/:exam/:subject" element={<SubjectPage />} />
          <Route path="/:exam/:subject/:topic" element={<TopicPage />} />
          <Route path="/:exam/q/:slug" element={<QuestionPage />} />

          {/* Protected Routes (Auth + Onboarding Check) */}
          <Route element={<ProtectedLayout />}>
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Video Lecture - Fullscreen without sidebar */}
            <Route path="/dashboard/lectures/:topicId" element={<VideoLecturePage />} />

            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Overview />} />
              <Route path="diagnostic" element={<DiagnosticTest />} />
              <Route path="mock" element={<MockGenerator />} />
              <Route path="study-plan" element={<StudyPlan />} />
              <Route path="lectures" element={<Lectures />} />
              <Route path="peer-benchmarking" element={<PeerBenchmarking />} />
              <Route path="decision-simulator" element={<DecisionSimulator />} />
              <Route path="syllabus" element={<Syllabus />} />
              <Route path="syllabus/:subject" element={<SubjectSyllabus />} />
              <Route path="saved-lectures" element={<SavedLectures />} />
              <Route path="timeline" element={<Timeline />} />
              <Route path="documents" element={<Documents />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="resources" element={<Resources />} />
              <Route path="test-center" element={<TestCenter />} />
              <Route path="test-active" element={<ActiveTest />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="ranks" element={<RankInfo />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="question-review" element={<QuestionReview />} />
            <Route path="upload-syllabus" element={<SyllabusUpload />} />
          </Route>

        </Routes>
      </Suspense>

      <FloatingUI />

      {showLevelUp && (
        <Suspense fallback={null}>
          <LevelUpModal
            newXp={levelUpXp}
            onClose={() => setShowLevelUp(false)}
          />
        </Suspense>
      )}
    </BrowserRouter>
  );
}

export default App;
