export default function CustomerLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 animate-pulse">
      {/* Restaurant Header Skeleton */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-36 bg-slate-800 rounded-md" />
          <div className="h-6 w-20 bg-amber-500/20 rounded-full" />
        </div>
        <div className="h-4 w-52 bg-slate-800/70 rounded" />
      </div>

      {/* Categories Horizontal Bar Skeleton */}
      <div className="p-4 flex gap-2 overflow-x-hidden border-b border-slate-800/60">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-24 bg-slate-900 rounded-full shrink-0" />
        ))}
      </div>

      {/* Menu Items List Skeleton */}
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex gap-4 p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl"
          >
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 bg-slate-800 rounded" />
              <div className="h-3.5 w-full bg-slate-800/60 rounded" />
              <div className="h-3.5 w-2/3 bg-slate-800/60 rounded" />
              <div className="h-5 w-20 bg-amber-500/20 rounded mt-2" />
            </div>
            <div className="w-24 h-24 bg-slate-800 rounded-xl shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
