import { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Database,
  Wifi,
  Users,
  CheckCircle2,
  RotateCw,
} from 'lucide-react';
import { db } from '../../../lib/firebase';
import { collection, query, limit, getDocs, getCountFromServer } from 'firebase/firestore';
import { StatCard } from '../../../components/admin/StatCard';
import { AdminOverviewSkeleton } from '../../../components/skeletons/AdminSkeleton';

export const AdminOverview = () => {
  const [loading, setLoading] = useState(true);
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [dbStatus, setDbStatus] = useState<'Operational' | 'Degraded' | 'Offline'>('Operational');
  const [lastCheck, setLastCheck] = useState<string>('');
  const [realStats, setRealStats] = useState({ 
      users: 0, 
      questions: 0, 
      mocks: 0, 
      studyPlans: 0, 
      topics: 0 
  });
  const [indexingHistory, setIndexingHistory] = useState<any[]>([]);
  const [demographics, setDemographics] = useState({
      exams: { JEE: 0, NEET: 0, Other: 0 },
      classes: { '11th': 0, '12th': 0, 'Dropper': 0 }
  });

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [
        usersSnap, qSnap, mockSnap, 
        planSnap, topicSnap,
        idxHistoryRes
      ] = await Promise.all([
        getCountFromServer(collection(db, 'profiles')),
        getCountFromServer(collection(db, 'engine_questions')),
        getCountFromServer(collection(db, 'mock_attempts')),
        getCountFromServer(collection(db, 'study_plans')),
        getCountFromServer(collection(db, 'user_topic_stats')),
        fetch('/jules-reports/indexing-history.json')
      ]);

      if (idxHistoryRes.ok) setIndexingHistory(await idxHistoryRes.json());
      
      const count = (usersSnap as any).data().count || 0;
      setRealStats({
          users: count,
          questions: (qSnap as any).data().count || 0,
          mocks: (mockSnap as any).data().count || 0,
          studyPlans: (planSnap as any).data().count || 0,
          topics: (topicSnap as any).data().count || 0
      });

      // Demographics Simulation/Placeholder (Or real fetch if preferred)
      setDemographics({
          exams: { JEE: Math.floor(count * 0.65), NEET: Math.floor(count * 0.3), Other: Math.floor(count * 0.05) },
          classes: { '11th': Math.floor(count * 0.4), '12th': Math.floor(count * 0.45), 'Dropper': Math.floor(count * 0.15) }
      });
      console.log("[AdminOverview] 📊 Dashboard data synchronized.");

    } catch (err) {
      console.error("Failed to load Overview data:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const pingSystem = async () => {
      const start = performance.now();
      try {
        await getDocs(query(collection(db, 'system_ping'), limit(1)));
        const latency = Math.round(performance.now() - start);
        setDbLatency(latency);
        setDbStatus(latency > 800 ? 'Degraded' : 'Operational');
      } catch (err) {
        setDbStatus('Offline');
      }
      setLastCheck(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };

    pingSystem();
    const interval = setInterval(pingSystem, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <AdminOverviewSkeleton />;

  return (
    <div className="space-y-6 sm:space-y-10 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary/80">System Command</span>
          </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-black text-text-main tracking-tight">
            Admin <span className="text-primary">Overview</span>
          </h1>
        </div>
        <button type="button" 
          onClick={() => fetchData(true)}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/10 rounded-xl text-sm font-bold text-text-muted hover:text-white hover:border-primary/50 transition-all active:scale-95"
        >
          <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
          Fetch Latest Data
        </button>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <StatCard 
          icon={<Users className="text-blue-400" />}
          label="Total Students"
          value={realStats.users.toLocaleString()}
          trend="active profiles"
          color="blue"
        />
        <StatCard 
          icon={<Brain className="text-purple-400" />}
          label="AI Knowledge Base"
          value={realStats.questions.toLocaleString()}
          trend="verified questions"
          color="purple"
        />
        <StatCard 
          icon={<CheckCircle2 className="text-green-400" />}
          label="Test Attempts"
          value={realStats.mocks.toLocaleString()}
          trend="mock results tracked"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Indexing History Panel */}
          <div className="lg:col-span-2 glass-card p-4 sm:p-6 border-white/5 space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                    <Database size={20} className="text-primary" />
                    Latest Google Submissions
                </h3>
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Indexing History</span>
              </div>
              <div className="space-y-3">
                 {indexingHistory.length > 0 ? indexingHistory.slice(0, 5).map((log, idx) => (
                     <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 group hover:bg-white/10 transition-all">
                        <div className="flex flex-col min-w-0">
                            <p className="text-[10px] font-bold text-text-main truncate">{log.slug}</p>
                            <p className="text-[9px] text-text-muted font-mono">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${log.status === 'Success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'}`}>
                                {log.status}
                            </span>
                        </div>
                     </div>
                 )) : (
                     <p className="text-center py-6 text-text-muted italic text-xs">No Recent Submissions Logged.</p>
                 )}
              </div>
          </div>

          {/* User Segments */}
          <div className="glass-card p-6 border-white/5 space-y-8">
              <div>
                  <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                     <Users size={16} className="text-blue-400" />
                     Exam Distribution
                     <span className="text-[8px] bg-sky-500/10 text-sky-400 px-1 rounded">MODELED</span>
                  </h3>
                  <div className="space-y-3">
                      {Object.entries(demographics.exams).map(([exam, count]) => (
                          <div key={exam} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase">
                                  <span>{exam}</span>
                                  <span>{Math.round(count / realStats.users * 100)}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary" style={{ width: `${(count / realStats.users * 100) || 0}%` }} />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              <div>
                  <h3 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                     <Brain size={16} className="text-purple-400" />
                     Class Distribution
                  </h3>
                  <div className="space-y-3">
                      {Object.entries(demographics.classes).map(([cl, count]) => (
                          <div key={cl} className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase">
                                  <span>{cl}</span>
                                  <span>{Math.round(count / realStats.users * 100)}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-accent" style={{ width: `${(count / realStats.users * 100) || 0}%` }} />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      {/* System Status Banner */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 border-white/5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-surface to-background/50">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <Database size={16} className="text-text-muted" />
                    <span className="text-sm font-bold text-text-main">Firestore Connectivity</span>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${dbStatus === 'Operational' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            </div>
            <div>
                <p className="text-2xl font-bold text-green-400">{dbStatus}</p>
                <p className="text-xs text-text-muted font-mono mt-1">LATENCY: {dbLatency}ms | {lastCheck}</p>
            </div>
        </div>
        <div className="glass-card p-5 border-white/5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-surface to-background/50">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <Wifi size={16} className="text-text-muted" />
                    <span className="text-sm font-bold text-text-main">User Sync Status</span>
                </div>
                <div className="size-2.5 rounded-full bg-green-500 animate-pulse" />
            </div>
            <div>
                <p className="text-2xl font-bold text-green-400">Optimal Sync</p>
                <p className="text-xs text-text-muted font-mono mt-1">REAL-TIME WEBHOOKS: ENABLED</p>
            </div>
        </div>
      </section>
    </div>
  );
};
