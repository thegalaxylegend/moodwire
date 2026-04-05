// Fixed TS6133 unused imports

export const StatCardSkeleton = () => (
  <div className="glass-card p-6 border border-white/5 flex items-center gap-4 animate-pulse">
    <div className="p-3 bg-white/5 rounded-xl w-12 h-12" />
    <div className="space-y-2 flex-1">
      <div className="h-3 w-20 bg-white/5 rounded" />
      <div className="h-6 w-16 bg-white/10 rounded" />
    </div>
  </div>
);

export const TableRowSkeleton = ({ cols = 5 }: { cols?: number }) => (
  <tr className="animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="p-4">
        <div className="h-4 bg-white/5 rounded w-full" />
      </td>
    ))}
  </tr>
);

export const ListSkeleton = ({ items = 5 }: { items?: number }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="h-12 bg-white/5 rounded-lg w-full" />
    ))}
  </div>
);

export const AdminOverviewSkeleton = () => (
  <div className="space-y-10 pb-20">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="space-y-4">
        <div className="h-6 w-32 bg-white/5 rounded animate-pulse" />
        <div className="h-10 w-48 bg-white/10 rounded animate-pulse" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 glass-card p-6 border-white/5 h-64 bg-white/5 animate-pulse" />
      <div className="glass-card p-6 border-white/5 h-64 bg-white/5 animate-pulse" />
    </div>
  </div>
);
