import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { clanService, type Clan } from '../../services/clanService';
import { Users, Shield, Zap, Search, Plus, Trophy, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Clans = () => {
    const { user } = useUserStore();
    const [topClans, setTopClans] = useState<Clan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newClan, setNewClan] = useState({ name: '', slogan: '' });

    useEffect(() => {
        fetchClans();
    }, []);

    const fetchClans = async () => {
        setLoading(true);
        try {
            const clans = await clanService.getTopClans();
            setTopClans(clans);
        } catch (e) {
            console.error("Failed to fetch clans", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClan = async () => {
        if (!user || !newClan.name || !newClan.slogan) return;
        try {
            await clanService.createClan(user.id, newClan.name, newClan.slogan);
            setIsCreating(false);
            fetchClans();
            alert("Clan created successfully!");
        } catch (e) {
            alert("Failed to create clan. Try a different name.");
        }
    };

    const handleJoinClan = async (id: string) => {
        if (!user) return;
        try {
            await clanService.joinClan(user.id, id);
            fetchClans();
            alert("Welcome to the Clan!");
        } catch (e) {
            alert("Failed to join. Is it full?");
        }
    };

    const currentClan = topClans.find(c => c.id === user?.clanId);

    return (
        <div className="space-y-8 min-h-screen pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-5xl font-black text-text-main tracking-tighter uppercase italic">Study Clans</h1>
                    <p className="text-text-muted font-medium">Join forces. Dominate the global leaderboard. Achieve world-class mastery together.</p>
                </div>
                {!user?.clanId && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="px-8 py-3 rounded-2xl bg-primary text-white font-black uppercase tracking-widest hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Found New Clan
                    </button>
                )}
            </header>

            {currentClan && (
                <section className="glass-card premium-border p-8 bg-gradient-to-br from-[#12141d] to-primary/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                        <Shield size={240} />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                        <div className="w-24 h-24 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                            <Shield className="text-primary" size={48} />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-3xl font-black text-text-main uppercase tracking-tight">{currentClan.name}</h2>
                            <p className="text-primary italic font-bold">"{currentClan.slogan}"</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                                    <Users size={16} className="text-blue-400" />
                                    <span className="text-sm font-bold">{currentClan.memberCount} Squad Members</span>
                                </div>
                                <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2">
                                    <Zap size={16} className="text-yellow-400" />
                                    <span className="text-sm font-bold">{currentClan.powerScore.toLocaleString()} Total Power</span>
                                </div>
                            </div>
                        </div>
                        <button className="px-6 py-3 rounded-xl border border-white/10 text-text-muted hover:bg-white/5 font-bold transition-all">
                            Manage Squad
                        </button>
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
                            <Trophy className="text-yellow-500" size={24} />
                            Global Power Rankings
                        </h3>
                        <div className="relative w-64 hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search clans..."
                                className="w-full bg-surface border border-border rounded-xl py-2 pl-10 pr-4 text-sm focus:border-primary outline-none transition-all"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <Loader2 className="animate-spin text-primary" size={48} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {topClans.map((clan, idx) => (
                                <motion.div
                                    key={clan.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`p-6 glass-card premium-border oxygen-card flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-white/5 transition-all group ${user?.clanId === clan.id ? 'border-primary/50 bg-primary/5' : ''}`}
                                >
                                    <div className="flex items-center gap-6 text-center md:text-left">
                                        <div className="text-2xl font-black text-text-muted italic w-8">#{idx + 1}</div>
                                        <div>
                                            <h4 className="text-lg font-black text-text-main group-hover:text-primary transition-colors">{clan.name}</h4>
                                            <p className="text-xs text-text-muted italic">"{clan.slogan}"</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-8">
                                        <div className="text-center">
                                            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Power Score</div>
                                            <div className="text-xl font-black text-primary">{clan.powerScore.toLocaleString()}</div>
                                        </div>
                                        <div className="h-8 w-px bg-border hidden md:block" />
                                        <div className="text-center">
                                            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Members</div>
                                            <div className="text-lg font-bold text-text-main">{clan.memberCount}/50</div>
                                        </div>
                                        {!user?.clanId ? (
                                            <button 
                                                onClick={() => handleJoinClan(clan.id!)}
                                                className="px-6 py-2 rounded-xl bg-white/10 hover:bg-primary text-white font-black uppercase text-xs tracking-widest transition-all active:scale-95"
                                            >
                                                Join
                                            </button>
                                        ) : user.clanId === clan.id ? (
                                            <div className="px-4 py-2 rounded-lg bg-primary/20 text-primary text-[10px] font-black uppercase border border-primary/20">Active</div>
                                        ) : null}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="glass-card premium-border p-6 bg-accent/5">
                        <h4 className="text-lg font-black text-accent uppercase tracking-tighter mb-4">Why Join a Clan?</h4>
                        <ul className="space-y-4">
                            {[
                                { title: 'Shared Excellence', desc: 'Aggregate XP gain to dominate global leaderboards.', icon: Zap },
                                { title: 'Collaborative Study', desc: 'Access private chat and peer motivation.', icon: Users },
                                { title: 'Clan Perks', desc: 'Unlock exclusive badges and seasonal rewards.', icon: Trophy }
                            ].map((perk, i) => (
                                <li key={i} className="flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0">
                                        <perk.icon className="text-accent" size={16} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-text-main">{perk.title}</p>
                                        <p className="text-xs text-text-muted">{perk.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="glass-card premium-border p-6 space-y-4">
                        <h4 className="text-sm font-black text-text-muted uppercase tracking-widest">Regional Activity</h4>
                        <div className="space-y-3">
                            {['IIT Aspirants Delhi', 'Madras Medics', 'JEE Warriors'].map(regional => (
                                <div key={regional} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                                    <span className="text-text-main font-medium">{regional}</span>
                                    <ArrowRight size={14} className="text-primary" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isCreating && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-surface border border-primary/20 p-8 rounded-3xl max-w-md w-full shadow-2xl relative"
                        >
                            <h2 className="text-2xl font-black text-text-main uppercase tracking-tight mb-6">Found New Clan</h2>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-muted uppercase">Clan Name</label>
                                    <input 
                                        type="text" 
                                        value={newClan.name}
                                        onChange={e => setNewClan(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-background border border-border rounded-xl p-3 outline-none focus:border-primary transition-all font-bold"
                                        placeholder="e.g. Apex Predators"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-muted uppercase">Slogan</label>
                                    <input 
                                        type="text" 
                                        value={newClan.slogan}
                                        onChange={e => setNewClan(prev => ({ ...prev, slogan: e.target.value }))}
                                        className="w-full bg-background border border-border rounded-xl p-3 outline-none focus:border-primary transition-all"
                                        placeholder="e.g. Hard Work Above All"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <button 
                                        onClick={() => setIsCreating(false)}
                                        className="py-3 rounded-xl border border-border text-text-muted font-bold hover:bg-white/5 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleCreateClan}
                                        className="py-3 rounded-xl bg-primary text-white font-black uppercase tracking-widest hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                                    >
                                        Establish
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
