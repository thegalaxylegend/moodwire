import React from 'react';

// ─── Shared Shimmer Block ─────────────────────────────────────────────────────
const S = ({ className = '' }: { className?: string }) => (
    <div className={`skeleton-shimmer rounded-xl ${className}`} />
);

const SRound = ({ className = '' }: { className?: string }) => (
    <div className={`skeleton-shimmer rounded-full ${className}`} />
);

// ─── Shared Page Wrapper ──────────────────────────────────────────────────────
const PageWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-full max-w-6xl mx-auto px-2 md:px-4 space-y-8 pt-4 pb-32 animate-in fade-in duration-300">
        {children}
    </div>
);

const PageHeader = ({ wide = false }: { wide?: boolean }) => (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${wide ? '' : 'max-w-3xl'}`}>
        <div className="space-y-3">
            <S className="h-9 w-52" />
            <S className="h-4 w-36 opacity-60" />
        </div>
        <S className="h-10 w-32" />
    </div>
);

// ─── 1. ARENA SKELETON ───────────────────────────────────────────────────────
export const ArenaSkeleton: React.FC = () => (
    <PageWrap>
        <PageHeader />
        {/* Mode selector tabs */}
        <div className="flex gap-3">
            {[1,2,3].map(i => <S key={i} className="h-10 w-32" />)}
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
                <div key={i} className="skeleton-card p-5 space-y-3 rounded-2xl">
                    <SRound className="size-10" />
                    <S className="h-7 w-16" />
                    <S className="h-3 w-20 opacity-50" />
                </div>
            ))}
        </div>
        {/* Challenge cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1,2,3,4].map(i => (
                <div key={i} className="skeleton-card p-6 space-y-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <SRound className="size-12" />
                        <div className="space-y-2 flex-1">
                            <S className="h-5 w-3/4" />
                            <S className="h-3 w-1/2 opacity-50" />
                        </div>
                    </div>
                    <S className="h-2 w-full rounded-full" />
                    <div className="flex gap-2">
                        <S className="h-6 w-16 rounded-lg" />
                        <S className="h-6 w-16 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
        {/* Leaderboard strip */}
        <div className="skeleton-card rounded-2xl p-6 space-y-3">
            <S className="h-5 w-36 mb-4" />
            {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-4 py-2">
                    <S className="h-4 w-6 rounded" />
                    <SRound className="size-9" />
                    <S className="h-4 flex-1" />
                    <S className="h-4 w-16" />
                </div>
            ))}
        </div>
    </PageWrap>
);

// ─── 2. TEST CENTER SKELETON ─────────────────────────────────────────────────
export const TestCenterSkeleton: React.FC = () => (
    <PageWrap>
        <PageHeader />
        {/* Filter bar */}
        <div className="flex gap-3 flex-wrap">
            {[1,2,3,4].map(i => <S key={i} className="h-9 w-24 rounded-full" />)}
        </div>
        {/* Test cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
                <div key={i} className="skeleton-card rounded-2xl p-6 space-y-4">
                    <div className="flex items-start justify-between">
                        <S className="h-5 w-2/3" />
                        <S className="h-5 w-12 rounded-full" />
                    </div>
                    <div className="flex gap-3">
                        <S className="h-4 w-20 rounded-lg" />
                        <S className="h-4 w-20 rounded-lg" />
                    </div>
                    <S className="h-2 w-full rounded-full" />
                    <div className="flex items-center justify-between">
                        <S className="h-4 w-24 opacity-50" />
                        <S className="h-9 w-24 rounded-xl" />
                    </div>
                </div>
            ))}
        </div>
        {/* Recent attempts */}
        <div className="skeleton-card rounded-2xl p-6 space-y-4">
            <S className="h-5 w-36 mb-2" />
            {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-4 py-2 border-t border-white/5">
                    <S className="h-4 w-40" />
                    <S className="h-4 w-16 opacity-50" />
                    <div className="ml-auto flex gap-2">
                        <S className="h-5 w-12 rounded-full" />
                        <S className="h-5 w-12 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    </PageWrap>
);

// ─── 3. STUDY PLAN SKELETON ──────────────────────────────────────────────────
export const StudyPlanSkeleton: React.FC = () => (
    <PageWrap>
        <PageHeader />
        {/* Week selector */}
        <div className="flex gap-2">
            {[1,2,3,4,5,6,7].map(i => (
                <div key={i} className="skeleton-card flex-1 p-3 rounded-xl space-y-2">
                    <S className="h-3 w-full opacity-50" />
                    <S className="h-5 w-full" />
                </div>
            ))}
        </div>
        {/* Today's schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <S className="h-5 w-32 mb-2" />
                {[1,2,3,4].map(i => (
                    <div key={i} className="skeleton-card rounded-2xl p-5 flex gap-4">
                        <div className="w-1 rounded-full skeleton-shimmer self-stretch" />
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                                <S className="h-5 w-48" />
                                <S className="h-5 w-14 rounded-full" />
                            </div>
                            <S className="h-3 w-32 opacity-50" />
                            <S className="h-2 w-full rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="space-y-4">
                <div className="skeleton-card rounded-2xl p-5 space-y-4">
                    <S className="h-5 w-28" />
                    <div className="relative size-32 mx-auto">
                        <SRound className="size-32" />
                    </div>
                    <div className="space-y-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="flex items-center justify-between">
                                <S className="h-3 w-24 opacity-50" />
                                <S className="h-3 w-10" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="skeleton-card rounded-2xl p-5 space-y-3">
                    <S className="h-5 w-28" />
                    {[1,2,3].map(i => (
                        <div key={i} className="flex gap-3 items-center">
                            <SRound className="size-8 shrink-0" />
                            <S className="h-4 flex-1" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </PageWrap>
);

// ─── 4. BENCHMARKING SKELETON ─────────────────────────────────────────────────
export const BenchmarkingSkeleton: React.FC = () => (
    <PageWrap>
        <PageHeader wide />
        {/* Rank card */}
        <div className="skeleton-card rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="relative shrink-0">
                <SRound className="size-32" />
                <SRound className="size-14 absolute -bottom-2 -right-2 border-4 border-black/30" />
            </div>
            <div className="flex-1 space-y-4">
                <S className="h-8 w-48" />
                <S className="h-4 w-64 opacity-60" />
                <div className="flex gap-4">
                    {[1,2,3].map(i => (
                        <div key={i} className="text-center space-y-1">
                            <S className="h-7 w-16" />
                            <S className="h-3 w-16 opacity-50" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="skeleton-card rounded-2xl p-6 space-y-4">
                <S className="h-5 w-36" />
                <S className="h-48 w-full rounded-xl" />
            </div>
            <div className="skeleton-card rounded-2xl p-6 space-y-4">
                <S className="h-5 w-36" />
                <S className="h-48 w-full rounded-xl" />
            </div>
        </div>
        {/* Leaderboard */}
        <div className="skeleton-card rounded-2xl p-6 space-y-3">
            <S className="h-5 w-36 mb-4" />
            {[1,2,3,4,5,6,7].map(i => (
                <div key={i} className="flex items-center gap-4 py-2 border-t border-white/5">
                    <S className="h-5 w-6 rounded" />
                    <SRound className="size-9" />
                    <S className="h-4 w-36" />
                    <S className="h-4 w-16 ml-auto" />
                    <S className="h-5 w-20 rounded-full" />
                </div>
            ))}
        </div>
    </PageWrap>
);

// ─── 5. DECISION SIMULATOR SKELETON ─────────────────────────────────────────
export const DecisionSimulatorSkeleton: React.FC = () => (
    <PageWrap>
        <PageHeader />
        {/* Input panel */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 skeleton-card rounded-2xl p-6 space-y-5">
                <S className="h-5 w-36" />
                {[1,2,3,4].map(i => (
                    <div key={i} className="space-y-2">
                        <S className="h-3 w-24 opacity-50" />
                        <S className="h-10 w-full rounded-xl" />
                    </div>
                ))}
                <S className="h-12 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-3 space-y-5">
                <div className="skeleton-card rounded-2xl p-6 space-y-4">
                    <S className="h-5 w-40" />
                    <S className="h-64 w-full rounded-xl" />
                </div>
                <div className="skeleton-card rounded-2xl p-6 space-y-3">
                    <S className="h-5 w-32" />
                    {[1,2,3].map(i => (
                        <div key={i} className="flex items-center gap-4">
                            <S className="h-4 w-32" />
                            <S className="h-3 flex-1 rounded-full" />
                            <S className="h-4 w-12" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </PageWrap>
);

// ─── 6. SYLLABUS SKELETON ─────────────────────────────────────────────────────
export const SyllabusSkeleton: React.FC = () => (
    <PageWrap>
        <PageHeader wide />
        {/* Subject tabs */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {[1,2,3,4].map(i => (
                <S key={i} className="h-10 w-24 shrink-0 rounded-full" />
            ))}
        </div>
        {/* Chapter cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1,2,3,4,5,6,7,8,9].map(i => (
                <div key={i} className="skeleton-card rounded-2xl p-5 space-y-4">
                    <div className="flex items-start justify-between">
                        <S className="h-5 w-3/4" />
                        <S className="h-5 w-10 rounded-full" />
                    </div>
                    <S className="h-2 w-full rounded-full" />
                    <div className="flex items-center justify-between">
                        <S className="h-3 w-20 opacity-50" />
                        <div className="flex gap-2">
                            {[1,2,3].map(j => <SRound key={j} className="size-7" />)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </PageWrap>
);

// ─── 7. SAVED LECTURES SKELETON ───────────────────────────────────────────────
export const SavedLecturesSkeleton: React.FC = () => (
    <PageWrap>
        <PageHeader />
        {/* Search + filter */}
        <div className="flex gap-3">
            <S className="h-10 flex-1 rounded-xl" />
            <S className="h-10 w-28 rounded-xl" />
        </div>
        {/* Video cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
                <div key={i} className="skeleton-card rounded-2xl overflow-hidden">
                    <S className="h-44 w-full rounded-none" />
                    <div className="p-4 space-y-3">
                        <S className="h-5 w-full" />
                        <S className="h-4 w-3/4 opacity-60" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <SRound className="size-6" />
                                <S className="h-3 w-20 opacity-50" />
                            </div>
                            <S className="h-3 w-12 opacity-50" />
                        </div>
                        <S className="h-2 w-full rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    </PageWrap>
);

// ─── 8. TIMELINE SKELETON ─────────────────────────────────────────────────────
export const TimelineSkeleton: React.FC = () => (
    <PageWrap>
        <PageHeader />
        {/* Month tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[1,2,3,4,5,6].map(i => (
                <S key={i} className="h-9 w-24 shrink-0 rounded-full" />
            ))}
        </div>
        {/* Timeline items */}
        <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 skeleton-shimmer rounded-full" />
            <div className="space-y-6 pl-16">
                {[1,2,3,4,5,6,7].map(i => (
                    <div key={i} className="relative">
                        <SRound className="size-5 absolute -left-[2.75rem] top-1" />
                        <div className="skeleton-card rounded-2xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <S className="h-5 w-48" />
                                <S className="h-5 w-16 rounded-full" />
                            </div>
                            <S className="h-3 w-32 opacity-50" />
                            <S className="h-2 w-full rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </PageWrap>
);

// ─── 9. NOTES SKELETON ───────────────────────────────────────────────────────
export const NotesSkeleton: React.FC = () => (
    <PageWrap>
        <PageHeader wide />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="skeleton-card rounded-2xl p-5 space-y-3">
                <S className="h-10 w-full rounded-xl" />
                <S className="h-10 w-full rounded-xl" />
                <div className="space-y-2 pt-2">
                    {[1,2,3,4,5,6,7].map(i => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                            <SRound className="size-4 shrink-0" />
                            <S className="h-4 flex-1" />
                        </div>
                    ))}
                </div>
            </div>
            {/* Editor area */}
            <div className="lg:col-span-3 skeleton-card rounded-2xl p-6 space-y-4 min-h-[500px]">
                {/* Toolbar */}
                <div className="flex gap-2 pb-4 border-b border-white/5">
                    {[1,2,3,4,5,6,7,8].map(i => <SRound key={i} className="size-8" />)}
                </div>
                <S className="h-8 w-64" />
                <S className="h-4 w-full" />
                <S className="h-4 w-11/12" />
                <S className="h-4 w-9/12" />
                <div className="pt-4 space-y-2">
                    <S className="h-4 w-full" />
                    <S className="h-4 w-10/12" />
                    <S className="h-4 w-8/12" />
                </div>
                <div className="pt-4 space-y-2">
                    <S className="h-4 w-full" />
                    <S className="h-4 w-11/12" />
                </div>
            </div>
        </div>
    </PageWrap>
);

// ─── 10. ANALYTICS SKELETON ───────────────────────────────────────────────────
export const AnalyticsSkeleton: React.FC = () => (
    <PageWrap>
        <PageHeader wide />
        {/* Date range picker */}
        <div className="flex gap-3 justify-end">
            {[1,2,3,4].map(i => <S key={i} className="h-9 w-20 rounded-full" />)}
        </div>
        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
                <div key={i} className="skeleton-card rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <S className="h-3 w-20 opacity-50" />
                        <SRound className="size-8" />
                    </div>
                    <S className="h-8 w-24" />
                    <S className="h-3 w-16 opacity-40" />
                </div>
            ))}
        </div>
        {/* Main chart */}
        <div className="skeleton-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
                <S className="h-5 w-40" />
                <S className="h-8 w-32 rounded-xl" />
            </div>
            <S className="h-64 w-full rounded-xl" />
        </div>
        {/* Subject breakdown + activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="skeleton-card rounded-2xl p-6 space-y-4">
                <S className="h-5 w-40" />
                {[1,2,3,4,5].map(i => (
                    <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                            <S className="h-4 w-28" />
                            <S className="h-4 w-12" />
                        </div>
                        <S className="h-2 w-full rounded-full" />
                    </div>
                ))}
            </div>
            <div className="skeleton-card rounded-2xl p-6 space-y-4">
                <S className="h-5 w-40" />
                <S className="h-48 w-full rounded-xl" />
            </div>
        </div>
    </PageWrap>
);
