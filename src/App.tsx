import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { SmoothScroll } from './components/SmoothScroll';
import { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { useUserStore } from './store/userStore';
import { RouteTracker } from './components/RouteTracker';
import { AutoSchema } from './components/seo/AutoSchema';
import { GlobalLoading } from './components/skeletons/GlobalLoading';
import { BlogSkeleton } from './components/skeletons/BlogSkeleton';
import { DashboardSkeleton } from './components/skeletons/DashboardSkeleton';
import { setUserProperties, trackWebVitals, initAnalytics } from './lib/analytics';

// Layouts - Lazy for extreme mobile performance
const ProtectedLayout = lazy(() => import('./layouts/ProtectedLayout').then(module => ({ default: module.ProtectedLayout })));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout').then(module => ({ default: module.DashboardLayout })));
const AdminLayout = lazy(() => import('./layouts/AdminLayout').then(module => ({ default: module.AdminLayout })));

// Public Pages - Synchronous for SSG Pre-rendering
import { LandingPage } from './pages/LandingPage';
import { ExamLanding } from './pages/public/ExamLanding';
import { SubjectPage } from './pages/public/SubjectPage';
import { TopicPage } from './pages/public/TopicPage';
import { PyqCollectionPage } from './pages/public/PyqCollectionPage';
import { QuestionPage } from './pages/public/QuestionPage';
import { BlogIndex } from './pages/blog/BlogIndex';
import { BlogPostPage } from './pages/blog/BlogPostPage';
import { PrivacyPolicy } from './pages/public/PrivacyPolicy';
import { TermsOfService } from './pages/public/TermsOfService';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { NotFoundPage } from './pages/public/NotFoundPage';
import { CookieConsent } from './components/CookieConsent';

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
const AdminOverview = lazy(() => import('./pages/admin/dashboard/AdminOverview').then(module => ({ default: module.AdminOverview })));
const TrafficAnalytics = lazy(() => import('./pages/admin/dashboard/TrafficAnalytics').then(module => ({ default: module.TrafficAnalytics })));
const SearchAnalytics = lazy(() => import('./pages/admin/dashboard/SearchAnalytics').then(module => ({ default: module.SearchAnalytics })));
const JulesIntelligence = lazy(() => import('./pages/admin/dashboard/JulesIntelligence').then(module => ({ default: module.JulesIntelligence })));
const UserManagement = lazy(() => import('./pages/admin/UserManagement').then(module => ({ default: module.UserManagement })));

// Components - Lazy
const Chatbot = lazy(() => import('./components/Chatbot').then(module => ({ default: module.Chatbot })));
const LevelUpModal = lazy(() => import('./components/gamification/LevelUpModal').then(module => ({ default: module.LevelUpModal })));
const PWAInstall = lazy(() => import('./components/PWAInstall').then(module => ({ default: module.PWAInstall })));
// SEO Monitoring
// trackWebVitals and setUserProperties are now imported from src/lib/analytics.ts
const isServer = typeof window === 'undefined';

const DelayedGlobalComponents = () => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    // Defer non-critical UI to prioritize LCP
    const delay = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 1500 : 500;
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, []);

  if (!show || isServer) return null;

  return (
    <>
      <FloatingUI />
      <PWAInstall />
      <CookieConsent />
    </>
  );
};

