"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="flex-1 min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Dashboard Error</h2>
        <p className="text-sm text-slate-400 mb-4">
          We encountered a problem loading this dashboard section. Historical orders and data remain intact.
        </p>
        {error.message && (
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-rose-400 mb-4 text-left overflow-auto max-h-24">
            {error.message}
          </div>
        )}
        <Button
          onClick={() => reset()}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Section
        </Button>
      </div>
    </div>
  );
}
