"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChefHat,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  Coffee,
  Sparkles,
  ArrowLeft,
  Maximize2,
  Minimize2,
  PlusCircle,
  Flame,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLiveOrders } from "@/features/orders/use-live-orders";
import { DEMO_RESTAURANT } from "@/features/menu/demo-menu-data";
import { toast } from "sonner";
import type { DashboardOrderWithItems } from "@/lib/orders/memory-store";

function getElapsedMinutes(createdAt: string): number {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
}

function ElapsedTimerBadge({ createdAt }: { createdAt: string }) {
  const [mounted, setMounted] = useState(false);
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    setMounted(true);
    setMinutes(getElapsedMinutes(createdAt));
    const timer = setInterval(() => {
      setMinutes(getElapsedMinutes(createdAt));
    }, 15000); // re-evaluate every 15s
    return () => clearInterval(timer);
  }, [createdAt]);

  if (!mounted) {
    return (
      <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 gap-1 text-muted-foreground" suppressHydrationWarning>
        <Clock className="w-3 h-3" />
        ...
      </Badge>
    );
  }

  if (minutes >= 15) {
    return (
      <Badge className="bg-red-600 text-white font-mono text-xs px-2 py-0.5 animate-pulse gap-1" suppressHydrationWarning>
        <AlertTriangle className="w-3 h-3" />
        {minutes}m ago (Urgent)
      </Badge>
    );
  }

  if (minutes >= 10) {
    return (
      <Badge className="bg-amber-600 text-white font-mono text-xs px-2 py-0.5 gap-1" suppressHydrationWarning>
        <Clock className="w-3 h-3" />
        {minutes}m ago
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-muted-foreground font-mono text-xs px-2 py-0.5 gap-1 border-border">
      <Clock className="w-3 h-3" />
      {minutes}m ago
    </Badge>
  );
}

