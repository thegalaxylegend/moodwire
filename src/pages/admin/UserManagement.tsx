import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, limit, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { Users, Search, Shield, ShieldCheck, Clock, Crown, TrendingUp, Key } from 'lucide-react';
import type { User } from '../../store/userStore';

interface AdminUserView extends User {
    last_login_date?: string;
    is_premium?: boolean;
}

export const UserManagement = () => {
    const [users, setUsers] = useState<AdminUserView[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ totalActive: 0, totalPremium: 0, avgXp: 0 });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'profiles'),
                orderBy('last_login_date', 'desc'),
                limit(100)
            );
            const snap = await getDocs(q);
            const loadedUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            setUsers(loadedUsers);
            
            // Calculate basic stats for loaded users (in a real app, use aggregation queries)
            setStats({
                totalActive: loadedUsers.filter(u => u.last_login_date && (Date.now() - new Date(u.last_login_date).getTime() < 7*24*60*60*1000)).length,
                totalPremium: loadedUsers.filter(u => u.is_premium).length,
                avgXp: Math.round(loadedUsers.reduce((sum, u) => sum + (u.xp || 0), 0) / (loadedUsers.length || 1))
            });
        } catch (error) {
            console.error("Failed to fetch users", error);
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

    const filteredUsers = users.filter(u => 
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-6 border border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 text-green-400 rounded-xl"><TrendingUp size={24} /></div>
                    <div><p className="text-sm font-bold text-text-muted">7-Day Active</p><p className="text-2xl font-bold text-white">{stats.totalActive}</p></div>
                </div>
                <div className="glass-card p-6 border border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl"><Crown size={24} /></div>
                    <div><p className="text-sm font-bold text-text-muted">Premium</p><p className="text-2xl font-bold text-white">{stats.totalPremium}</p></div>
                </div>
                <div className="glass-card p-6 border border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><Shield size={24} /></div>
                    <div><p className="text-sm font-bold text-text-muted">Avg XP</p><p className="text-2xl font-bold text-white">{stats.avgXp}</p></div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="glass-card border border-white/10 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/5 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
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
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-text-muted animate-pulse">Loading users...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-text-muted">No users found.</td></tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg">
                                                    {(u.name || "?").charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white flex items-center gap-2">
                                                        {u.name || "Anonymous"}
                                                        {u.role === 'admin' && <ShieldCheck size={14} className="text-red-400" />}
                                                    </p>
                                                    <p className="text-xs text-text-muted">{u.email || "No Email"}</p>
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
                                            <button 
                                                onClick={() => toggleAdmin(u.id, u.role || 'user')}
                                                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1.5 ml-auto ${u.role === 'admin' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'}`}
                                            >
                                                <Key size={12} />
                                                {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                                            </button>
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
