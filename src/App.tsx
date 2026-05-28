import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { SmoothScroll } from './components/SmoothScroll';
import { ParallaxBackground } from './components/ParallaxBackground';
import { PerformanceProvider, usePerformance } from './context/PerformanceProvider';
import { BadgeStyleProvider } from './context/BadgeStyleProvider';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useUserStore } from './store/userStore';
import { RouteTracker } from './components/RouteTracker';
import { AutoSchema } from './components/seo/AutoSchema';
import { GlobalLoading } from './components/skeletons/GlobalLoading';
import { BlogSkeleton } from './components/skeletons/BlogSkeleton';
import { DashboardSkeleton } from './components/skeletons/DashboardSkeleton';
import {
  ArenaSkeleton,
  TestCenterSkeleton,
  StudyPlanSkeleton,
  BenchmarkingSkeleton,
  DecisionSimulatorSkeleton,
  SyllabusSkeleton,
  SavedLecturesSkeleton,
  TimelineSkeleton,
  NotesSkeleton,
  AnalyticsSkeleton,
} from './components/skeletons/PageSkeletons';
import { trackWebVitals, initAnalytics } from './lib/analytics';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CookieConsent } from './components/CookieConsent';
import { useTestMode } from './hooks/useTestMode';

// Layouts
const ProtectedLayout = lazy(() => import('./layouts/ProtectedLayout').then(module => ({ default: module.ProtectedLayout })));
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout').then(module => ({ default: module.DashboardLayout })));
const AdminLayout = lazy(() => import('./layouts/AdminLayout').then(module => ({ default: module.AdminLayout })));

// Public Pages
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
import FounderPage from './pages/public/FounderPage';
import { ParentReport } from './pages/public/ParentReport';
import { DownloadPage } from './pages/public/DownloadPage';
import { NotFoundPage } from './pages/public/NotFoundPage';

// Auth
const Login = lazy(() => import('./pages/auth/Login').then(module => ({ default: module.Login })));

// Dashboard Routes
const Overview = lazy(() => import('./pages/dashboard/Overview').then(module => ({ default: module.Overview })));
const Syllabus = lazy(() => import('./pages/dashboard/Syllabus').then(module => ({ default: module.Syllabus })));
const Timeline = lazy(() => import('./pages/dashboard/Timeline').then(module => ({ default: module.Timeline })));
const Notes = lazy(() => import('./pages/dashboard/Notes').then(module => ({ default: module.Notes })));
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
const ConceptMap = lazy(() => import('./pages/dashboard/ConceptMap').then(module => ({ default: module.ConceptMap })));
const Arena = lazy(() => import('./pages/dashboard/Arena').then(module => ({ default: module.Arena })));
const GroupBattle = lazy(() => import('./pages/dashboard/GroupBattle').then(module => ({ default: module.GroupBattle })));

// Admin Routes
const QuestionReview = lazy(() => import('./pages/admin/QuestionReview').then(module => ({ default: module.QuestionReview })));
const SyllabusUpload = lazy(() => import('./pages/admin/SyllabusUpload').then(module => ({ default: module.SyllabusUpload })));
const AdminOverview = lazy(() => import('./pages/admin/dashboard/AdminOverview').then(module => ({ default: module.AdminOverview })));
const TrafficAnalytics = lazy(() => import('./pages/admin/dashboard/TrafficAnalytics').then(module => ({ default: module.TrafficAnalytics })));
const SearchAnalytics = lazy(() => import('./pages/admin/dashboard/SearchAnalytics').then(module => ({ default: module.SearchAnalytics })));
const JulesIntelligence = lazy(() => import('./pages/admin/dashboard/JulesIntelligence').then(module => ({ default: module.JulesIntelligence })));
const UserManagement = lazy(() => import('./pages/admin/UserManagement').then(module => ({ default: module.UserManagement })));
const SystemControl = lazy(() => import('./pages/admin/SystemControl').then(module => ({ default: module.SystemControl })));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs').then(module => ({ default: module.AuditLogs })));

