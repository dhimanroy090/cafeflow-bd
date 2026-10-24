import Link from "next/link";
import { UtensilsCrossed, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 text-amber-500 flex items-center justify-center mx-auto mb-6">
          <UtensilsCrossed className="w-8 h-8" />
        </div>

        <span className="text-xs uppercase tracking-widest font-mono text-amber-500 font-semibold mb-2 block">
          404 &bull; Page Not Found
        </span>

        <h1 className="text-2xl font-bold text-white mb-2">Table or Page Unavailable</h1>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          The table QR code, menu link, or page you were looking for doesn&apos;t exist or may have been moved.
        </p>

        <Button
          asChild
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold w-full"
        >
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to CaféFlow Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
