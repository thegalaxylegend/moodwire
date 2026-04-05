import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Shield, Activity, Key, LayoutDashboard, 
  BarChart3, Zap, Globe, FileText, Package, 
  Settings, Search, Mail, Terminal, 
  Layout, Layers, AlertTriangle, 
  ShieldCheck, RefreshCw, Share2, Eye,
  ArrowRight
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, getCountFromServer } from 'firebase/firestore';
import { DashboardSkeleton } from '../../components/admin/AdminSkeletons';

interface ControlItem {
  id: number;
  label: string;
  icon: any;
  category: string;
  status: 'Ready' | 'Service Not Initialized' | 'Restricted';
  description: string;
  dataSource?: string;
  path?: string;
  metric?: string | number;
}

const CONTROL_ITEMS: ControlItem[] = [
  // 1-5: User & Access
  { id: 1, label: "User List", icon: Users, category: "Users", status: 'Ready', description: "Real-time user directory", dataSource: "Firestore: profiles", path: "/admin/users" },
  { id: 2, label: "Roles & Permissions", icon: Shield, category: "Users", status: 'Ready', description: "Manage RBAC mappings", dataSource: "RBAC Module", path: "/admin/users" },
  { id: 3, label: "Activity Logs", icon: Activity, category: "Users", status: 'Ready', description: "User login/action history", dataSource: "audit_logs", path: "/admin/audit-logs" },
  { id: 4, label: "Account Bans", icon: AlertTriangle, category: "Users", status: 'Ready', description: "Blacklist malicious users", dataSource: "profiles: is_banned", path: "/admin/users" },
  
  // 6-10: Analytics
  { id: 6, label: "Dashboard", icon: LayoutDashboard, category: "Analytics", status: 'Ready', description: "System-wide activity heatmaps", dataSource: "Admin Intelligence", path: "/admin/overview" },
  { id: 7, label: "Advanced Charts", icon: BarChart3, category: "Analytics", status: 'Ready', description: "Time-series growth metrics", dataSource: "GA4 Connector", path: "/admin/traffic" },
  { id: 8, label: "Real-time Hub", icon: Zap, category: "Analytics", status: 'Ready', description: "Live session monitoring", dataSource: "Realtime DB", path: "/admin/traffic" },
  { id: 10, label: "Top Pages", icon: Eye, category: "Analytics", status: 'Ready', description: "Best performing articles", dataSource: "Jules Reports", path: "/admin/search" },

  // 11-15: Content
  { id: 11, label: "Blog Manager", icon: FileText, category: "Content", status: 'Ready', description: "Jules AI Content Pipeline", dataSource: "posts/", path: "/admin/jules" },
  { id: 12, label: "Pages Editor", icon: Layout, category: "Content", status: 'Ready', description: "Static page overrides", dataSource: "Syllabus DB", path: "/admin/upload-syllabus" },
  { id: 14, label: "Taxonomy Hub", icon: Search, category: "Content", status: 'Ready', description: "Managing tags & slugs", dataSource: "Jules SEO", path: "/admin/jules" },
  { id: 15, label: "Moderation", icon: AlertTriangle, category: "Content", status: 'Ready', description: "User review filtering", dataSource: "QuestionReview", path: "/admin/question-review" },

  // 21-25: Site / System
  { id: 22, label: "SEO Intelligence", icon: Globe, category: "System", status: 'Ready', description: "Jules Optimization Logs", dataSource: "Jules AI", path: "/admin/search" },
  { id: 40, label: "Error Monitor", icon: Terminal, category: "System", status: 'Ready', description: "Jules Error Log tracking", dataSource: "Jules Reports", path: "/admin/jules" },

  // 26-30: Security
  { id: 26, label: "Login Logs", icon: Terminal, category: "Security", status: 'Ready', description: "Auth attempt auditing", dataSource: "profiles: logins", path: "/admin/users" },
  { id: 41, label: "Audit Trail", icon: Activity, category: "Security", status: 'Ready', description: "Critical change ledger", dataSource: "audit_logs", path: "/admin/audit-logs" },
];

const CATEGORIES = ["All", "Users", "Analytics", "Content", "Security", "System"];