// Components
const Chatbot = lazy(() => import('./components/Chatbot').then(module => ({ default: module.Chatbot })));
const LevelUpModal = lazy(() => import('./components/gamification/LevelUpModal').then(module => ({ default: module.LevelUpModal })));
const PWAInstall = lazy(() => import('./components/PWAInstall').then(module => ({ default: module.PWAInstall })));

const isServer = typeof window === 'undefined' || (typeof window !== 'undefined' && (window as any).__PRERENDER__);

const DelayedGlobalComponents = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
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
  const isTestMode = useTestMode();
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 500);
    return () => clearTimeout(timer);
  }, []);
  // Suppress chatbot during active exams to prevent distraction & cheating
  // Also suppress on video lectures as it has its own integrated AI interface
  const isVideoPage = location.pathname.startsWith('/dashboard/lectures/');
  if (!user || !location.pathname.startsWith('/dashboard') || !mounted || isTestMode || isVideoPage) return null;
  return (
    <Suspense fallback={null}>
      <Chatbot />
    </Suspense>
  );
};

const RootRoute = () => {
    const { isAuthenticated, isLoading, user, authResolved } = useUserStore();
    const isServer = typeof window === 'undefined' || (typeof window !== 'undefined' && (window as any).__PRERENDER__);
    
    // Show loading spinner until auth state is resolved
    if (!isServer && (!authResolved || isLoading)) {
      return <GlobalLoading />;
    }
    
    // If authenticated and not a guest, navigate to dashboard
    if (!isServer && isAuthenticated && user && !user.isGuest) {
      return <Navigate to="/dashboard" replace />;
    }
    
    // Otherwise show landing page (including when logged out)
    return <LandingPage />;
};