const FloatingUI = () => {
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const { user } = useUserStore();

  useEffect(() => {
    // Load chatbot with a slight delay
    const loadChatbot = () => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => setMounted(true));
      } else {
        setTimeout(() => setMounted(true), 200);
      }
    };

    const delay = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 1500 : 500;
    const timer = setTimeout(loadChatbot, delay);
    return () => clearTimeout(timer);
  }, []);

  // Only show on main dashboard screens after login
  if (!user || !location.pathname.startsWith('/dashboard')) {
    return null;
  }

  // Hide bubble on specific screens that have their own complex UI or integrated AI
  if (
    location.pathname.includes('/dashboard/lectures/') ||
    location.pathname.includes('/dashboard/mock') ||
    location.pathname.includes('/dashboard/test') ||
    location.pathname.includes('/dashboard/diagnostic')
  ) {
    return null;
  }

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
    initAnalytics();

    // Defer non-critical monitoring
    (window.requestIdleCallback || ((cb) => setTimeout(cb, 1000)))(() => {
      trackWebVitals();
    });

    // Capture registration intent from URL
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const intentClass = searchParams.get('class');
      const intentExam = searchParams.get('exam');
        if (intentClass || intentExam) {
          const intent = {
            class: intentClass,
            exam: intentExam,
            savedAt: Date.now()
          };
          localStorage.setItem('exam_compass_intent', JSON.stringify(intent));
          console.log("📝 [App] Captured registration intent (localStorage):", intent);
        }

      // Capture referral code from URL
      const refCode = searchParams.get('ref');
      if (refCode) {
        const referral = {
            code: refCode,
            savedAt: Date.now()
        };
        localStorage.setItem('referral_code', JSON.stringify(referral));
        console.log("🎁 [Referral] Stored referral code (localStorage):", refCode);
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
        selected_exam: user.targetExam,
        user_class: user.userClass,
        xp_level: currentRank.name,
        auth_status: 'authenticated'
      });
    };

    checkLevelUp();
  }, [user?.xp, user?.id]);

  return (
    <SmoothScroll>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:p-4 focus:bg-primary focus:text-white focus:rounded-xl focus:font-bold outline-none">
        Skip to main content
      </a>
      <RouteTracker />
      <AutoSchema />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Suspense fallback={<GlobalLoading />}><Login /></Suspense>} />

        {/* SEO Public Routes - Synchronous for SSG Pre-rendering */}
        <Route path="/blog" element={<Suspense fallback={<BlogSkeleton />}><BlogIndex /></Suspense>} />
        <Route path="/blog/:slug" element={<Suspense fallback={<BlogSkeleton />}><BlogPostPage /></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={<BlogSkeleton />}><PrivacyPolicy /></Suspense>} />
        <Route path="/terms" element={<Suspense fallback={<BlogSkeleton />}><TermsOfService /></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<BlogSkeleton />}><AboutPage /></Suspense>} />
        <Route path="/contact" element={<Suspense fallback={<BlogSkeleton />}><ContactPage /></Suspense>} />
        <Route path="/:exam" element={<Suspense fallback={<BlogSkeleton />}><ExamLanding /></Suspense>} />
        <Route path="/:exam/:subject" element={<Suspense fallback={<BlogSkeleton />}><SubjectPage /></Suspense>} />
        <Route path="/:exam/:subject/:topic" element={<Suspense fallback={<BlogSkeleton />}><TopicPage /></Suspense>} />
        <Route path="/:exam/:subject/:topic/top-50-pyqs" element={<Suspense fallback={<BlogSkeleton />}><PyqCollectionPage /></Suspense>} />
        <Route path="/:exam/q/:slug" element={<Suspense fallback={<BlogSkeleton />}><QuestionPage /></Suspense>} />

        {/* Protected Routes (Auth + Onboarding Check) */}
        <Route element={<Suspense fallback={<DashboardSkeleton />}><ProtectedLayout /></Suspense>}>
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
        <Route path="/admin" element={<Suspense fallback={<DashboardSkeleton />}><AdminLayout /></Suspense>}>
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="traffic" element={<TrafficAnalytics />} />
          <Route path="search" element={<SearchAnalytics />} />
          <Route path="jules" element={<JulesIntelligence />} />
          <Route path="question-review" element={<QuestionReview />} />
          <Route path="upload-syllabus" element={<SyllabusUpload />} />
          <Route path="users" element={<UserManagement />} />
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>

      <Suspense fallback={null}>
        <DelayedGlobalComponents />
      </Suspense>

      {showLevelUp && !isServer && (
        <Suspense fallback={null}>
          <LevelUpModal
            newXp={levelUpXp}
            onClose={() => setShowLevelUp(false)}
          />
        </Suspense>
      )}
    </SmoothScroll>
  );
}

export default App;