export const SystemControl = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab ] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    users: 0,
    tests: 0,
    questions: 0,
    diagnostics: 0
  });
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchStats = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
        const [userSnap, testSnap, questSnap, diagSnap] = await Promise.all([
            getCountFromServer(collection(db, 'profiles')),
            getCountFromServer(collection(db, 'mock_attempts')),
            getCountFromServer(collection(db, 'engine_questions')),
            getCountFromServer(collection(db, 'diagnostic_results'))
        ]);

        setStats({
            users: userSnap.data().count,
            tests: testSnap.data().count,
            questions: questSnap.data().count,
            diagnostics: diagSnap.data().count
        });
        console.log("[SystemControl] 📡 Stats synchronized successfully.");
    } catch (err: any) {
        console.error("[SystemControl] Failed to fetch system stats:", err);
        setError(err.message || "Unauthorized: Check Admin Permissions");
    } finally {
        setIsLoading(false);
        setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const filteredItems = useMemo(() => {
    return CONTROL_ITEMS.filter(item => {
      const matchesSearch = item.label.toLowerCase().includes(search.toLowerCase()) || 
                           item.description.toLowerCase().includes(search.toLowerCase());
      const matchesTab = activeTab === "All" || item.category === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [search, activeTab]);

  if (isLoading) {
      return (
          <div className="space-y-10 pb-20 p-4 animate-fade-in">
              <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                   <div className="w-48 h-10 bg-white/5 rounded-2xl animate-pulse" />
                   <div className="w-64 h-4 bg-white/5 rounded-lg animate-pulse mt-4" />
                </div>
              </header>
              <DashboardSkeleton />
          </div>
      );
  }

  return (
    <div className="space-y-10 pb-20 p-2 md:p-0">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
              <Settings size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-400/80">Core Intelligence Hub</span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-text-main tracking-tight">
                System <span className="text-red-500">Control</span>
            </h1>
            <button 
                onClick={fetchStats}
                disabled={isRefreshing}
                className={`p-2 rounded-xl bg-surface border border-white/5 text-text-muted hover:text-red-500 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                title="Refresh System Data"
            >
                <RefreshCw size={20} />
            </button>
          </div>
          <p className="text-text-muted text-sm mt-1 max-w-xl">
            Unifying <span className="text-white font-bold">{CONTROL_ITEMS.length}</span> data-driven subsystems into a central command center.
          </p>
        </div>

        <div className="relative group w-full lg:w-96">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-red-400 transition-colors">
                <Search size={18} />
            </div>
            <input 
                type="text" 
                placeholder="Search subsystems (e.g. 'users')..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
            />
        </div>
      </header>

      {/* Real Data Configuration Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="glass-card p-6 border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-blue-400" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">General Metrics (Live)</h2>
                  </div>
                  {error ? (
                    <div className="flex items-center gap-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-500 font-bold animate-pulse">
                        <AlertTriangle size={12} />
                        CONNECTION ERROR
                    </div>
                  ) : (
                    <span className="text-[10px] text-text-muted font-mono uppercase">Last Synced: Just now</span>
                  )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Total Users</p>
                      <p className="text-xl font-black text-text-main">{stats.users.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Test Attempts</p>
                      <p className="text-xl font-black text-blue-400">{stats.tests.toLocaleString()}</p>
                  </div>
              </div>
          </section>

          <section className="glass-card p-6 border-white/5 space-y-6">
              <div className="flex items-center gap-3">
                  <Terminal size={18} className="text-purple-400" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">Engine Status (Live)</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[10px] text-text-muted uppercase font-bold mb-1">AI Questions</p>
                      <p className="text-xl font-black text-purple-400">{stats.questions.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Diagnostics</p>
                      <p className="text-xl font-black text-green-400">{stats.diagnostics.toLocaleString()}</p>
                  </div>
              </div>
          </section>
      </div>

      {/* Categories */}
      <nav className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`
                    px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all
                    ${activeTab === cat 
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                        : 'bg-surface border border-white/5 text-text-muted hover:text-white hover:border-white/20'}
                `}
              >
                  {cat}
              </button>
          ))}
      </nav>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
                <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={item.id}
                    onClick={() => item.path && navigate(item.path)}
                    className={`
                      p-6 glass-card border-white/5 hover:border-red-500/30 transition-all group relative overflow-hidden flex flex-col justify-between
                      ${item.path ? 'cursor-pointer active:scale-95' : 'opacity-60'}
                    `}
                >
                    {item.status === 'Ready' && (
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-500/5 blur-3xl group-hover:bg-red-500/20 transition-all rounded-full" />
                    )}

                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${
                                item.status === 'Ready' ? 'bg-red-500/10 text-red-400' : 
                                item.status === 'Restricted' ? 'bg-zinc-800 text-zinc-500' : 'bg-white/5 text-zinc-600'
                            }`}>
                                <item.icon size={22} />
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                item.status === 'Ready' ? 'bg-green-500/10 text-green-400' : 
                                item.status === 'Restricted' ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-text-muted'
                            }`}>
                                {item.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-text-main group-hover:text-red-400 transition-colors uppercase tracking-tight text-sm">
                                {item.label}
                            </h3>
                            {item.metric && (
                                <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                                    {item.metric}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-text-muted mt-2 line-clamp-2 leading-relaxed">
                            {item.description}
                        </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-text-muted italic font-mono truncate max-w-[120px]">
                            {item.dataSource || 'No Data Connection'}
                        </span>
                        {item.path && (
                          <div className="flex items-center gap-1 group-hover:gap-2 transition-all text-red-500">
                               <ArrowRight size={14} />
                          </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {filteredItems.length === 0 && (
          <div className="py-24 text-center space-y-6">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted">
                  <Search size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-main">No subsystems found</h3>
              <button 
                onClick={() => { setSearch(""); setActiveTab("All"); }}
                className="px-6 py-2 bg-surface border border-white/10 rounded-xl text-sm font-bold text-text-main hover:border-red-500/50 transition-all font-sans"
              >
                  Reset Dashboard
              </button>
          </div>
      )}
    </div>
  );
};

