import { Brain, AlertCircle, Clock, Eye, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { TopicStat } from '../../services/topicStrengthService';

interface MasteryDiagnosticsProps {
    stats: TopicStat[];
}

export const MasteryDiagnostics: React.FC<MasteryDiagnosticsProps> = ({ stats }) => {
    const navigate = useNavigate();

    // Aggregate global error analysis
    const aggregate = stats.reduce((acc, curr) => {
        if (curr.error_analysis) {
            acc.conceptual += curr.error_analysis.conceptualCount;
            acc.silly += curr.error_analysis.sillyCount;
            acc.time += curr.error_analysis.timePressureCount;
            acc.misread += curr.error_analysis.misreadCount;
            acc.total += curr.error_analysis.totalErrors;
        }
        return acc;
    }, { conceptual: 0, silly: 0, time: 0, misread: 0, total: 0 });

    if (aggregate.total === 0) {
        return (
            <div className="space-y-6 opacity-60">
                <div className="flex items-center gap-2 mb-4">
                    <Brain className="text-primary" size={20} />
                    <h4 className="text-sm font-bold text-text-main uppercase tracking-widest">Mastery Diagnostics</h4>
                </div>
                <div className="bg-surface/30 rounded-2xl p-8 border border-dashed border-border flex flex-col items-center justify-center text-center space-y-4">
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <AlertCircle className="text-primary/40" size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-text-main">Calibration Required</p>
                        <p className="text-xs text-text-muted mt-1 max-w-[200px]">Take a diagnostic test to unlock root-cause error analysis.</p>
                    </div>
                    <button type="button"
                        onClick={() => navigate('/dashboard/mock?mode=diagnostic')}
                        className="px-4 py-2 rounded-lg bg-primary/20 text-primary text-xs font-bold hover:bg-primary/30 transition-all"
                    >
                        Start Calibration
                    </button>
                </div>
            </div>
        );
    }

    const data = [
        { label: 'Conceptual', value: aggregate.conceptual, color: 'bg-red-500', icon: Brain, description: 'Knowledge gaps in fundamentals' },
        { label: 'Silly Errors', value: aggregate.silly, color: 'bg-yellow-500', icon: AlertCircle, description: 'Careless mistakes or accuracy issues' },
        { label: 'Time Pressure', value: aggregate.time, color: 'bg-blue-500', icon: Clock, description: 'Errors made under restricted timer' },
        { label: 'Misread', value: aggregate.misread, color: 'bg-purple-500', icon: Eye, description: 'Failed to interpret question correctly' }
    ].sort((a, b) => b.value - a.value);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Brain className="text-primary" size={20} />
                <h4 className="text-sm font-bold text-text-main uppercase tracking-widest">Mastery Diagnostics</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    {data.map((item, idx) => (
                        <div key={item.label} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                                <span className="text-text-muted flex items-center gap-1">
                                    <item.icon size={12} className={item.color.replace('bg-', 'text-')} />
                                    {item.label}
                                </span>
                                <span className="text-text-main">{Math.round((item.value / aggregate.total) * 100)}%</span>
                            </div>
                            <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-border/50">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(item.value / aggregate.total) * 100}%` }}
                                    transition={{ delay: idx * 0.1, duration: 1 }}
                                    className={`h-full ${item.color}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-surface/50 rounded-2xl p-4 border border-border/50 flex flex-col justify-center space-y-3">
                    <p className="text-xs font-bold text-text-muted uppercase">Primary Impediment</p>
                    <div>
                        <h5 className="text-lg font-black text-text-main flex items-center gap-2">
                            {data[0].label}
                        </h5>
                        <p className="text-sm text-text-muted mt-1 leading-relaxed">
                            {data[0].description}. Focus on remediation sets marked for{' '}
                            <span className="text-primary font-bold">{data[0].label}</span> hardening.
                        </p>
                    </div>

                    <button type="button"
                        onClick={() => navigate(`/dashboard/mock?mode=remediation&focus=${data[0].label.toUpperCase()}`)}
                        className="w-full mt-2 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all active:scale-95"
                    >
                        <Sparkles size={16} />
                        Start Precision Remediation
                    </button>
                </div>
            </div>
        </div>
    );
};
