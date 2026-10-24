"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CheckCircle2,
  Sparkles,
  Layers,
  Palette,
  Sliders,
  Bell,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Shield,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatBDT } from "@/lib/utils";

export function SystemShowcase() {
  const [isLiveOrdering, setIsLiveOrdering] = React.useState(true);
  const [selectedBranch, setSelectedBranch] = React.useState("gulshan-2");
  const [testTableNum, setTestTableNum] = React.useState("T-04");

  const triggerToast = () => {
    toast.success("CaféFlow BD System Ready!", {
      description: `Active table ${testTableNum} initialized. Ready for Phase 1 features.`,
    });
  };

  return (
    <div className="space-y-12">
      {/* Brand Color Tokens Display */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-brand-forest" />
          <h2 className="text-xl font-bold text-brand-charcoal">
            Design Tokens & Brand Palette
          </h2>
        </div>
        <p className="text-sm text-brand-charcoal/80">
          Strict production tokens configured in Tailwind and CSS variables:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-[14px] p-5 bg-[#173F35] text-[#F6F2E9] shadow-sm flex flex-col justify-between h-36">
            <span className="font-semibold text-sm">Primary / Forest</span>
            <div>
              <div className="font-mono text-xs opacity-80">#173F35</div>
              <div className="text-[11px] opacity-70">Main brand / buttons</div>
            </div>
          </div>
          <div className="rounded-[14px] p-5 bg-[#F6F2E9] text-[#27332E] border border-[#27332E]/20 shadow-sm flex flex-col justify-between h-36">
            <span className="font-semibold text-sm">Background / Cream</span>
            <div>
              <div className="font-mono text-xs opacity-80">#F6F2E9</div>
              <div className="text-[11px] opacity-70">Warm cafe canvas</div>
            </div>
          </div>
          <div className="rounded-[14px] p-5 bg-[#D98651] text-white shadow-sm flex flex-col justify-between h-36">
            <span className="font-semibold text-sm">Accent / Terracotta</span>
            <div>
              <div className="font-mono text-xs opacity-90">#D98651</div>
              <div className="text-[11px] opacity-80">Highlights & CTAs</div>
            </div>
          </div>
          <div className="rounded-[14px] p-5 bg-[#27332E] text-[#F6F2E9] shadow-sm flex flex-col justify-between h-36">
            <span className="font-semibold text-sm">Text / Charcoal</span>
            <div>
              <div className="font-mono text-xs opacity-80">#27332E</div>
              <div className="text-[11px] opacity-70">High-contrast readable</div>
            </div>
          </div>
        </div>

        {/* Border Radius Standards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-[10px] bg-card border border-border flex items-center justify-between">
            <span className="text-sm font-medium">Input Standard</span>
            <Badge variant="outline" className="font-mono text-xs">
              radius: 10px
            </Badge>
          </div>
          <div className="p-4 rounded-[14px] bg-card border border-border flex items-center justify-between">
            <span className="text-sm font-medium">Card Standard</span>
            <Badge variant="outline" className="font-mono text-xs">
              radius: 14px
            </Badge>
          </div>
          <div className="p-4 rounded-[18px] bg-card border border-border flex items-center justify-between">
            <span className="text-sm font-medium">Modal Standard</span>
            <Badge variant="outline" className="font-mono text-xs">
              radius: 18px
            </Badge>
          </div>
        </div>
      </section>

      {/* Typography Showcase (English + Bengali) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-terracotta" />
          <h2 className="text-xl font-bold text-brand-charcoal">
            Bilingual Typography & Localization
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-[14px] border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="default">Manrope (Latin)</Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  UI & Headings
                </span>
              </div>
              <CardTitle className="text-xl pt-2">
                Digital Hospitality Built for Speed
              </CardTitle>
              <CardDescription>
                Clean geometry engineered for readability across high-volume cafe counters and handheld waiter terminals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-brand-charcoal">
              <p className="font-medium">
                Live Pricing Sample: <span className="text-brand-forest font-bold">{formatBDT(850)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Formatted using Bangladeshi Taka standard utility (৳ BDT).
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[14px] border-border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="accent">Hind Siliguri (বাংলা)</Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  Bengali Support
                </span>
              </div>
              <CardTitle className="font-bengali text-2xl pt-2 font-bold text-brand-forest">
                স্মার্ট কিউআর অর্ডারিং ও ক্যাফে পিওএস
              </CardTitle>
              <CardDescription className="font-bengali text-sm text-brand-charcoal/90">
                গ্রাহকরা টেবিল থেকেই কিউআর কোড স্ক্যান করে মেনু দেখতে ও পছন্দের খাবার অর্ডার করতে পারবেন কোনো রকম অপেক্ষা ছাড়াই।
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 font-bengali text-sm text-brand-charcoal">
              <p className="font-semibold">
                পেমেন্ট বিকল্প: বিকাশ, নগদ, ক্যাশ ও কার্ড
              </p>
              <p className="text-xs font-sans text-muted-foreground">
                Strict font fallback integration via Next.js Google Fonts optimization.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Interactive shadcn/ui Primitives Verification */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand-forest" />
            <h2 className="text-xl font-bold text-brand-charcoal">
              Phase 0 UI Primitives Verification
            </h2>
          </div>
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            All 10 Primitives Operational
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls & Inputs */}
          <Card className="rounded-[14px] border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Interactive Controls</CardTitle>
              <CardDescription>
                Testing Input, Select, Switch, and Sonner Toast notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-charcoal uppercase tracking-wider">
                  Test Table Identifier (Input: 10px radius)
                </label>
                <Input
                  value={testTableNum}
                  onChange={(e) => setTestTableNum(e.target.value)}
                  placeholder="e.g. Table 04"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-charcoal uppercase tracking-wider">
                  Branch Selection (Select: 10px radius)
                </label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gulshan-2">Dhaka • Gulshan 2 Flagship</SelectItem>
                    <SelectItem value="banani-11">Dhaka • Banani 11 Cafe</SelectItem>
                    <SelectItem value="dhanmondi-27">Dhaka • Dhanmondi 27</SelectItem>
                    <SelectItem value="uttara-sec-3">Dhaka • Uttara Sector 3</SelectItem>
                    <SelectItem value="chattogram-gEC">Chattogram • GEC Circle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-[10px] bg-secondary/40 border border-border">
                <div className="space-y-0.5">
                  <span className="text-sm font-medium text-brand-charcoal">
                    Live QR Ordering Active
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Accept customer dine-in orders in real-time
                  </p>
                </div>
                <Switch
                  checked={isLiveOrdering}
                  onCheckedChange={setIsLiveOrdering}
                />
              </div>

              <div className="pt-2">
                <Button
                  onClick={triggerToast}
                  variant="accent"
                  className="w-full gap-2"
                >
                  <Bell className="w-4 h-4" /> Trigger Toast Notification (Sonner)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dialogs, Sheets & Modals */}
          <Card className="rounded-[14px] border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Modals & Overlays</CardTitle>
              <CardDescription>
                Verifying Dialog (18px modal radius standard) and Sheet slide-over drawer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-[10px] bg-secondary/30 space-y-2">
                <p className="text-sm font-medium text-brand-forest">
                  Modal Standards Compliance:
                </p>
                <p className="text-xs text-brand-charcoal/80">
                  Every dialog and floating modal adheres to the strict 18px radius standard with subtle backdrop blur.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="default" className="w-full gap-2">
                      <Shield className="w-4 h-4" /> Open Dialog (18px)
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Coffee className="w-5 h-5 text-brand-forest" />
                        CaféFlow BD Modal Standard
                      </DialogTitle>
                      <DialogDescription>
                        This modal implements our strict 18px border radius standard (`rounded-[18px]`) with smooth entrance animation and backdrop blur.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3 text-sm text-brand-charcoal">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Active Tenant:</span>
                        <span className="font-semibold">Gulshan 2 Flagship</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Currency:</span>
                        <span className="font-semibold">Bangladeshi Taka (BDT)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Security:</span>
                        <span className="font-semibold text-emerald-700">Row Level Security Enforced</span>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="default">Acknowledge</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full gap-2">
                      <Smartphone className="w-4 h-4" /> Open Drawer (Sheet)
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle className="text-brand-forest">
                        Mobile Order Cart Preview
                      </SheetTitle>
                      <SheetDescription>
                        Slide-over sheet component ready for customer cart & order review.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-6 space-y-4">
                      <div className="p-4 rounded-[12px] bg-secondary/50 space-y-1">
                        <p className="font-semibold text-sm">Table #{testTableNum}</p>
                        <p className="text-xs text-muted-foreground">
                          Branch: {selectedBranch}
                        </p>
                      </div>
                      <p className="text-sm font-bengali text-brand-charcoal">
                        অর্ডারের প্রস্তুতি চলছে... ফেজ ২-তে ডিজিটাল কিউআর কার্ট সক্রিয় হবে।
                      </p>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Button Variant Showcase */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-brand-charcoal uppercase tracking-wider block mb-2">
                  Button Style Variants
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="default">Forest</Button>
                  <Button size="sm" variant="accent">Terracotta</Button>
                  <Button size="sm" variant="secondary">Secondary</Button>
                  <Button size="sm" variant="outline">Outline</Button>
                  <Button size="sm" variant="ghost">Ghost</Button>
                  <Button size="sm" variant="destructive">Destructive</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Component Demonstration */}
        <Card className="rounded-[14px] border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">System Architecture Specs</CardTitle>
            <CardDescription>
              Tabs component with modular structure insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="stack">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="stack">Tech Stack</TabsTrigger>
                <TabsTrigger value="supabase">Supabase SSR</TabsTrigger>
                <TabsTrigger value="tenancy">Multi-Tenancy</TabsTrigger>
              </TabsList>
              <TabsContent value="stack" className="mt-4 space-y-2 text-sm text-brand-charcoal">
                <div className="p-4 rounded-[10px] bg-secondary/20 border border-border space-y-1">
                  <p className="font-semibold text-brand-forest">Next.js 15 App Router & Strict TypeScript</p>
                  <p className="text-xs text-muted-foreground">
                    Next-generation server components, zero `any` types, with tailored Tailwind CSS and Radix UI primitives.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="supabase" className="mt-4 space-y-2 text-sm text-brand-charcoal">
                <div className="p-4 rounded-[10px] bg-secondary/20 border border-border space-y-1">
                  <p className="font-semibold text-brand-forest">Separated Browser, Server & Middleware Clients</p>
                  <p className="text-xs text-muted-foreground">
                    `createBrowserClient` for client views, `createServerClient` with Next.js 15 async cookies for RSC/actions, and cookie refresh in middleware.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="tenancy" className="mt-4 space-y-2 text-sm text-brand-charcoal">
                <div className="p-4 rounded-[10px] bg-secondary/20 border border-border space-y-1">
                  <p className="font-semibold text-brand-forest">Isolated Tenant Routing & Database RLS</p>
                  <p className="text-xs text-muted-foreground">
                    Isolated customer routes under `/r/[slug]` with row-level security policies enforcing tenant isolation.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      {/* Modular Route Navigation Grid */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-brand-forest" />
          <h2 className="text-xl font-bold text-brand-charcoal">
            Modular Route Architecture
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/r/dhabba-gulshan?t=demo-table-04"
            className="p-4 rounded-[14px] bg-card border border-border shadow-sm hover:border-brand-terracotta transition-colors group block"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mb-2">
              <span>Customer QR (Table 04)</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="font-semibold text-brand-forest text-sm">/r/[slug]?t=demo-table-04</p>
            <p className="text-xs text-muted-foreground mt-1">
              Table QR menu & digital ordering
            </p>
          </Link>

          <Link
            href="/dashboard"
            className="p-4 rounded-[14px] bg-card border border-border shadow-sm hover:border-brand-forest transition-colors group block"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mb-2">
              <span>Tenant App</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="font-semibold text-brand-forest text-sm">/dashboard</p>
            <p className="text-xs text-muted-foreground mt-1">
              POS, orders, & live kitchen
            </p>
          </Link>

          <Link
            href="/login"
            className="p-4 rounded-[14px] bg-card border border-border shadow-sm hover:border-brand-forest transition-colors group block"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mb-2">
              <span>Auth Portal</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="font-semibold text-brand-forest text-sm">/login</p>
            <p className="text-xs text-muted-foreground mt-1">
              Owner & staff authentication
            </p>
          </Link>

          <a
            href="/api/v1/health"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-[14px] bg-card border border-border shadow-sm hover:border-brand-forest transition-colors group block"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mb-2">
              <span>System API</span>
              <ExternalLink className="w-4 h-4" />
            </div>
            <p className="font-semibold text-brand-forest text-sm">/api/v1/health</p>
            <p className="text-xs text-muted-foreground mt-1">
              Live JSON readiness endpoint
            </p>
          </a>
        </div>
      </section>
    </div>
  );
}
