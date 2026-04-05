import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  color: 'blue' | 'purple' | 'amber' | 'green' | 'cyan' | 'pink';
}

export const StatCard = ({ icon, label, value, trend, color }: StatCardProps) => {
  const colors = {
    blue: 'border-blue-400/20 text-blue-400 shadow-blue-400/10',
    purple: 'border-purple-400/20 text-purple-400 shadow-purple-400/10',
    amber: 'border-amber-400/20 text-amber-400 shadow-amber-400/10',
    green: 'border-green-400/20 text-green-400 shadow-green-400/10',
    cyan: 'border-cyan-400/20 text-cyan-400 shadow-cyan-400/10',
    pink: 'border-pink-400/20 text-pink-400 shadow-pink-400/10'
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`glass-card p-4 sm:p-6 border ${colors[color]} space-y-3 sm:space-y-4 bg-white/5 h-full`}
    >
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <h3 className="text-2xl sm:text-3xl font-black text-text-main">{value}</h3>
          <Sparkles size={12} className="text-primary animate-pulse" />
        </div>
        <p className="text-xs text-text-muted/60 mt-2 flex items-center gap-1">
          <Sparkles size={10} className="text-primary/40" />
          {trend}
        </p>
      </div>
    </motion.div>
  );
};
