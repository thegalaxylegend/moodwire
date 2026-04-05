import { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  ExternalLink,
  Filter,
  BarChart2,
  MousePointer2,
  Zap,
  RotateCw
} from 'lucide-react';
import { StatCard } from '../../../components/admin/StatCard';
import { StatCardSkeleton } from '../../../components/skeletons/AdminSkeleton';

export const SearchAnalytics = () => {
  const [seoData, setSeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFullTable, setShowFullTable] = useState(false);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/jules-reports/search-intelligence.json');
      if (res.ok) setSeoData(await res.json());
    } catch (err) {
      console.error("Failed to load Search intelligence:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !seoData) return (
    <div className="space-y-10 pb-20 animate-pulse">
        <div className="h-10 w-64 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="h-64 bg-white/5 rounded-3xl" />
            <div className="lg:col-span-2 h-64 bg-white/5 rounded-3xl" />
        </div>
    </div>
  );

  const allPages = seoData ? Object.entries(seoData.pages).map(([url, data]: any) => ({ url, ...data })) : [];
  const filteredPages = allPages
    .filter(p => p.url.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.impressions - a.impressions);

  const displayedPages = showFullTable ? filteredPages : filteredPages.slice(0, 10);
  
  // Calculate aggregate stats for display
  const totalImpressions = allPages.reduce((acc, p) => acc + (p.impressions || 0), 0);
  const totalClicks = allPages.reduce((acc, p) => acc + (p.clicks || 0), 0);
  const avgCtr = allPages.length > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0';

  const opportunities = allPages.filter(p => p.isOpportunity).sort((a, b) => b.impressions - a.impressions).slice(0, 5);

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <Search size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500/80">Google Search Console</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-text-main tracking-tight">
             Search <span className="text-amber-500">Intelligence</span>
          </h1>
        </div>
        <button 
          onClick={() => fetchData(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/10 rounded-xl text-sm font-bold text-text-muted hover:text-white hover:border-primary/50 transition-all active:scale-95 disabled:opacity-50"
        >
          <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
          Fetch Latest
        </button>
      </header>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          icon={<BarChart2 className="text-amber-500" />}
          label="Total Impressions"
          value={totalImpressions.toLocaleString()}
          trend="indexed URL visibility"
          color="amber"
        />
        <StatCard 
          icon={<MousePointer2 className="text-cyan-400" />}
          label="Total Clicks"
          value={totalClicks.toLocaleString()}
          trend="organic traffic inflow"
          color="cyan"
        />
        <StatCard 
          icon={<Zap className="text-green-400" />}
          label="Average CTR"
          value={`${avgCtr}%`}
          trend="search efficiency"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Global Top Keywords */}
          <section className="glass-card p-6 border-white/5 space-y-6">
              <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                <MousePointer2 size={20} className="text-primary" />
                Top Ranking Keywords
              </h3>
              <div className="space-y-3">
                  {seoData?.globalTopKeywords?.map((kw: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                          <span className="text-[10px] font-bold text-text-main truncate max-w-[150px]">{kw.query}</span>
                          <div className="text-right">
                              <p className="text-[10px] font-black text-amber-500">{kw.impressions.toLocaleString()}</p>
                              <p className="text-[8px] text-text-muted uppercase">Impr.</p>
                          </div>
                      </div>
                  ))}
              </div>
          </section>

          {/* SEO Opportunities */}
          <section className="lg:col-span-2 glass-card p-6 border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-400" />
                    High Impression / Low CTR Targets
                </h3>
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Optimization Hits</span>
              </div>
              <div className="space-y-4">
                  {opportunities.map((opp, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border-l-4 border-l-red-500 border-white/5">
                          <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-text-main truncate">{opp.url.split('/').pop()}</span>
                              <span className="text-[10px] text-text-muted italic">Top Query: "{opp.topQueries[0]?.query}"</span>
                          </div>
                          <div className="flex items-center gap-6">
                               <div className="text-right">
                                  <p className="text-sm font-black text-text-main">{opp.impressions.toLocaleString()}</p>
                                  <p className="text-[9px] text-text-muted uppercase">Impressions</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-sm font-black text-red-400">{opp.ctr}%</p>
                                  <p className="text-[9px] text-text-muted uppercase">CTR</p>
                               </div>
                          </div>
                      </div>
                  ))}
                  {opportunities.length === 0 && (
                      <p className="text-center py-10 text-text-muted italic text-xs">All indexed URLs are performing above optimization thresholds.</p>
                  )}
              </div>
          </section>
      </div>

      {/* Detailed URL performance Table */}
      <section className="glass-card p-0 border-white/5 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" />
              Indexed URL Performance
            </h3>
            <div className="relative w-full sm:w-64">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                placeholder="Search specific URLs..."
                className="bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-primary/50 transition-all w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-text-muted uppercase text-[10px] font-bold tracking-[0.2em] border-b border-white/5">
                  <th className="px-6 py-4">URL Slug</th>
                  <th className="px-6 py-4">Impressions</th>
                  <th className="px-6 py-4">Clicks</th>
                  <th className="px-6 py-4">CTR</th>
                  <th className="px-6 py-4">Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayedPages.map((page, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-main truncate max-w-[300px]">
                            {page.url.replace('https://examcompass.pages.dev', '') || '/'}
                        </span>
                        <a href={page.url} target="_blank" className="text-[10px] text-primary/50 hover:text-primary mt-1 flex items-center gap-1">
                            Verify Page <ExternalLink size={8} />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-mono text-text-muted">{page.impressions.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-mono text-cyan-400 font-bold">{page.clicks.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-bold text-green-400">{page.ctr}%</span>
                         <div className="h-1.5 w-12 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400" style={{ width: `${Math.min(100, page.ctr * 10)}%` }} />
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <span className="text-xs font-bold text-text-muted"># {page.position || '--'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPages.length > 10 && (
              <div className="p-4 border-t border-white/5">
                  <button 
                    onClick={() => setShowFullTable(!showFullTable)}
                    className="w-full py-3 text-xs font-bold text-text-muted hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    {showFullTable ? 'Show Less' : `View All ${filteredPages.length} Indexed Results`}
                  </button>
              </div>
          )}
      </section>
    </div>
  );
};
