import { Menu, Flame } from 'lucide-react';

export const AppShellSkeleton = () => {
    return (
        <div className="min-h-screen flex text-text-main">
            {/* Sidebar Skeleton */}
            <aside className="fixed lg:sticky top-0 h-screen bg-surface/95 backdrop-blur-md border-r border-border w-64 hidden lg:flex flex-col z-[70]">
                <div className="p-6 flex items-center justify-between shrink-0">
                    <span className="text-xl md:text-2xl font-bold text-white tracking-tighter whitespace-nowrap">
                        Exam<span className="text-[#a855f7]">Compass</span>
                    </span>
                </div>

                <div className="flex-1 px-4 space-y-2 mt-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface/50 border border-transparent">
                            <div className="w-5 h-5 rounded-md bg-text-muted/10 animate-pulse" />
                            <div className="h-4 w-24 bg-text-muted/10 rounded animate-pulse" />
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 rounded-full bg-surface/50 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-3 w-20 bg-text-muted/10 rounded animate-pulse" />
                            <div className="h-2 w-12 bg-text-muted/10 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Skeleton */}
            <main className="flex-1 p-4 lg:p-10 overflow-x-hidden relative w-full pb-24 lg:pb-10">
                {/* Mobile Header Skeleton */}
                <div className="lg:hidden mb-4 h-20 flex items-center justify-between shrink-0 sticky top-0 z-50 -mt-4 -mx-4 px-4">
                    <span className="text-xl md:text-2xl font-bold text-white tracking-tighter">Exam<span className="text-[#a855f7]">Compass</span></span>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-primary font-bold text-sm opacity-50">
                            <Flame size={16} />
                            <span>-</span>
                        </div>
                        <button className="p-2 rounded-lg bg-surface border border-border">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header Area Skeleton */}
                    <header className="flex items-center justify-between mb-8">
                        <div className="space-y-3">
                            <div className="h-8 w-48 md:w-64 bg-surface rounded-lg animate-pulse" />
                            <div className="h-4 w-32 md:w-48 bg-surface/50 rounded animate-pulse" />
                        </div>
                    </header>

                    {/* Hero / Banner Skeleton - LARGE to capture LCP early */}
                    <div className="w-full h-64 bg-surface border border-border rounded-xl animate-pulse" />

                    {/* Content Cards Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-surface border border-border rounded-xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};
