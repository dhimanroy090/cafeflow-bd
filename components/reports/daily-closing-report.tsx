"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Calendar,
  Download,
  CheckCircle2,
  XCircle,
  Banknote,
  Smartphone,
  CreditCard,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  BarChart3,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useLiveOrders } from "@/features/orders/use-live-orders";
import { DEMO_RESTAURANT } from "@/features/menu/demo-menu-data";
import { formatBDT } from "@/lib/utils";
import { toast } from "sonner";

export type DateFilterPreset = "today" | "yesterday" | "last7days" | "thismonth" | "all";

export function DailyClosingReportScreen() {
  const { orders } = useLiveOrders({
    restaurantId: DEMO_RESTAURANT.id,
    enableAudioChime: false,
  });

  const [dateFilter, setDateFilter] = useState<DateFilterPreset>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOf7Days = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter((order) => {
      const orderTime = new Date(order.created_at).getTime();

      if (customStartDate || customEndDate) {
        if (customStartDate && orderTime < new Date(customStartDate).getTime()) return false;
        if (customEndDate && orderTime > new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000)
          return false;
        return true;
      }

      switch (dateFilter) {
        case "today":
          return orderTime >= startOfToday;
        case "yesterday":
          return orderTime >= startOfYesterday && orderTime < startOfToday;
        case "last7days":
          return orderTime >= startOf7Days;
        case "thismonth":
          return orderTime >= startOfMonth;
        case "all":
        default:
          return true;
      }
    });
  }, [orders, dateFilter, customStartDate, customEndDate]);

  // Financial KPIs
  const completedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status !== "cancelled");
  }, [filteredOrders]);

  const cancelledOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === "cancelled");
  }, [filteredOrders]);

  const totalRevenue = useMemo(() => {
    return completedOrders.reduce((sum, o) => {
      // If order is paid, count total amount
      if (o.payment_status === "paid") {
        return sum + o.total_amount;
      }
      return sum;
    }, 0);
  }, [completedOrders]);

  const averageOrderValue = useMemo(() => {
    const paidCount = completedOrders.filter((o) => o.payment_status === "paid").length;
    if (paidCount === 0) return 0;
    return Math.round(totalRevenue / paidCount);
  }, [completedOrders, totalRevenue]);

  // Payment Breakdown for Nightly Closing
  const paymentBreakdown = useMemo(() => {
    const cash = { total: 0, count: 0 };
    const bkash = { total: 0, count: 0 };
    const nagad = { total: 0, count: 0 };
    const card = { total: 0, count: 0 };
    const unpaid = { total: 0, count: 0 };

    completedOrders.forEach((o) => {
      if (o.payment_status === "paid") {
        switch (o.payment_method) {
          case "cash":
            cash.total += o.total_amount;
            cash.count++;
            break;
          case "bkash":
            bkash.total += o.total_amount;
            bkash.count++;
            break;
          case "nagad":
            nagad.total += o.total_amount;
            nagad.count++;
            break;
          case "card":
            card.total += o.total_amount;
            card.count++;
            break;
          default:
            cash.total += o.total_amount;
            cash.count++;
            break;
        }
      } else {
        unpaid.total += o.total_amount;
        unpaid.count++;
      }
    });

    return { cash, bkash, nagad, card, unpaid };
  }, [completedOrders]);

  // Top Selling Items
  const topSellingItems = useMemo(() => {
    const itemMap = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();

    completedOrders.forEach((o) => {
      o.items.forEach((item) => {
        const existing = itemMap.get(item.item_name_snapshot) || {
          name: item.item_name_snapshot,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += item.line_total;
        itemMap.set(item.item_name_snapshot, existing);
      });
    });

    return Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);
  }, [completedOrders]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error("No orders to export in this date range");
      return;
    }

    const headers = [
      "Order Number",
      "Date",
      "Time",
      "Type",
      "Table",
      "Customer",
      "Phone",
      "Items Count",
      "Subtotal BDT",
      "Discount BDT",
      "VAT BDT",
      "Service Charge BDT",
      "Grand Total BDT",
      "Status",
      "Payment Status",
      "Payment Method",
      "Payment Reference",
    ];

    const rows = filteredOrders.map((o) => {
      const d = new Date(o.created_at);
      return [
        o.order_number,
        d.toLocaleDateString("en-GB"),
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        o.order_type,
        `"${o.tableLabel || "Counter"}"`,
        `"${o.customer_name || ""}"`,
        `"${o.customer_phone || ""}"`,
        o.items.reduce((s, i) => s + i.quantity, 0),
        o.subtotal.toFixed(2),
        o.discount_amount.toFixed(2),
        o.vat_amount.toFixed(2),
        o.service_charge_amount.toFixed(2),
        o.total_amount.toFixed(2),
        o.status,
        o.payment_status,
        o.payment_method,
        `"${o.payment_reference || ""}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `cafeflow-sales-report-${dateFilter}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Sales report CSV exported successfully");
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-charcoal flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border/80 bg-brand-cream/90 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-[10px] bg-card border border-border flex items-center justify-center text-brand-forest hover:bg-secondary/40 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-brand-forest text-brand-cream flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-brand-terracotta" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-brand-forest leading-tight">
                Sales & Daily Closing Reconciliation
              </h1>
              <p className="text-[11px] text-muted-foreground font-mono">
                {DEMO_RESTAURANT.name} • Nightly Cash & MFS Balance
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-brand-forest/30 text-brand-forest hover:bg-brand-forest/10 font-bold text-xs gap-1.5 h-9"
          >
            <Download className="w-4 h-4 text-brand-terracotta" />
            Export CSV
          </Button>

          <Link href="/dashboard/orders">
            <Button
              variant="default"
              size="sm"
              className="bg-brand-forest hover:bg-brand-forest/90 text-brand-cream text-xs font-bold gap-1 h-9"
            >
              Live Orders <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Date Filter Bar */}
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-terracotta shrink-0" />
            <span className="text-xs font-bold text-brand-forest">Closing Period:</span>
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "last7days", label: "Last 7 Days" },
                { id: "thismonth", label: "This Month" },
                { id: "all", label: "All Time" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setDateFilter(p.id as DateFilterPreset);
                    setCustomStartDate("");
                    setCustomEndDate("");
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    dateFilter === p.id && !customStartDate
                      ? "bg-brand-forest text-brand-cream shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Picker Inputs */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground text-[11px] font-semibold">Custom:</span>
            <Input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="h-8 text-xs w-36 bg-background font-mono"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="h-8 text-xs w-36 bg-background font-mono"
            />
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Total Revenue
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  ৳
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-brand-forest">
                {formatBDT(totalRevenue)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                From settled paid customer bills
              </p>
            </CardContent>
          </Card>

          {/* Completed Orders */}
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Completed Orders
                </span>
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-brand-charcoal">
                {completedOrders.length}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Kitchen tickets prepared & served
              </p>
            </CardContent>
          </Card>

          {/* Average Order Value */}
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Avg Order Value
                </span>
                <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-brand-charcoal">
                {formatBDT(averageOrderValue)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Average ticket size per guest
              </p>
            </CardContent>
          </Card>

          {/* Cancelled Orders */}
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Voided / Cancelled
                </span>
                <span className="w-8 h-8 rounded-lg bg-red-100 text-red-800 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black font-mono text-destructive">
                {cancelledOrders.length}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Logged in audit security trail
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Nightly Cash & MFS Reconciliation Section (CRITICAL FOR BANGLADESH) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-brand-forest flex items-center gap-2">
              <Banknote className="w-5 h-5 text-brand-terracotta" />
              Daily Closing Cash & MFS Wallet Reconciliation
            </h2>
            <Badge variant="outline" className="text-xs font-mono font-bold">
              Nightly Balance Audit
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Cash Drawer */}
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/60 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-700" />
                  Cash in Drawer (নগদ)
                </span>
                <Badge className="bg-emerald-700 text-white font-mono text-[10px]">
                  {paymentBreakdown.cash.count} Bills
                </Badge>
              </div>
              <div>
                <p className="text-2xl font-black font-mono text-emerald-950">
                  {formatBDT(paymentBreakdown.cash.total)}
                </p>
                <p className="text-[11px] text-emerald-800/80 mt-0.5">
                  Physical currency counted in drawer
                </p>
              </div>
            </div>

            {/* bKash Merchant */}
            <div className="p-4 rounded-xl border border-pink-300 bg-pink-50/60 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#E2136E] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#E2136E]" />
                  bKash Merchant
                </span>
                <Badge className="bg-[#E2136E] text-white font-mono text-[10px]">
                  {paymentBreakdown.bkash.count} Trx
                </Badge>
              </div>
              <div>
                <p className="text-2xl font-black font-mono text-pink-950">
                  {formatBDT(paymentBreakdown.bkash.total)}
                </p>
                <p className="text-[11px] text-pink-900/80 mt-0.5">
                  Reconcile with bKash app statement
                </p>
              </div>
            </div>

            {/* Nagad Merchant */}
            <div className="p-4 rounded-xl border border-orange-300 bg-orange-50/60 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#F7941D] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#F7941D]" />
                  Nagad Merchant
                </span>
                <Badge className="bg-[#F7941D] text-white font-mono text-[10px]">
                  {paymentBreakdown.nagad.count} Trx
                </Badge>
              </div>
              <div>
                <p className="text-2xl font-black font-mono text-orange-950">
                  {formatBDT(paymentBreakdown.nagad.total)}
                </p>
                <p className="text-[11px] text-orange-900/80 mt-0.5">
                  Reconcile with Nagad balance
                </p>
              </div>
            </div>

            {/* POS Card Machine */}
            <div className="p-4 rounded-xl border border-indigo-300 bg-indigo-50/60 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-700" />
                  POS Card Terminal
                </span>
                <Badge className="bg-indigo-700 text-white font-mono text-[10px]">
                  {paymentBreakdown.card.count} Swipes
                </Badge>
              </div>
              <div>
                <p className="text-2xl font-black font-mono text-indigo-950">
                  {formatBDT(paymentBreakdown.card.total)}
                </p>
                <p className="text-[11px] text-indigo-900/80 mt-0.5">
                  Match with EDC batch slip total
                </p>
              </div>
            </div>

            {/* Unpaid / Open Tabs */}
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/60 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  Unpaid Open Tabs
                </span>
                <Badge className="bg-amber-600 text-white font-mono text-[10px]">
                  {paymentBreakdown.unpaid.count} Tabs
                </Badge>
              </div>
              <div>
                <p className="text-2xl font-black font-mono text-amber-950">
                  {formatBDT(paymentBreakdown.unpaid.total)}
                </p>
                <p className="text-[11px] text-amber-900/80 mt-0.5">
                  Awaiting table checkout/settlement
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Dishes Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-brand-forest flex items-center gap-2">
              <Coffee className="w-5 h-5 text-brand-terracotta" />
              Top Selling Dishes & Beverages
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              Sorted by popularity
            </span>
          </div>

          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground border-b border-border uppercase font-bold text-[11px]">
                  <tr>
                    <th className="p-3.5">Rank</th>
                    <th className="p-3.5">Menu Item</th>
                    <th className="p-3.5 text-center">Units Sold</th>
                    <th className="p-3.5 text-right">Revenue Generated</th>
                    <th className="p-3.5 text-right">% Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {topSellingItems.map((item, idx) => {
                    const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
                    return (
                      <tr key={item.name} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-bold font-mono text-muted-foreground">
                          #{idx + 1}
                        </td>
                        <td className="p-3.5 font-extrabold text-brand-forest text-sm">
                          {item.name}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {item.quantity} orders
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-brand-charcoal text-sm">
                          {formatBDT(item.revenue)}
                        </td>
                        <td className="p-3.5 text-right font-mono text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                  {topSellingItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No orders completed in the selected date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