function KDSCard({
  order,
  onAdvance,
  isLocked,
}: {
  order: DashboardOrderWithItems;
  onAdvance: () => void;
  isLocked: boolean;
}) {
  const elapsedMinutes = getElapsedMinutes(order.created_at);
  const isUrgent = elapsedMinutes >= 15;
  const isDelayed = elapsedMinutes >= 10 && elapsedMinutes < 15;

  let borderColor = "border-border";
  if (isUrgent) borderColor = "border-red-500 ring-2 ring-red-500/30";
  else if (isDelayed) borderColor = "border-amber-500 ring-1 ring-amber-500/30";
  else if (order.status === "preparing") borderColor = "border-brand-terracotta/70";
  else if (order.status === "ready") borderColor = "border-emerald-600/70";

  return (
    <Card className={`rounded-[14px] bg-card text-card-foreground shadow-md transition-all flex flex-col justify-between ${borderColor}`}>
      <CardHeader className="p-4 pb-3 border-b border-border/80 space-y-2 bg-secondary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-extrabold text-brand-forest">
              {order.order_number}
            </span>
            <Badge variant="accent" className="font-bold text-xs">
              {order.tableLabel}
            </Badge>
          </div>
          <ElapsedTimerBadge createdAt={order.created_at} />
        </div>

        {order.customer_name && (
          <p className="text-xs text-brand-charcoal font-medium">
            Guest: {order.customer_name}
          </p>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        {/* Line Items */}
        <div className="space-y-2.5 divide-y divide-border/60">
          {order.items.map((item, idx) => {
            const addons = (item.addons_snapshot as Array<{ name: string; price: number }>) || [];
            return (
              <div key={item.id || idx} className={idx > 0 ? "pt-2.5" : ""}>
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-[6px] bg-brand-forest text-brand-cream font-bold text-xs flex items-center justify-center shrink-0">
                    {item.quantity}x
                  </span>
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-extrabold text-sm text-brand-charcoal leading-tight">
                      {item.item_name_snapshot}
                    </p>
                    {item.variant_name_snapshot && (
                      <p className="text-xs text-muted-foreground font-medium">
                        Size: {item.variant_name_snapshot}
                      </p>
                    )}
                    {addons.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {addons.map((a, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-[10px] bg-brand-terracotta/15 text-brand-terracotta border-brand-terracotta/30 py-0 px-1.5 font-semibold"
                          >
                            +{a.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {item.item_notes && (
                      <p className="text-xs text-amber-800 bg-amber-50 rounded-[6px] p-1.5 mt-1 font-medium border border-amber-200/60">
                        Note: &ldquo;{item.item_notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Special Notes */}
        {order.special_notes && (
          <div className="p-2 rounded-[8px] bg-secondary/60 text-xs text-brand-charcoal border border-border italic">
            &ldquo;{order.special_notes}&rdquo;
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {order.status === "pending" || order.status === "accepted" || order.status === "unconfirmed" ? (
            <Button
              type="button"
              variant="default"
              size="lg"
              disabled={isLocked}
              onClick={onAdvance}
              className="w-full gap-2 font-bold text-sm bg-brand-forest hover:bg-brand-forest-light h-11 shadow"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Preparing
            </Button>
          ) : order.status === "preparing" ? (
            <Button
              type="button"
              variant="accent"
              size="lg"
              disabled={isLocked}
              onClick={onAdvance}
              className="w-full gap-2 font-bold text-sm bg-brand-terracotta hover:bg-brand-terracotta-light text-white h-11 shadow"
            >
              <Check className="w-4 h-4" />
              Mark Ready for Service
            </Button>
          ) : order.status === "ready" ? (
            <Button
              type="button"
              variant="default"
              size="lg"
              disabled={isLocked}
              onClick={onAdvance}
              className="w-full gap-2 font-bold text-sm bg-emerald-700 hover:bg-emerald-800 text-white h-11 shadow"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Served at Table
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function KDSScreen() {
  const {
    orders,
    connectionStatus,
    isAudioUnlocked,
    unlockAudio,
    updateOrderStatus,
    actionLock,
    refetch,
  } = useLiveOrders({
    restaurantId: DEMO_RESTAURANT.id,
    enableAudioChime: true,
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [mobileColumn, setMobileColumn] = useState<"all" | "new" | "preparing" | "ready">("all");

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleSimulateOrder = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/v1/dashboard/orders", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Test Order Injected", {
          description: `${data.order.order_number} sent to Kitchen Display`,
        });
        refetch();
      }
    } catch {
      toast.error("Failed to inject simulated order");
    } finally {
      setIsSimulating(false);
    }
  };

  // Split into 3 columns
  const newOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "accepted" || o.status === "unconfirmed"
  );
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  return (
    <div className="min-h-screen bg-brand-cream text-brand-charcoal flex flex-col">
      {/* Audio Unlock Banner (Crucial for browser autoplay restrictions) */}
      {!isAudioUnlocked && (
        <div className="bg-brand-forest text-brand-cream px-4 py-3 shadow-md flex items-center justify-between gap-4 sticky top-0 z-50 animate-in slide-in-from-top">
          <div className="flex items-center gap-2.5">
            <VolumeX className="w-5 h-5 text-brand-terracotta shrink-0 animate-bounce" />
            <div>
              <p className="font-extrabold text-sm leading-tight">
                Kitchen Sound Alert Restricted by Browser
              </p>
              <p className="text-xs text-brand-cream/80">
                Click below to unlock live kitchen chimes for incoming QR orders.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={unlockAudio}
            className="font-bold text-xs shrink-0 shadow-sm"
          >
            Click to Start Live Order Screen & Enable Sound Alerts
          </Button>
        </div>
      )}

      {/* KDS Header Bar */}
      <header className="border-b border-border/80 bg-brand-cream/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-[10px] bg-card border border-border flex items-center justify-center text-brand-forest hover:bg-secondary/40 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-[10px] bg-brand-forest text-brand-cream flex items-center justify-center shrink-0">
              <ChefHat className="w-5 h-5 text-brand-terracotta" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm sm:text-lg text-brand-forest leading-tight truncate">
                Kitchen Display (KDS)
              </h1>
              <p className="text-[11px] text-muted-foreground font-mono truncate">
                {DEMO_RESTAURANT.name} • Live Screen
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicators & Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Bangladesh Network Resilience Connection Badge */}
          {connectionStatus === "connected" ? (
            <Badge variant="outline" className="gap-1.5 py-1 px-2 sm:px-2.5 border-emerald-600/30 text-emerald-800 bg-emerald-50 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live Connected</span>
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1.5 py-1 px-2 sm:px-2.5 text-xs animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reconnecting (25s Polling Active)...</span>
            </Badge>
          )}

          {/* Sound State Toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={unlockAudio}
            className={`gap-1.5 text-xs h-9 px-2.5 ${
              isAudioUnlocked
                ? "border-emerald-600/40 text-emerald-800 bg-emerald-50/50"
                : "border-amber-500/50 text-amber-900 bg-amber-50"
            }`}
          >
            {isAudioUnlocked ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Sound On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Sound Muted</span>
              </>
            )}
          </Button>

          {/* Quick link to Counter POS */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="text-xs h-9 gap-1.5 text-brand-forest hover:bg-secondary/40 hidden md:inline-flex"
          >
            <Link href="/dashboard/pos">
              <Utensils className="w-3.5 h-3.5 text-brand-terracotta" />
              Counter POS
            </Link>
          </Button>

          {/* Quick Order Injection Simulator */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSimulating}
            onClick={handleSimulateOrder}
            className="text-xs h-9 gap-1.5 text-brand-forest hover:bg-secondary/40 hidden sm:inline-flex"
          >
            <PlusCircle className="w-3.5 h-3.5 text-brand-terracotta" />
            + Test Order
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-9 w-9 text-muted-foreground hover:text-brand-charcoal"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* Mobile Station Queue Filter Tabs (< md) */}
      <div className="md:hidden bg-card border-b border-border p-2 px-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <Button
          type="button"
          variant={mobileColumn === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setMobileColumn("all")}
          className={`text-xs font-bold h-8 shrink-0 rounded-full ${
            mobileColumn === "all" ? "bg-brand-forest text-brand-cream" : ""
          }`}
        >
          All ({orders.length})
        </Button>
        <Button
          type="button"
          variant={mobileColumn === "new" ? "default" : "outline"}
          size="sm"
          onClick={() => setMobileColumn("new")}
          className={`text-xs font-bold h-8 shrink-0 rounded-full ${
            mobileColumn === "new" ? "bg-brand-forest text-brand-cream" : ""
          }`}
        >
          New ({newOrders.length})
        </Button>
        <Button
          type="button"
          variant={mobileColumn === "preparing" ? "default" : "outline"}
          size="sm"
          onClick={() => setMobileColumn("preparing")}
          className={`text-xs font-bold h-8 shrink-0 rounded-full ${
            mobileColumn === "preparing" ? "bg-brand-terracotta text-white" : "text-brand-terracotta"
          }`}
        >
          Preparing ({preparingOrders.length})
        </Button>
        <Button
          type="button"
          variant={mobileColumn === "ready" ? "default" : "outline"}
          size="sm"
          onClick={() => setMobileColumn("ready")}
          className={`text-xs font-bold h-8 shrink-0 rounded-full ${
            mobileColumn === "ready" ? "bg-emerald-700 text-white" : "text-emerald-700"
          }`}
        >
          Ready ({readyOrders.length})
        </Button>
      </div>

      {/* 3-Column KDS Layout */}
      <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto">
        {/* Column 1: New / Accepted */}
        <section
          className={`flex flex-col space-y-3 ${
            mobileColumn !== "all" && mobileColumn !== "new" ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-3 rounded-[12px] bg-secondary/50 border border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-forest" />
              <h2 className="font-extrabold text-sm text-brand-forest uppercase tracking-wider">
                New / Accepted
              </h2>
            </div>
            <Badge variant="default" className="font-mono text-xs">
              {newOrders.length}
            </Badge>
          </div>

          <div className="space-y-4 flex-1">
            {newOrders.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-border rounded-[14px] text-muted-foreground text-xs space-y-1">
                <Coffee className="w-6 h-6 mx-auto opacity-40 mb-1" />
                <p className="font-semibold">No New Orders</p>
                <p>New QR table orders will appear here automatically.</p>
              </div>
            ) : (
              newOrders.map((order) => (
                <KDSCard
                  key={order.id}
                  order={order}
                  isLocked={actionLock.has(order.id)}
                  onAdvance={() => updateOrderStatus(order.id, "preparing")}
                />
              ))
            )}
          </div>
        </section>

        {/* Column 2: Preparing */}
        <section
          className={`flex flex-col space-y-3 ${
            mobileColumn !== "all" && mobileColumn !== "preparing" ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-3 rounded-[12px] bg-brand-terracotta/10 border border-brand-terracotta/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-brand-terracotta animate-pulse" />
              <h2 className="font-extrabold text-sm text-brand-terracotta uppercase tracking-wider">
                Preparing
              </h2>
            </div>
            <Badge variant="accent" className="font-mono text-xs font-bold">
              {preparingOrders.length}
            </Badge>
          </div>

          <div className="space-y-4 flex-1">
            {preparingOrders.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-border rounded-[14px] text-muted-foreground text-xs space-y-1">
                <Flame className="w-6 h-6 mx-auto opacity-40 mb-1" />
                <p className="font-semibold">Nothing in Preparation</p>
                <p>Advance accepted orders when cooking/brewing starts.</p>
              </div>
            ) : (
              preparingOrders.map((order) => (
                <KDSCard
                  key={order.id}
                  order={order}
                  isLocked={actionLock.has(order.id)}
                  onAdvance={() => updateOrderStatus(order.id, "ready")}
                />
              ))
            )}
          </div>
        </section>

        {/* Column 3: Ready for Pickup / Table Service */}
        <section
          className={`flex flex-col space-y-3 ${
            mobileColumn !== "all" && mobileColumn !== "ready" ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-3 rounded-[12px] bg-emerald-50 border border-emerald-600/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h2 className="font-extrabold text-sm text-emerald-800 uppercase tracking-wider">
                Ready for Service
              </h2>
            </div>
            <Badge variant="success" className="font-mono text-xs font-bold">
              {readyOrders.length}
            </Badge>
          </div>

          <div className="space-y-4 flex-1">
            {readyOrders.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-border rounded-[14px] text-muted-foreground text-xs space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto opacity-40 mb-1" />
                <p className="font-semibold">No Prepared Orders Waiting</p>
                <p>Items marked ready are dispatched to dining tables.</p>
              </div>
            ) : (
              readyOrders.map((order) => (
                <KDSCard
                  key={order.id}
                  order={order}
                  isLocked={actionLock.has(order.id)}
                  onAdvance={() => updateOrderStatus(order.id, "served")}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
