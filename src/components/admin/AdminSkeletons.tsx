import { motion } from 'framer-motion';

export const ToolCardSkeleton = () => (
    <div className="p-6 glass-card border-white/5 relative overflow-hidden flex flex-col justify-between h-[180px]">
        <div>
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl animate-pulse" />
                <div className="w-16 h-4 bg-white/5 rounded-md animate-pulse" />
            </div>
            <div className="w-2/3 h-5 bg-white/10 rounded-lg animate-pulse mb-2" />
            <div className="space-y-1">
                <div className="w-full h-3 bg-white/5 rounded-md animate-pulse" />
                <div className="w-4/5 h-3 bg-white/5 rounded-md animate-pulse" />
            </div>
        </div>
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="w-24 h-2 bg-white/5 rounded animate-pulse" />
            <div className="w-4 h-4 bg-white/5 rounded animate-pulse" />
        </div>

        {/* Shimmer Effect */}
        <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full"
            animate={{ translateX: ['100%', '-100%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
    </div>
);

export const MetricSkeleton = () => (
    <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2 relative overflow-hidden">
        <div className="w-12 h-2 bg-white/10 rounded animate-pulse" />
        <div className="w-24 h-4 bg-white/20 rounded animate-pulse" />
        {/* Shimmer Effect */}
        <motion.div
            className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full`}
            animate={{ translateX: ['100%', '-100%'] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        />
    </div>
);

export const DashboardSkeleton = () => (
    <div className="space-y-10">
        {/* Metric Preview Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-6 border-white/5 space-y-4">
                <div className="w-32 h-4 bg-white/10 rounded animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                   <MetricSkeleton />
                   <MetricSkeleton />
                </div>
            </div>
            <div className="glass-card p-6 border-white/5 space-y-4">
                <div className="w-32 h-4 bg-white/10 rounded animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                   <MetricSkeleton />
                   <MetricSkeleton />
                </div>
            </div>
        </div>

        {/* Categories Skeleton */}
        <div className="flex gap-2 pb-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="px-6 py-4 w-24 bg-white/5 border border-white/5 rounded-xl animate-pulse" />
            ))}
        </div>

        {/* Tool Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <ToolCardSkeleton key={i} />
            ))}
        </div>
    </div>
);
