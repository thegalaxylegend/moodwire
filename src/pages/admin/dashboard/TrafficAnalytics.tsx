import { useState, useEffect } from 'react';

import { 
  TrendingUp, 
  BarChart3,
  Globe,
  Eye,
  Clock
} from 'lucide-react';
import { StatCard } from '../../../components/admin/StatCard';

export const TrafficAnalytics = () => {
  const [ga4Data, setGa4Data] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/jules-reports/ga4-stats.json');
        if (res.ok) setGa4Data(await res.json());
      } catch (err) {
        console.error("Failed to load GA4 stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-text-muted animate-pulse">Synchronizing GA4 Traffic...</div>;

  const totalDeviceUsers = ga4Data?.devices?.reduce((acc: number, d: any) => acc + d.users, 0) || 1;

  return (
    <div className="space-y-10 pb-20">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
            <Globe size={24} />
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400/80">Real-Time Traffic</span>
        </div>
        <h1 className="text-4xl font-heading font-black text-text-main tracking-tight">
          Traffic <span className="text-blue-400">Intelligence</span>
        </h1>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="text-blue-400" />}
          label="Active Users"
          value={ga4Data?.totals?.activeUsers?.toLocaleString() || '0'}
          trend="last 30 days"
          color="blue"
        />
        <StatCard 
          icon={<BarChart3 className="text-cyan-400" />}
          label="Total Sessions"
          value={ga4Data?.totals?.sessions?.toLocaleString() || '0'}
          trend="organic engagement"
          color="cyan"
        />
        <StatCard 
          icon={<Eye className="text-amber-400" />}
          label="Page Views"
          value={ga4Data?.totals?.pageviews?.toLocaleString() || '0'}
          trend="content reach"
          color="amber"
        />
        <StatCard 
          icon={<Clock className="text-green-400" />}
          label="Avg Engagement"
          value={`${Math.round(ga4Data?.totals?.avgEngagementTime || 0)}s`}
          trend="retention deep"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Device Breakdown */}
          <section className="glass-card p-8 border-white/5 space-y-6">
              <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                <Globe size={20} className="text-blue-400" />
                Device Segmentation
              </h3>
              <div className="space-y-6">
                  {ga4Data?.devices?.map((device: any) => (
                      <div key={device.category} className="space-y-2">
                          <div className="flex justify-between text-xs font-bold text-text-muted uppercase tracking-widest">
                              <span>{device.category}</span>
                              <span className="text-text-main">{Math.round(device.users / totalDeviceUsers * 100)}%</span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" 
                                style={{ width: `${(device.users / totalDeviceUsers * 100) || 0}%` }} 
                              />
                          </div>
                      </div>
                  ))}
              </div>
          </section>

          {/* Growth Trend (Mini Summary) */}
          <section className="glass-card p-8 border-white/5 space-y-4">
              <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                <TrendingUp size={20} className="text-primary" />
                30-Day Growth Pulse
              </h3>
              <div className="flex items-end gap-1 h-32 pt-4">
                  {ga4Data?.dailyGrowth?.map((day: any, i: number) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-primary/20 hover:bg-primary/50 transition-all rounded-t-sm"
                        style={{ height: `${(day.users / Math.max(...ga4Data.dailyGrowth.map((d:any)=>d.users)) * 100) || 5}%` }}
                        title={`${day.date}: ${day.users} users`}
                      />
                  ))}
              </div>
              <p className="text-[10px] text-text-muted text-center uppercase font-bold tracking-widest">User Velocity Indicator</p>
          </section>
      </div>

      {/* Top Pages Detailed View */}
      <section className="glass-card p-8 border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
              <TrendingUp size={22} className="text-primary" />
              Most Visited Content
            </h3>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">GA4 Top Entries</span>
          </div>

          <div className="space-y-3">
             {ga4Data?.topPages?.map((page: any, idx: number) => (
                 <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/50 transition-all hover:bg-white/10 group">
                    <div className="flex items-center gap-3 max-w-[70%]">
                        <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-xs font-bold text-text-muted group-hover:text-primary transition-colors">
                            {idx + 1}
                        </div>
                        <span className="text-sm font-medium text-text-main truncate" title={page.path}>{page.path}</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-sm font-black text-primary">{page.views.toLocaleString()}</p>
                            <p className="text-[10px] text-text-muted uppercase font-bold">Views</p>
                        </div>
                    </div>
                 </div>
             ))}
             {(!ga4Data?.topPages || ga4Data.topPages.length === 0) && (
                 <p className="text-center py-10 text-text-muted italic">No traffic data found in current report cycle.</p>
             )}
          </div>
      </section>
    </div>
  );
};

// Re-using Users icon from internal lucide import for cleanliness
import { Users } from 'lucide-react';
