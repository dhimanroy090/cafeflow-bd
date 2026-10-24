import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  ChefHat,
  Receipt,
  QrCode,
  ArrowRight,
  ArrowLeft,
  Utensils,
  BarChart3,
  Users,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { DEMO_RESTAURANT } from "@/features/menu/demo-menu-data";

export default function DashboardPage() {
  const isSuspended = DEMO_RESTAURANT.subscription_status === "suspended";

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-10 max-w-5xl mx-auto flex flex-col justify-center space-y-5 sm:space-y-6">
      {/* Suspended Notice Banner (Server-Enforced Entitlement) */}
      {isSuspended && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-400 text-red-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in slide-in-from-top">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm">Restaurant Subscription Suspended</p>
              <p className="text-xs text-red-900/80">
                New customer QR orders and counter tickets are temporarily blocked. Historical sales and reports remain readable.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs shrink-0">
            <Link href="/dashboard/billing">Renew via bKash / Bank</Link>
          </Button>
        </div>
      )}

      {/* Overview Card */}
      <Card className="shadow-lg border-border bg-card">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="accent" className="text-xs font-semibold">
                Manager & Staff Portal
              </Badge>
              <Link href="/super-admin">
                <Badge variant="outline" className="text-[10px] text-muted-foreground hover:bg-secondary flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-brand-forest" />
                  Super-Admin
                </Badge>
              </Link>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {DEMO_RESTAURANT.name}
            </span>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-extrabold text-brand-forest flex items-center gap-2.5">
            <LayoutDashboard className="w-7 h-7 text-brand-terracotta" />
            Restaurant Live Operations Hub
          </CardTitle>
          <CardDescription className="text-sm text-brand-charcoal/80">
            Realtime operations suite for high-volume Bangladesh cafes and dining halls. Select a station below:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Row 1: Core Operations */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Quick Counter POS Launcher */}
            <Link
              href="/dashboard/pos"
              className="p-5 rounded-[14px] bg-secondary/30 border border-border/80 hover:border-brand-forest hover:bg-secondary/50 transition-all group flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-[10px] bg-brand-forest text-brand-cream flex items-center justify-center shadow-sm">
                  <Utensils className="w-5 h-5 text-brand-terracotta" />
                </div>
                <Badge variant="accent" className="text-xs">
                  Fast Billing
                </Badge>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-brand-forest group-hover:text-brand-terracotta transition-colors flex items-center gap-1.5">
                  Counter POS
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Touch-friendly manual order entry, table tabs, takeaway, flat/% discounts, and thermal receipt printing.
                </p>
              </div>
            </Link>

            {/* KDS Launcher */}
            <Link
              href="/dashboard/kitchen"
              className="p-5 rounded-[14px] bg-secondary/30 border border-border/80 hover:border-brand-forest hover:bg-secondary/50 transition-all group flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-[10px] bg-brand-forest text-brand-cream flex items-center justify-center shadow-sm">
                  <ChefHat className="w-5 h-5 text-brand-terracotta" />
                </div>
                <Badge variant="default" className="text-xs">
                  Tablet Ready
                </Badge>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-brand-forest group-hover:text-brand-terracotta transition-colors flex items-center gap-1.5">
                  Kitchen KDS
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Mounted tablet monitor with live elapsed timers (amber/red alert badges), sound chimes, and single-tap workflow.
                </p>
              </div>
            </Link>

            {/* Live Orders Launcher */}
            <Link
              href="/dashboard/orders"
              className="p-5 rounded-[14px] bg-secondary/30 border border-border/80 hover:border-brand-forest hover:bg-secondary/50 transition-all group flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-[10px] bg-brand-forest text-brand-cream flex items-center justify-center shadow-sm">
                  <Receipt className="w-5 h-5 text-brand-terracotta" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  Live Queue
                </Badge>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-brand-forest group-hover:text-brand-terracotta transition-colors flex items-center gap-1.5">
                  Live Orders
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Verify QR tickets, table tab merging, settle bills with cash change calculator, and 1-click thermal KOT/receipts.
                </p>
              </div>
            </Link>
          </div>

          {/* Row 2: Management & Reporting */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sales & Daily Closing Reports */}
            <Link
              href="/dashboard/reports"
              className="p-5 rounded-[14px] bg-card border border-border/80 hover:border-brand-forest hover:bg-muted/40 transition-all group flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-[10px] bg-emerald-800 text-brand-cream flex items-center justify-center shadow-sm">
                  <BarChart3 className="w-5 h-5 text-emerald-300" />
                </div>
                <Badge variant="outline" className="text-xs">
                  Nightly Closing
                </Badge>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-brand-forest group-hover:text-brand-terracotta transition-colors flex items-center gap-1.5">
                  Sales Reports
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Reconcile Cash drawer, bKash & Nagad merchant balances, view top dishes, and export accountant CSVs.
                </p>
              </div>
            </Link>

            {/* Staff & Role Management */}
            <Link
              href="/dashboard/settings/staff"
              className="p-5 rounded-[14px] bg-card border border-border/80 hover:border-brand-forest hover:bg-muted/40 transition-all group flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-[10px] bg-brand-forest text-brand-cream flex items-center justify-center shadow-sm">
                  <Users className="w-5 h-5 text-brand-terracotta" />
                </div>
                <Badge variant="outline" className="text-xs">
                  RBAC Roles
                </Badge>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-brand-forest group-hover:text-brand-terracotta transition-colors flex items-center gap-1.5">
                  Staff Management
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage owner, manager, cashier, and kitchen roles with strict granular station access limits.
                </p>
              </div>
            </Link>

            {/* Subscription & Billing */}
            <Link
              href="/dashboard/billing"
              className="p-5 rounded-[14px] bg-card border border-border/80 hover:border-brand-forest hover:bg-muted/40 transition-all group flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-[10px] bg-brand-forest text-brand-cream flex items-center justify-center shadow-sm">
                  <CreditCard className="w-5 h-5 text-brand-terracotta" />
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {DEMO_RESTAURANT.subscription_plan}
                </Badge>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-brand-forest group-hover:text-brand-terracotta transition-colors flex items-center gap-1.5">
                  Plan & Billing
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  View subscription validity, submit bKash/Bank renewal payment proofs, and compare growth tiers.
                </p>
              </div>
            </Link>
          </div>

          {/* Customer QR & Table Stand Generator Launcher */}
          <div className="p-4 rounded-[12px] bg-brand-forest/5 border border-brand-forest/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-brand-forest text-brand-cream flex items-center justify-center shrink-0 shadow-sm">
                <QrCode className="w-5 h-5 text-brand-terracotta" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-forest">
                  Dining Tables &amp; Printable QR Stands
                </p>
                <p className="text-xs text-muted-foreground">
                  View, test, download, and print physical tent cards and scannable QR stands for all tables.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Button asChild className="bg-brand-forest hover:bg-brand-forest-light text-brand-cream text-xs font-bold gap-1 shadow-sm flex-1 sm:flex-none">
                <Link href="/dashboard/tables">
                  <QrCode className="w-3.5 h-3.5 mr-1" />
                  View All QR Stands
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="text-xs gap-1 border-brand-forest/30 flex-1 sm:flex-none">
                <Link href="/r/dhabba-gulshan?t=demo-table-04" target="_blank">
                  Simulate Table 04 <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          <Button asChild variant="ghost" className="w-full text-xs text-muted-foreground">
            <Link href="/" className="inline-flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to System Showcase
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
