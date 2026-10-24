"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Coffee,
  ChefHat,
  Sparkles,
  ArrowLeft,
  PlusCircle,
  RefreshCw,
  MapPin,
  Receipt,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatBDT } from "@/lib/utils";
import type { OrderStatus } from "@/lib/supabase/database.types";

interface PageProps {
  params: Promise<{ slug: string; trackingToken: string }>;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  orderType: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  vatAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  customerName: string | null;
  createdAt: string;
  tableLabel: string;
  restaurantName: string;
  restaurantSlug: string;
  items: Array<{
    id: string;
    item_name_snapshot: string;
    variant_name_snapshot?: string | null;
    unit_price_snapshot: number;
    quantity: number;
    line_total: number;
    addons_snapshot?: Array<{ name: string; price: number }>;
  }>;
}

const ORDER_STEPS: Array<{ key: OrderStatus; label: string; description: string; icon: React.ElementType }> = [
  { key: "pending", label: "Order Sent", description: "Dispatched to kitchen display", icon: Clock },
  { key: "accepted", label: "Confirmed", description: "Accepted by cafe counter", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", description: "Barista is brewing & crafting", icon: ChefHat },
  { key: "ready", label: "Ready", description: "Freshly prepared for serving", icon: Coffee },
  { key: "served", label: "Served", description: "Enjoy your dining experience", icon: Sparkles },
];

function getStepIndex(status: OrderStatus): number {
  switch (status) {
    case "unconfirmed":
    case "pending":
      return 0;
    case "accepted":
      return 1;
    case "preparing":
      return 2;
    case "ready":
      return 3;
    case "served":
      return 4;
    case "cancelled":
      return -1;
    default:
      return 0;
  }
}

export default function OrderTrackingPage({ params }: PageProps) {
  const { slug, trackingToken } = use(params);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchOrderStatus = React.useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/v1/public/orders/${trackingToken}`);
      const data = await res.json();
      if (res.ok && data.success && data.order) {
        setOrder(data.order);
        setError(null);
      } else {
        setError(data.error || "Order not found.");
      }
    } catch {
      setError("Unable to connect to live tracking server.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [trackingToken]);

  useEffect(() => {
    fetchOrderStatus();

    // Auto-poll status every 10 seconds
    const interval = setInterval(() => {
      fetchOrderStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchOrderStatus]);

  const currentStep = order ? getStepIndex(order.status) : 0;

  return (
    <div className="min-h-screen bg-brand-cream text-brand-charcoal selection:bg-brand-terracotta selection:text-white pb-24">
      {/* Top Header */}
      <header className="border-b border-border/80 bg-brand-cream/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={`/r/${slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-forest hover:text-brand-terracotta transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchOrderStatus(true)}
              disabled={isRefreshing}
              className="text-xs text-muted-foreground hover:text-brand-forest gap-1.5 h-8 px-2.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-forest" />
            <p className="text-sm font-semibold text-brand-charcoal">
              Locating your order status...
            </p>
          </div>
        ) : error || !order ? (
          <Card className="rounded-[18px] border-destructive/30 shadow-md">
            <CardContent className="p-6 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-brand-charcoal">Order Tracking Unavailable</h2>
                <p className="text-xs text-muted-foreground">{error || "Invalid tracking token"}</p>
              </div>
              <Button asChild variant="outline">
                <Link href={`/r/${slug}`}>Return to Restaurant Menu</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Status Hero Card */}
            <Card className="rounded-[18px] border-border shadow-lg bg-card overflow-hidden">
              <CardHeader className="bg-brand-forest text-brand-cream p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="accent" className="font-mono text-xs uppercase tracking-wider font-bold">
                    {order.orderNumber}
                  </Badge>
                  <span className="text-xs text-brand-cream/80 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {order.tableLabel}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-2xl font-extrabold text-brand-cream">
                    {order.status === "cancelled"
                      ? "Order Cancelled"
                      : order.status === "served"
                      ? "Order Served!"
                      : "We're Preparing Your Order"}
                  </CardTitle>
                  <CardDescription className="text-xs text-brand-cream/80 pt-1">
                    {order.restaurantName} • Placed at{" "}
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Visual Step Indicator */}
                {order.status !== "cancelled" ? (
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      Live Kitchen Progress
                    </span>

                    <div className="space-y-3">
                      {ORDER_STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isDone = idx < currentStep;
                        const isCurrent = idx === currentStep;

                        return (
                          <div key={step.key} className="flex items-center gap-3.5">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                isDone
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : isCurrent
                                  ? "bg-brand-terracotta text-white shadow-md ring-4 ring-brand-terracotta/20 animate-pulse"
                                  : "bg-secondary text-muted-foreground/60 border border-border"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm leading-tight font-bold ${
                                  isCurrent
                                    ? "text-brand-terracotta"
                                    : isDone
                                    ? "text-brand-forest font-semibold"
                                    : "text-muted-foreground/60"
                                }`}
                              >
                                {step.label}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {step.description}
                              </p>
                            </div>

                            {isDone && (
                              <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-600/30">
                                Completed
                              </Badge>
                            )}
                            {isCurrent && (
                              <Badge variant="accent" className="text-[10px] font-semibold animate-pulse">
                                In Progress
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-[12px] bg-destructive/10 text-destructive text-sm font-medium">
                    This order has been cancelled by cafe management. Please speak with your server for assistance.
                  </div>
                )}

                {/* Order More Items to This Table Button */}
                <div className="pt-2 border-t border-border/80">
                  <Button
                    asChild
                    variant="default"
                    size="lg"
                    className="w-full gap-2 font-bold shadow-md h-12 text-sm sm:text-base"
                  >
                    <Link href={`/r/${slug}`}>
                      <PlusCircle className="w-5 h-5 text-brand-terracotta" />
                      Order More Items to {order.tableLabel}
                    </Link>
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground pt-1.5">
                    Staying for dessert or another brew? Add items anytime to this table.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Receipt Summary Card */}
            <Card className="rounded-[18px] border-border shadow-sm bg-card">
              <CardHeader className="pb-3 border-b border-border/80">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-brand-terracotta" />
                    Order Summary
                  </CardTitle>
                  <Badge variant="outline" className="text-xs font-mono">
                    Total: {formatBDT(order.totalAmount)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="divide-y divide-border/60">
                  {order.items.map((item, i) => (
                    <div key={item.id || i} className="py-2.5 flex items-start justify-between gap-2 text-xs">
                      <div>
                        <p className="font-bold text-brand-charcoal text-sm">
                          {item.quantity}x {item.item_name_snapshot}
                        </p>
                        {item.variant_name_snapshot && (
                          <p className="text-muted-foreground">Size: {item.variant_name_snapshot}</p>
                        )}
                        {item.addons_snapshot && item.addons_snapshot.length > 0 && (
                          <p className="text-brand-terracotta text-[11px]">
                            +{item.addons_snapshot.map((a) => a.name).join(", ")}
                          </p>
                        )}
                      </div>
                      <span className="font-mono font-bold text-brand-forest text-sm">
                        {formatBDT(item.line_total)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 pt-3 border-t border-border/80 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono text-brand-charcoal">{formatBDT(order.subtotal)}</span>
                  </div>
                  {order.serviceChargeAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Service Charge</span>
                      <span className="font-mono text-brand-charcoal">{formatBDT(order.serviceChargeAmount)}</span>
                    </div>
                  )}
                  {order.vatAmount > 0 && (
                    <div className="flex justify-between">
                      <span>VAT</span>
                      <span className="font-mono text-brand-charcoal">{formatBDT(order.vatAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-brand-forest border-t pt-2">
                    <span>Grand Total</span>
                    <span className="font-mono text-base">{formatBDT(order.totalAmount)}</span>
                  </div>
                </div>

                <div className="p-3 rounded-[10px] bg-secondary/50 text-xs text-brand-charcoal/80 flex items-center justify-between">
                  <span>Payment Status:</span>
                  <Badge variant={order.paymentStatus === "paid" ? "success" : "secondary"}>
                    {order.paymentStatus === "paid" ? "Paid" : "Pay after service"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
