import Link from "next/link";
import { env } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SystemShowcase } from "./components/system-showcase";
import {
  UtensilsCrossed,
  CheckCircle2,
  Server,
  KeyRound,
  ShieldCheck,
  Globe2,
  QrCode,
  Utensils,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-charcoal selection:bg-brand-terracotta selection:text-white">
      {/* Top Brand Navigation Bar */}
      <header className="border-b border-border/80 bg-brand-cream/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-brand-forest text-brand-cream flex items-center justify-center shadow-md">
              <UtensilsCrossed className="w-5 h-5 text-brand-terracotta" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-brand-forest tracking-tight block leading-tight">
                CaféFlow BD
              </span>
              <span className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">
                Restaurant OS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="bg-brand-forest text-brand-cream font-bold text-xs h-9">
              <Link href="/dashboard">
                <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                Staff Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 sm:space-y-12">
        {/* Hero Section */}
        <div className="space-y-5 max-w-3xl">
          <Badge variant="accent" className="text-xs px-3 py-1 font-semibold">
            Bangladesh Restaurant Operating System & POS
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-brand-forest tracking-tight leading-[1.15]">
            Engineering a High-Performance QR Ordering & Cloud POS Foundation
          </h1>
          <p className="font-bengali text-lg sm:text-xl text-brand-charcoal/90 leading-relaxed">
            ক্যাফে ও রেস্তোরাঁর জন্য আধুনিক, নির্ভরযোগ্য এবং মাল্টি-টেন্যান্ট কিউআর টেবিল অর্ডারিং সিস্টেম।
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Scan dine-in table QR codes, dispatch orders directly to barista kitchen screens, and manage cashier billing with instant bKash, cash, and card settlement.
          </p>

          {/* Interactive Live Demo Launchers */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button asChild size="lg" className="bg-brand-forest hover:bg-brand-forest-light text-brand-cream font-bold text-sm shadow-lg gap-2">
              <Link href="/r/artisancoffee-dhk?t=table-04-token">
                <QrCode className="w-4 h-4 text-brand-terracotta" />
                Test Customer QR Menu (Table 04)
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-brand-forest/40 text-brand-forest hover:bg-secondary font-bold text-sm gap-2">
              <Link href="/dashboard/pos">
                <Utensils className="w-4 h-4 text-brand-terracotta" />
                Quick Counter POS
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="text-brand-forest font-bold text-sm gap-2">
              <Link href="/dashboard/tables">
                <QrCode className="w-4 h-4" />
                Table QR Stands
              </Link>
            </Button>
          </div>
        </div>

        {/* System Readiness Verification Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-forest flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-forest" />
              System Readiness & Health Audit
            </h2>
            <Badge variant="secondary" className="text-xs">
              Phase 0 Complete
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-[14px] border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Server className="w-5 h-5 text-brand-forest" />
                  <Badge variant="success" className="text-[11px] gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Configured
                  </Badge>
                </div>
                <CardTitle className="text-base pt-2">Next.js 15 App Router</CardTitle>
                <CardDescription className="text-xs">
                  Server Components with strict TypeScript, `@/*` aliases, and isolated route groups.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs space-y-1 font-mono text-muted-foreground border-t pt-3">
                <div>Route Groups: 5 modular clusters</div>
                <div>Strict Typecheck: Enabled</div>
              </CardContent>
            </Card>

            <Card className="rounded-[14px] border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <KeyRound className="w-5 h-5 text-brand-terracotta" />
                  <Badge variant="success" className="text-[11px] gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Validated
                  </Badge>
                </div>
                <CardTitle className="text-base pt-2">Zod Environment (`lib/env.ts`)</CardTitle>
                <CardDescription className="text-xs">
                  Runtime & build-time schema validation safeguarding API keys and URLs.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs space-y-1 font-mono text-muted-foreground border-t pt-3">
                <div>Env: {env.NODE_ENV}</div>
                <div>Host: {env.NEXT_PUBLIC_APP_URL}</div>
              </CardContent>
            </Card>

            <Card className="rounded-[14px] border-border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Globe2 className="w-5 h-5 text-brand-forest" />
                  <Badge variant="success" className="text-[11px] gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Isolated
                  </Badge>
                </div>
                <CardTitle className="text-base pt-2">Supabase SSR Utilities</CardTitle>
                <CardDescription className="text-xs">
                  Separated `client.ts` (browser), `server.ts` (async cookies), and `middleware.ts` (session refresh).
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs space-y-1 font-mono text-muted-foreground border-t pt-3">
                <div>SSR Package: @supabase/ssr</div>
                <div>Session Refresh: Active in root middleware</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Interactive Primitives, Design System & Typography */}
        <SystemShowcase />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 mt-16 py-8 bg-brand-cream/60">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-bold text-brand-forest">CaféFlow BD</span>
            <span>•</span>
            <span>Production Multi-Tenant SaaS</span>
          </div>
          <p className="font-bengali text-brand-charcoal/70">
            রেস্তোরাঁ ও ক্যাফে অটোমেশন প্রযুক্তি • ঢাকা, বাংলাদেশ
          </p>
        </div>
      </footer>
    </div>
  );
}
