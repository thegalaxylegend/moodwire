import React from 'react';

export const BlogSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navbar Placeholder */}
            <nav className="fixed top-0 left-0 w-full h-20 flex items-center z-50">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between w-full">
                    <div className="text-xl md:text-2xl font-bold text-white tracking-tighter">
                        Exam<span className="text-[#a855f7]">Compass</span>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="h-4 w-12 bg-white/5 rounded animate-pulse hidden md:block" />
                        <div className="h-4 w-12 bg-white/5 rounded animate-pulse" />
                        <div className="h-10 w-24 bg-white/10 rounded-full animate-pulse" />
                    </div>
                </div>
            </nav>

            {/* Main Content Skeleton */}
            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <header className="mb-20 text-center max-w-3xl mx-auto space-y-6">
                    <div className="h-6 w-32 bg-purple-500/10 rounded-full mx-auto animate-pulse" />
                    <div className="h-16 w-full bg-white/5 rounded-2xl animate-pulse" />
                    <div className="h-8 w-2/3 bg-white/5 rounded-xl mx-auto animate-pulse" />
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex flex-col h-[500px] bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden border border-white/5 animate-shimmer">
                            <div className="aspect-[16/11] w-full bg-white/5" />
                            <div className="p-8 space-y-4">
                                <div className="h-8 w-full bg-white/5 rounded-lg" />
                                <div className="h-4 w-2/3 bg-white/5 rounded" />
                                <div className="mt-auto pt-8 flex justify-between">
                                    <div className="h-4 w-20 bg-white/5 rounded" />
                                    <div className="h-10 w-24 bg-white/10 rounded-2xl" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};
