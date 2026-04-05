import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { History, Shield, Activity, Clock, User, MessageSquare, AlertCircle, RotateCw } from 'lucide-react';
import { StatCardSkeleton, TableRowSkeleton } from '../../components/skeletons/AdminSkeleton';

interface AuditLog {
    id: string;
    timestamp: any;
    action: string;
    adminName: string;
    adminEmail: string;
    targetUser?: string;
    details: string;
    type: 'security' | 'content' | 'user' | 'system';
}

export const AuditLogs = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'audit_logs'),
                orderBy('timestamp', 'desc'),
                limit(100)
            );
            const snap = await getDocs(q);
            setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog)));
        } catch (err: any) {
            console.error("AuditLogs fetch error:", err);
            setError("Failed to sync audit trail. Collection may be empty.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'security': return <Shield className="text-red-400" size={14} />;
            case 'user': return <User className="text-blue-400" size={14} />;
            case 'content': return <MessageSquare className="text-purple-400" size={14} />;
            default: return <Activity className="text-gray-400" size={14} />;
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-main font-heading flex items-center gap-3">
                        <History className="text-primary" size={32} />
                        Audit <span className="text-primary">Trail</span>
                    </h1>
                    <p className="text-text-muted mt-2">
                        Transparent ledger of all administrative actions and security events.
                    </p>
                </div>
                <button 
                  onClick={fetchLogs}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-surface border border-white/10 rounded-xl text-sm font-bold text-text-muted hover:text-white transition-all active:scale-95 disabled:opacity-50"
                >
                  <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
                  Sync Ledger
                </button>
            </header>

            <div className="glass-card border border-white/10 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-text-muted text-[10px] uppercase tracking-widest font-bold">
                                <th className="p-4 border-b border-white/5 w-48">Timestamp</th>
                                <th className="p-4 border-b border-white/5 w-32">Category</th>
                                <th className="p-4 border-b border-white/5">Administrator</th>
                                <th className="p-4 border-b border-white/5">Action & Scope</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-sans">
                            {loading && logs.length === 0 ? (
                                Array(5).fill(0).map((_, i) => <TableRowSkeleton key={i} cols={4} />)
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center text-text-muted italic text-sm">
                                        <History size={48} className="mx-auto mb-4 opacity-10" />
                                        No entries found in the audit ledger.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 text-xs font-mono text-text-muted group-hover:text-primary transition-colors">
                                            {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5 w-fit">
                                                {getTypeIcon(log.type)}
                                                <span className="text-[10px] uppercase font-black tracking-tighter text-text-main">
                                                    {log.type}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                                    {log.adminName?.charAt(0) || "A"}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-text-main">{log.adminName}</p>
                                                    <p className="text-[10px] text-text-muted font-mono">{log.adminEmail}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm text-text-main font-medium">{log.action}</p>
                                            <p className="text-[10px] text-text-muted mt-1 leading-relaxed max-w-md">
                                                {log.details}
                                                {log.targetUser && <span className="text-primary italic ml-2">@target: {log.targetUser}</span>}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <AlertCircle className="text-amber-500" size={18} />
                    <p className="text-xs text-amber-500 font-medium">{error}</p>
                </div>
            )}
        </div>
    );
};
