import React from 'react';
import { Menu, Flame } from 'lucide-react';

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen flex text-text-main bg-background">
            {/* Sidebar Skeleton */}
            <aside className="fixed lg:sticky top-0 h-screen bg-surface/95 backdrop-blur-md border-r border-border w-64 hidden lg:flex flex-col z-[70]">
                <div className="p-6 h-20 flex items-center justify-between shrink-0">
                    <img src="/logo.jpg" alt="Exam Compass" className="h-8 md:h-10 w-auto opacity-50" />
                </div>

                <div className="flex-1 px-4 space-y-2 mt-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface/30 border border-transparent animate-pulse">
                            <div className="w-5 h-5 rounded-md bg-white/5" />
                            <div className="h-4 w-24 bg-white/5 rounded" />
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 rounded-full bg-surface/50 animate-pulse" />
                        <div className="space-y-2 flex-1">
                            <div className="h-3 w-2/3 bg-white/5 rounded animate-pulse" />
                            <div className="h-2 w-1/2 bg-white/5 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Skeleton */}
            <main className="flex-1 p-4 lg:p-10 overflow-x-hidden relative w-full pb-24 lg:pb-10 flex flex-col">
                {/* Mobile Header Skeleton */}
                <div className="lg:hidden mb-4 h-20 flex items-center justify-between shrink-0 sticky top-0 z-50 -mt-4 -mx-4 px-4">
                    <img src="/logo.jpg" alt="Exam Compass" className="h-8 md:h-10 w-auto opacity-50" />
                    <div className="flex items-center gap-3 opacity-50">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-primary font-bold text-sm">
                            <Flame size={16} />
                            <span>-</span>
                        </div>
                        <button className="p-2 rounded-lg bg-surface border border-border">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto flex-1 w-full space-y-8">
                    {/* Header Placeholder */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="space-y-4">
                            <div className="h-10 w-64 bg-surface rounded-xl animate-pulse" />
                            <div className="h-4 w-48 bg-surface/50 rounded-lg animate-pulse" />
                        </div>
                        <div className="h-12 w-40 bg-primary/20 rounded-xl animate-pulse" />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-24 bg-surface border border-border rounded-2xl animate-pulse" />
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 h-[400px] bg-surface/50 border border-border rounded-3xl animate-pulse" />
                        <div className="h-[400px] bg-surface/50 border border-border rounded-3xl animate-pulse" />
                    </div>
                </div>
            </main>
        </div>
    );
};
