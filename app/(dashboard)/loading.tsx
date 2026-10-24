export default function DashboardLoading() {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      {/* Top Header skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-800 rounded-lg" />
          <div className="h-4 w-72 bg-slate-800/60 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 bg-slate-800 rounded-lg" />
          <div className="h-9 w-28 bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-800 rounded" />
              <div className="h-6 w-6 bg-slate-800 rounded" />
            </div>
            <div className="h-7 w-32 bg-slate-700 rounded" />
          </div>
        ))}
      </div>

      {/* Main content grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="h-6 w-40 bg-slate-800 rounded" />
          <div className="h-64 bg-slate-950/50 rounded-lg" />
        </div>
        <div className="h-96 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="h-6 w-32 bg-slate-800 rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-slate-950/50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
