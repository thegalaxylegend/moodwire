import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { useUserStore } from './store/userStore';
import { RouteTracker } from './components/RouteTracker';
import { AutoSchema } from './components/seo/AutoSchema';
import { AppShellSkeleton } from './components/skeletons/AppShellSkeleton';

// Layouts - Keep synchronous for immediate shell paint
import { ProtectedLayout } from './layouts/ProtectedLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages - Keep synchronous for SEO & SSG rendering
import { LandingPage } from './pages/LandingPage';
import { ExamLanding } from './pages/public/ExamLanding';
import { SubjectPage } from './pages/public/SubjectPage';
import { TopicPage } from './pages/public/TopicPage';
import { QuestionPage } from './pages/public/QuestionPage';

// Auth - Lazy
const Login = lazy(() => import('./pages/auth/Login').then(module => ({ default: module.Login })));

// Dashboard Routes - Lazy (Protected)
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

// Admin Routes - Lazy
const QuestionReview = lazy(() => import('./pages/admin/QuestionReview').then(module => ({ default: module.QuestionReview })));
const SyllabusUpload = lazy(() => import('./pages/admin/SyllabusUpload').then(module => ({ default: module.SyllabusUpload })));

// Components - Lazy
const Chatbot = lazy(() => import('./components/Chatbot').then(module => ({ default: module.Chatbot })));
const LevelUpModal = lazy(() => import('./components/gamification/LevelUpModal').then(module => ({ default: module.LevelUpModal })));

// SEO Monitoring
const trackWebVitals = async () => {
  const { onCLS, onFID, onLCP, onFCP, onTTFB } = await import('web-vitals');
  onCLS(console.log);
  onFID(console.log);
  onLCP(console.log);
  onFCP(console.log);
  onTTFB(console.log);
};

const setUserProperties = async (props: any) => {
  // Analytics is client-side only and optional for SSG. Placeholder for now.
  console.log("Analytics Properties:", props);
};

const FloatingUI = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Delay chatbot loading to prioritize LCP/FCP
    const timer = setTimeout(() => setMounted(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

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
    if (typeof window !== 'undefined') {
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
      }

      // Capture referral code from URL
      const refCode = searchParams.get('ref');
      if (refCode) {
        sessionStorage.setItem('referral_code', refCode);
        console.log("🎁 [Referral] Stored referral code:", refCode);
      }
    }
  }, []);

  // Level Up Detection Logic
  useEffect(() => {
    const checkLevelUp = async () => {
      if (!user) return;

      const { getRankByValue } = await import('./services/gamificationService');
      const currentRank = getRankByValue(user.xp);

      if (prevRankNameRef.current && prevRankNameRef.current !== currentRank.name) {
        console.log(`🎉 [LevelUp] User advanced to ${currentRank.name}!`);
        setLevelUpXp(user.xp);
        setShowLevelUp(true);
      }

      prevRankNameRef.current = currentRank.name;

      setUserProperties({
        target_exam: user.targetExam,
        user_class: user.userClass,
        xp_level: currentRank.name,
        auth_status: 'authenticated'
      });
    };

    checkLevelUp();
  }, [user?.xp, user?.id]);

  return (
    <>
      <RouteTracker />
      <AutoSchema />
      <Suspense fallback={<AppShellSkeleton />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* SEO Public Routes - Synchronous for SSG Pre-rendering */}
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
    </>
  );
}

export default App;