function AppContent() {
  const { initialize } = useUserStore();
  const { tier } = usePerformance();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpXp] = useState(0);

  useEffect(() => {
    initialize();
    initAnalytics();
    (window.requestIdleCallback || ((cb) => setTimeout(cb, 1000)))(() => {
      trackWebVitals();
    });

    // Handle Capacitor Android Hardware Back Button
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      import('@capacitor/app').then(({ App: CapApp }) => {
        CapApp.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            CapApp.exitApp();
          }
        });
      });
    }
  }, []);

  return (
    <SmoothScroll>
      <div className={`perf-tier-${tier} min-h-screen relative`}>
        <ParallaxBackground />
        
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:p-4 focus:bg-primary focus:text-white focus:rounded-xl focus:font-bold outline-none">
          Skip to main content
        </a>
        <RouteTracker />
        <AutoSchema />
        
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Suspense fallback={<GlobalLoading />}><RootRoute /></Suspense>} />
            <Route path="/login" element={<Suspense fallback={<GlobalLoading />}><Login /></Suspense>} />
            <Route path="/blog" element={<Suspense fallback={<BlogSkeleton />}><BlogIndex /></Suspense>} />
            <Route path="/blog/:slug" element={<Suspense fallback={<BlogSkeleton />}><BlogPostPage /></Suspense>} />
            <Route path="/practice/*" element={<Navigate to="/dashboard/mock" replace />} />
            <Route path="/privacy" element={<Suspense fallback={<BlogSkeleton />}><PrivacyPolicy /></Suspense>} />
            <Route path="/terms" element={<Suspense fallback={<BlogSkeleton />}><TermsOfService /></Suspense>} />
            <Route path="/about" element={<Suspense fallback={<BlogSkeleton />}><AboutPage /></Suspense>} />
            <Route path="/founder" element={<Suspense fallback={<BlogSkeleton />}><FounderPage /></Suspense>} />
            <Route path="/contact" element={<Suspense fallback={<BlogSkeleton />}><ContactPage /></Suspense>} />
            <Route path="/report/:userId" element={<Suspense fallback={<BlogSkeleton />}><ParentReport /></Suspense>} />
            <Route path="/download" element={<Suspense fallback={<BlogSkeleton />}><DownloadPage /></Suspense>} />

            <Route element={<Suspense fallback={<DashboardSkeleton />}><ProtectedLayout /></Suspense>}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard/lectures/:topicId" element={<VideoLecturePage />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Overview />} />
                <Route path="diagnostic" element={<DiagnosticTest />} />
                <Route path="mock" element={<MockGenerator />} />
                <Route path="mock-test" element={<Navigate to="/dashboard/mock" replace />} />
                <Route path="study-plan" element={<Suspense fallback={<StudyPlanSkeleton />}><StudyPlan /></Suspense>} />
                <Route path="lectures" element={<Lectures />} />
                <Route path="peer-benchmarking" element={<Suspense fallback={<BenchmarkingSkeleton />}><PeerBenchmarking /></Suspense>} />
                <Route path="decision-simulator" element={<Suspense fallback={<DecisionSimulatorSkeleton />}><DecisionSimulator /></Suspense>} />
                <Route path="syllabus" element={<Suspense fallback={<SyllabusSkeleton />}><Syllabus /></Suspense>} />
                <Route path="syllabus/:subject" element={<Suspense fallback={<SyllabusSkeleton />}><SubjectSyllabus /></Suspense>} />
                <Route path="saved-lectures" element={<Suspense fallback={<SavedLecturesSkeleton />}><SavedLectures /></Suspense>} />
                <Route path="timeline" element={<Suspense fallback={<TimelineSkeleton />}><Timeline /></Suspense>} />
                <Route path="notes" element={<Suspense fallback={<NotesSkeleton />}><Notes /></Suspense>} />
                <Route path="analytics" element={<Suspense fallback={<AnalyticsSkeleton />}><Analytics /></Suspense>} />
                <Route path="resources" element={<Resources />} />
                <Route path="test-center" element={<Suspense fallback={<TestCenterSkeleton />}><TestCenter /></Suspense>} />
                <Route path="test-active" element={<ActiveTest />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="ranks" element={<RankInfo />} />
                <Route path="concept-map" element={<ConceptMap />} />
                <Route path="arena" element={<Suspense fallback={<ArenaSkeleton />}><Arena /></Suspense>} />
                <Route path="arena/group" element={<GroupBattle />} />
                <Route path="arena/group/:sessionId" element={<GroupBattle />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>

            <Route path="/admin" element={<Suspense fallback={<DashboardSkeleton />}><AdminLayout /></Suspense>}>
              <Route index element={<Navigate to="/admin/overview" replace />} />
              <Route path="overview" element={<AdminOverview />} />
              <Route path="traffic" element={<TrafficAnalytics />} />
              <Route path="search" element={<SearchAnalytics />} />
              <Route path="jules" element={<JulesIntelligence />} />
              <Route path="question-review" element={<QuestionReview />} />
              <Route path="upload-syllabus" element={<SyllabusUpload />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="audit-logs" element={<Suspense fallback={<DashboardSkeleton />}><AuditLogs /></Suspense>} />
              <Route path="system" element={<SystemControl />} />
            </Route>

            <Route path="/:exam" element={<Suspense fallback={<BlogSkeleton />}><ExamLanding /></Suspense>} />
            <Route path="/:exam/:subject" element={<Suspense fallback={<BlogSkeleton />}><SubjectPage /></Suspense>} />
            <Route path="/:exam/:subject/:topic" element={<Suspense fallback={<BlogSkeleton />}><TopicPage /></Suspense>} />
            <Route path="/:exam/:subject/:topic/top-50-pyqs" element={<Suspense fallback={<BlogSkeleton />}><PyqCollectionPage /></Suspense>} />
            <Route path="/:exam/q/:slug" element={<Suspense fallback={<BlogSkeleton />}><QuestionPage /></Suspense>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>

        <Suspense fallback={null}><DelayedGlobalComponents /></Suspense>
        
        {showLevelUp && !isServer && (
          <Suspense fallback={null}>
            <LevelUpModal newXp={levelUpXp} onClose={() => setShowLevelUp(false)} />
          </Suspense>
        )}
      </div>
    </SmoothScroll>
  );
}

function App() {
  return (
    <PerformanceProvider>
      <BadgeStyleProvider>
        <AppContent />
      </BadgeStyleProvider>
    </PerformanceProvider>
  );
}

export default App;
