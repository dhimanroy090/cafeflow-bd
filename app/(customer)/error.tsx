"use client";

import { useEffect } from "react";
import { UtensilsCrossed, RefreshCw, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Customer Menu Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 text-center shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <UtensilsCrossed className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Menu Temporarily Unavailable</h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          We had trouble loading the restaurant&apos;s menu. Please tap retry or ask a floor waiter for assistance.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => reset()}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Menu
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => alert("A staff member has been notified and is coming to your table.")}
            className="w-full border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            <Bell className="w-4 h-4 mr-2" />
            Call Waiter
          </Button>
        </div>
      </div>
    </div>
  );
}
