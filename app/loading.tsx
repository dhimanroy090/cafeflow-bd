export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-slate-800 border-t-amber-500 animate-spin" />
        <div className="absolute w-6 h-6 rounded-full bg-amber-500/20 animate-pulse" />
      </div>
      <p className="text-sm font-medium text-slate-400 animate-pulse">Loading CaféFlow BD...</p>
    </div>
  );
}
