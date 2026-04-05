import { useState, useEffect, useMemo } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, limit, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Users, Search, Shield, ShieldCheck, Clock, Crown, TrendingUp, Key, RotateCw, Terminal, UserMinus, UserCheck } from 'lucide-react';
import { StatCardSkeleton, TableRowSkeleton } from '../../components/skeletons/AdminSkeleton';
import type { User } from '../../store/userStore';

import { useUserStore } from '../../store/userStore';

interface AdminUserView extends User {
    last_login_date?: string;
    is_premium?: boolean;
    display_name?: string;
    displayName?: string;
    userEmail?: string;
    is_banned?: boolean;
}

export const UserManagement = () => {
    const [users, setUsers] = useState<AdminUserView[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ totalActive: 0, totalPremium: 0, totalBanned: 0, avgXp: 0 });
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
    const { user: currentUser } = useUserStore();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        console.log(`[UserManagement] 🛡️ Fetching users as ${currentUser?.email} (${currentUser?.role})`);
        
        try {
            let snap;
            try {
                // Fetch up to 1000 users. Using a simple query first to avoid index requirements.
                const qBody = query(collection(db, 'profiles'), limit(1000));
                snap = await getDocs(qBody);
                console.log(`[UserManagement] Primary fetch success. Found ${snap.docs.length} users.`);
            } catch (queryErr: any) {
                console.warn(`[UserManagement] Primary fetch ERROR (Code: ${queryErr.code}). Falling back.`);
                const qBody = query(collection(db, 'profiles'), limit(100));
                snap = await getDocs(qBody);
                console.log(`[UserManagement] Fallback fetch success. Found ${snap.docs.length} users.`);
            }

            if (snap.empty) {
                console.warn("[UserManagement] No documents returned from 'profiles' collection.");
            }

            const loadedUsers = snap.docs.map(doc => {
                const data = doc.data();
                if (snap.docs.indexOf(doc) < 3) {
                    console.log(`[UserManagement] 🔍 Diagnostic Probe (ID: ${doc.id}):`, Object.keys(data));
                }
                return { id: doc.id, ...data } as any;
            });
            setUsers(loadedUsers);
            
            // Calculate basic stats for loaded users
            setStats({
                totalActive: loadedUsers.filter(u => {
                    const lastLogin = u.last_login_date || u.lastVisit;
                    if (!lastLogin) return false;
                    try {
                        const date = lastLogin.toDate ? lastLogin.toDate() : new Date(lastLogin);
                        return (Date.now() - date.getTime() < 7*24*60*60*1000);
                    } catch { return false; }
                }).length,
                totalPremium: loadedUsers.filter(u => u.is_premium || u.isPremium || u.role === 'premium').length,
                totalBanned: loadedUsers.filter(u => u.is_banned).length,
                avgXp: Math.round(loadedUsers.reduce((sum, u) => sum + (Number(u.xp) || 0), 0) / (loadedUsers.length || 1))
            });
        } catch (error: any) {
            console.error("[UserManagement] Fatal fetch error:", error);
            setError(`${error.code || 'unknown'}: ${error.message || "Failed to load users from Firestore."}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleAdmin = async (userId: string, currentRole: string) => {
        if (!window.confirm(`Are you sure you want to change this user's role?`)) return;
        try {
            const newRole = currentRole === 'admin' ? 'user' : 'admin';
            await updateDoc(doc(db, 'profiles', userId), { role: newRole });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (e) {
            console.error("Failed to update role", e);
        }
    };

    const toggleBan = async (userId: string, isCurrentlyBanned: boolean) => {
        const action = isCurrentlyBanned ? 'Restore Access' : 'Ban User';
        if (!window.confirm(`Are you sure you want to ${action} for this user?`)) return;
        try {
            await updateDoc(doc(db, 'profiles', userId), { is_banned: !isCurrentlyBanned });
            setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !isCurrentlyBanned } : u));
            setStats(prev => ({ ...prev, totalBanned: prev.totalBanned + (isCurrentlyBanned ? -1 : 1) }));
        } catch (e) {
            console.error("Failed to toggle ban status", e);
        }
    };

    const filteredUsers = useMemo(() => {
        let result = users.filter(u => 
            (u.display_name || u.name || (u as any).displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (u.email || (u as any).userEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (activeFilter === 'Gmail') {
            result = result.filter(u => (u.email || (u as any).userEmail || '').toLowerCase().includes('gmail.com'));
        } else if (activeFilter === 'Guest') {
            result = result.filter(u => u.isGuest || (u as any).is_guest || (u as any).anonymous || !(u.email || (u as any).userEmail));
        } else if (activeFilter === 'JEE' || activeFilter === 'NEET') {
            result = result.filter(u => {
                const examStr = (u.targetExam || (u as any).goal || (u as any).exam || '').toString().toUpperCase();
                return examStr.includes(activeFilter);
            });
        } else if (activeFilter === 'Unspecified') {
            result = result.filter(u => !(u.targetExam || (u as any).goal) && !(u.userClass || (u as any).grade));
        } else if (activeFilter === 'Banned') {
            result = result.filter(u => u.is_banned);
        } else if (['11th', '12th', 'Dropper'].includes(activeFilter)) {
            result = result.filter(u => {
                const classStr = (u.userClass || (u as any).grade || (u as any).className || '').toString().toLowerCase();
                if (activeFilter === '11th') return classStr.includes('11');
                if (activeFilter === '12th') return classStr.includes('12');
                return classStr.includes('drop') || classStr.includes('repeater');
            });
        }

        return result.sort((a, b) => {
            const timeA = new Date(a.last_login_date || a.lastVisit || 0).getTime();
            const timeB = new Date(b.last_login_date || b.lastVisit || 0).getTime();
            return sortOrder === 'latest' ? timeB - timeA : timeA - timeB;
        });
    }, [users, searchTerm, activeFilter, sortOrder]);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-main font-heading flex items-center gap-3">
                        <Users className="text-indigo-400" size={32} />
                        User Management
                    </h1>
                    <p className="text-text-muted mt-2">
                        View and manage registered students across the platform.
                    </p>
                </div>
                <button 
                  onClick={fetchUsers}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/10 rounded-xl text-sm font-bold text-text-muted hover:text-white hover:border-indigo-500/50 transition-all active:scale-95 disabled:opacity-50"
                >
                  <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
                  Fetch Latest Data
                </button>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading && users.length === 0 ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <div className="glass-card p-6 border border-white/5 flex items-center gap-4 group hover:border-green-500/30 transition-colors">
                            <div className="p-3 bg-green-500/10 text-green-400 rounded-xl"><TrendingUp size={24} /></div>
                            <div><p className="text-sm font-bold text-text-muted">7-Day Active</p><p className="text-2xl font-bold text-white">{stats.totalActive}</p></div>
                        </div>
                        <div className="glass-card p-6 border border-white/5 flex items-center gap-4 group hover:border-yellow-500/30 transition-colors">
                            <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl"><Crown size={24} /></div>
                            <div><p className="text-sm font-bold text-text-muted">Premium</p><p className="text-2xl font-bold text-white">{stats.totalPremium}</p></div>
                        </div>
                        <div className="glass-card p-6 border border-white/5 flex items-center gap-4 group hover:border-purple-500/30 transition-colors">
                            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><Shield size={24} /></div>
                            <div><p className="text-sm font-bold text-text-muted">Avg XP</p><p className="text-2xl font-bold text-white">{stats.avgXp}</p></div>
                        </div>
                        <div className="glass-card p-6 border border-white/5 flex items-center gap-4 group hover:border-red-500/30 transition-colors">
                            <div className="p-3 bg-red-500/10 text-red-500 rounded-xl"><UserMinus size={24} /></div>
                            <div><p className="text-sm font-bold text-text-muted">Banned</p><p className="text-2xl font-bold text-white">{stats.totalBanned}</p></div>
                        </div>
                    </>
                )}
            </div>

            {/* Main Table Card */}
            <div className="glass-card border border-white/10 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/5 flex flex-col gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar hide-scrollbar">
                        {['All', 'JEE', 'NEET', '11th', '12th', 'Dropper', 'Gmail', 'Guest', 'Unspecified', 'Banned'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${activeFilter === filter ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-surface border border-white/5 text-text-muted hover:text-white'}`}
                            >
                                {filter}
                            </button>
                        ))}
                        
                        <div className="flex-1 hidden sm:block" />
                        
                        <button
                            onClick={() => setSortOrder(prev => prev === 'latest' ? 'oldest' : 'latest')}
                            className="bg-surface border border-white/5 rounded-full px-3 py-1.5 text-xs font-bold text-text-muted hover:text-white transition-all shrink-0 flex items-center gap-1.5"
                        >
                            <Clock size={12} />
                            {sortOrder === 'latest' ? 'Sort by Latest' : 'Sort by Oldest'}
                        </button>
                    </div>

                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-text-muted text-xs uppercase tracking-wider">
                                <th className="p-4 font-bold border-b border-white/5">User</th>
                                <th className="p-4 font-bold border-b border-white/5">Target / Class</th>
                                <th className="p-4 font-bold border-b border-white/5">XP & Level</th>
                                <th className="p-4 font-bold border-b border-white/5">Last Login</th>
                                <th className="p-4 font-bold border-b border-white/5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading && users.length === 0 ? (
                                <>
                                    <TableRowSkeleton cols={5} />
                                    <TableRowSkeleton cols={5} />
                                    <TableRowSkeleton cols={5} />
                                    <TableRowSkeleton cols={5} />
                                    <TableRowSkeleton cols={5} />
                                </>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            {error ? (
                                                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-sm">
                                                    <Shield className="text-red-500 mx-auto mb-4" size={32} />
                                                    <p className="text-red-500 font-bold mb-2 uppercase tracking-widest text-xs">Access Error</p>
                                                    <p className="text-text-muted text-sm mb-4">{error}</p>
                                                    <button 
                                                        onClick={fetchUsers}
                                                        className="w-full py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all"
                                                    >
                                                        Retry Connection
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="opacity-50">
                                                    <Users size={48} className="text-text-muted mx-auto mb-4" />
                                                    <div>
                                                        <p className="text-text-main font-bold">No users found</p>
                                                        <p className="text-text-muted text-sm mb-4">Try adjusting your search or refresh the data.</p>
                                                    </div>
                                                    <button 
                                                        onClick={fetchUsers}
                                                        className="px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-bold hover:bg-indigo-500/20 transition-all"
                                                    >
                                                        Refresh Now
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shrink-0">
                                                    {(u.display_name || u.name || (u as any).displayName || u.id || "?").charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-white flex items-center gap-2 truncate">
                                                        {u.display_name || u.name || (u as any).displayName || `Student ${u.id.substring(0, 5)}`}
                                                        {u.role === 'admin' && <ShieldCheck size={14} className="text-red-400" />}
                                                        {u.is_banned && <span className="bg-red-500 text-[8px] px-1 rounded font-black italic">BANNED</span>}
                                                    </p>
                                                    <p className="text-xs text-text-muted truncate">
                                                        {u.email || (u as any).userEmail || "Anonymous Account"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-text-muted">
                                            {u.targetExam || "-"} <br /> {u.userClass || "-"}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full max-w-[100px] h-2 bg-surface rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, (u.xp || 0) / 100)}%` }} />
                                                </div>
                                                <span className="text-xs font-bold text-white">{u.xp || 0}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-text-muted">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} />
                                                {u.last_login_date ? new Date(u.last_login_date).toLocaleDateString() : 'Never'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => alert(`RAW DATA:\n${JSON.stringify(u, null, 2)}`)}
                                                    className="p-1.5 rounded bg-white/5 text-text-muted hover:text-white"
                                                    title="Inspect Raw Data"
                                                >
                                                    <Terminal size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => toggleAdmin(u.id, u.role || 'user')}
                                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1.5 ${u.role === 'admin' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
                                                    title={u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                                                >
                                                    <Key size={12} />
                                                </button>
                                                <button 
                                                    onClick={() => toggleBan(u.id, !!u.is_banned)}
                                                    className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1.5 ${u.is_banned ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                                                    title={u.is_banned ? 'Restore Access' : 'Ban User'}
                                                >
                                                    {u.is_banned ? <UserCheck size={12} /> : <UserMinus size={12} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
