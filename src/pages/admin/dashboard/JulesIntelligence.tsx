import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Target, 
  History, 
  Zap, 
  Database,
  Cpu,
  Sparkles
} from 'lucide-react';
import { StatCard } from '../../../components/admin/StatCard';

import { db } from '../../../lib/firebase';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';

interface SyllabusStats {
  overall: { completed: number; total: number; percentage: number };
  bySubject: Record<string, { completed: number; total: number; percentage: number }>;
}

export const JulesIntelligence = () => {
  const [syllabusData, setSyllabusData] = useState<SyllabusStats | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qStats, setQStats] = useState({
      total: 0,
      difficulty: { Easy: 0, Medium: 0, Hard: 0 }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [syllabusRes, logsRes, totalQ, easyQ, medQ, hardQ] = await Promise.all([
          fetch('/jules-reports/syllabus-completion.json'),
          fetch('/jules-reports/seo-optimization-log.json'),
          getCountFromServer(collection(db, 'engine_questions')),
          getCountFromServer(query(collection(db, 'engine_questions'), where('difficulty', '==', 'Easy'))),
          getCountFromServer(query(collection(db, 'engine_questions'), where('difficulty', '==', 'Medium'))),
          getCountFromServer(query(collection(db, 'engine_questions'), where('difficulty', '==', 'Hard')))
        ]);

        if (syllabusRes.ok) setSyllabusData(await syllabusRes.json());
        if (logsRes.ok) setLogs(await logsRes.json() || []);
        
        setQStats({
            total: (totalQ as any).data().count,
            difficulty: {
                Easy: (easyQ as any).data().count,
                Medium: (medQ as any).data().count,
                Hard: (hardQ as any).data().count
            }
        });
      } catch (err) {
        console.error("Failed to load Jules intelligence data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-text-muted animate-pulse">Initializing Jules Subsystems...</div>;

  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
            <Brain size={24} />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400/80">AI Core Monitor</span>
        </div>
        <h1 className="text-4xl font-heading font-black text-text-main tracking-tight">
          Jules <span className="text-purple-400">Intelligence</span>
        </h1>
      </header>

      {/* AI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          icon={<Cpu className="text-purple-400" />}
          label="Knowledge Maturity"
          value={`${syllabusData?.overall?.percentage || 0}%`}
          trend="syllabus completion"
          color="purple"
        />
        <StatCard 
          icon={<Zap className="text-amber-400" />}
          label="Autonomous Edits"
          value={logs.length.toString()}
          trend="SEO optimizations"
          color="amber"
        />
        <StatCard 
          icon={<Database className="text-cyan-400" />}
          label="Total Blogs"
          value={syllabusData?.overall?.completed.toString() || '0'}
          trend="verified content items"
          color="cyan"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Syllabus Coverage */}
        <section className="glass-card p-8 border-white/5 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-main flex items-center gap-3">
              <Target size={22} className="text-accent" />
              Syllabus Completion
            </h2>
            <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
              <span className="text-xs font-bold text-accent">{syllabusData?.overall?.percentage}%</span>
            </div>
          </div>

          <div className="space-y-6">
            {syllabusData && Object.entries(syllabusData.bySubject).map(([subject, stats]: any) => (
              <div key={subject} className="space-y-2">
                <div className="flex justify-between items-end">
                  <p className="text-sm font-bold text-text-main">{subject}</p>
                  <p className="text-xs text-text-muted">{stats.completed} / {stats.total} topics</p>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-accent to-accent-dim"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Question Bank Distribution */}
        <section className="glass-card p-8 border-white/5 space-y-8">
           <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-main flex items-center gap-3">
              <Cpu size={22} className="text-purple-400" />
              AI Question Meta
            </h2>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{qStats.total} Total</span>
          </div>

          <div className="space-y-6">
              {Object.entries(qStats.difficulty).map(([diff, count]) => (
                  <div key={diff} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-text-muted uppercase tracking-widest">
                          <span>{diff}</span>
                          <span className="text-text-main">{Math.round(count / (qStats.total || 1) * 100)}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                                diff === 'Easy' ? 'bg-green-500' : 
                                diff === 'Medium' ? 'bg-amber-500' : 'bg-red-500'
                            }`} 
                            style={{ width: `${(count / (qStats.total || 1) * 100) || 0}%` }} 
                          />
                      </div>
                  </div>
              ))}
          </div>

          <div className="p-4 bg-purple-500/5 rounded-xl border border-purple-500/10 mt-4">
              <div className="flex items-center gap-3">
                  <Sparkles size={16} className="text-purple-400" />
                  <p className="text-xs text-text-muted">
                      Knowledge base is <strong>{(qStats.difficulty.Hard / (qStats.total || 1) * 100).toFixed(1)}%</strong> high-difficulty content. Target: 15%.
                  </p>
              </div>
          </div>
        </section>

        {/* Audit Log / Recent Activities */}
        <section className="glass-card p-8 border-white/5 h-full overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <History size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-text-main">Autonomous Audit Log</h2>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
             {logs.map((log, i) => (
                 <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/50 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 group-hover:opacity-20 transition-all">
                        <Cpu size={40} className="text-primary" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Sparkles size={14} />
                        </div>
                        <p className="text-xs font-bold text-text-main">SEO Logic Core: Meta Update</p>
                    </div>
                    <p className="text-[10px] text-text-muted truncate mb-2 font-mono">{log.slug}</p>
                    <div className="flex items-center justify-between mt-3">
                         <span className="px-2 py-0.5 bg-primary/10 rounded text-[9px] font-mono text-primary group-hover:bg-primary/20">"{log.query}"</span>
                         <span className="text-[9px] text-text-muted/50 font-mono italic">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                 </div>
             ))}
             {logs.length === 0 && (
                <div className="py-20 text-center space-y-4">
                    <Database className="mx-auto text-text-muted opacity-20" size={48} />
                    <p className="text-text-muted italic text-sm">Waiting for autonomous triggers...</p>
                </div>
             )}
          </div>
        </section>
      </div>
    </div>
  );
};
