"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Receipt,
  Search,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  Banknote,
  RefreshCw,
  Printer,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLiveOrders } from "@/features/orders/use-live-orders";
import { DEMO_RESTAURANT } from "@/features/menu/demo-menu-data";
import { formatBDT } from "@/lib/utils";
import type { DashboardOrderWithItems } from "@/lib/orders/memory-store";
import { SettlePaymentDialog } from "./settle-payment-dialog";
import {
  ThermalPrintDialog,
  type ThermalPrintMode,
} from "@/components/pos/thermal-receipt";
import { toast } from "sonner";

export function LiveOrdersScreen() {
  const {
    orders,
    loading,
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>("all");

  // State for order cancellation modal
  const [orderToCancel, setOrderToCancel] = useState<DashboardOrderWithItems | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // State for payment settlement modal
  const [orderToPay, setOrderToPay] = useState<DashboardOrderWithItems | null>(null);

  // State for thermal printing modal
  const [printOrder, setPrintOrder] = useState<DashboardOrderWithItems | null>(null);
  const [printMode, setPrintMode] = useState<ThermalPrintMode>("kot");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus =
        selectedStatus === "all" || o.status === selectedStatus;

      const matchesPayment =
        selectedPaymentFilter === "all" || o.payment_status === selectedPaymentFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.order_number.toLowerCase().includes(q) ||
        o.tableLabel.toLowerCase().includes(q) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        (o.customer_phone && o.customer_phone.toLowerCase().includes(q));

      return matchesStatus && matchesPayment && matchesSearch;
    });
  }, [orders, selectedStatus, selectedPaymentFilter, searchQuery]);

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    try {
      await updateOrderStatus(orderToCancel.id, "cancelled", {
        cancellationReason: cancelReason.trim() || "Cancelled by Manager/Cashier",
      });
      toast.success(`Order ${orderToCancel.order_number} cancelled`, {
        description: "Action recorded in security audit logs.",
      });
      setOrderToCancel(null);
      setCancelReason("");
    } catch {
      toast.error("Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSettlementSuccess = (
    settledOrders: DashboardOrderWithItems[],
    printReceipt?: boolean
  ) => {
    refetch();
    setOrderToPay(null);
    if (printReceipt && settledOrders.length > 0) {
      setPrintOrder(settledOrders[0]);
      setPrintMode("bill");
      setIsPrintModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-charcoal flex flex-col">
      {/* Audio Unlock Alert Banner */}
      {!isAudioUnlocked && (
        <div className="bg-brand-forest text-brand-cream px-4 py-3 shadow-md flex items-center justify-between gap-4 sticky top-0 z-50 animate-in slide-in-from-top">
          <div className="flex items-center gap-2.5">
            <VolumeX className="w-5 h-5 text-brand-terracotta shrink-0 animate-bounce" />
            <div>
              <p className="font-extrabold text-sm leading-tight">
                POS Chimes Restricted by Browser Autoplay Policy
              </p>
              <p className="text-xs text-brand-cream/80">
                Click below to enable live audio bells whenever a customer places a table order.
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

      {/* Main Header Bar */}
      <header className="border-b border-border/80 bg-brand-cream/90 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-[10px] bg-card border border-border flex items-center justify-center text-brand-forest hover:bg-secondary/40 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-[10px] bg-brand-forest text-brand-cream flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-brand-terracotta" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm sm:text-lg text-brand-forest leading-tight truncate">
                Cashier & POS Orders
              </h1>
              <p className="text-[11px] text-muted-foreground font-mono truncate">
                {DEMO_RESTAURANT.name} • Active Tab Queue
              </p>
            </div>
          </div>
        </div>

        {/* Connectivity, Sound & Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {connectionStatus === "connected" ? (
            <Badge variant="outline" className="gap-1.5 py-1 px-2 sm:px-2.5 border-emerald-600/30 text-emerald-800 bg-emerald-50 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live Connected</span>
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1.5 py-1 px-2 sm:px-2.5 text-xs animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reconnecting...</span>
            </Badge>
          )}

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
            {isAudioUnlocked ? <Volume2 className="w-3.5 h-3.5 text-emerald-700" /> : <VolumeX className="w-3.5 h-3.5 text-amber-700" />}
            <span className="hidden sm:inline">{isAudioUnlocked ? "Sound Active" : "Enable Sound"}</span>
          </Button>

          <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 border-brand-forest/30 text-brand-forest hover:bg-brand-forest/10 font-bold hidden md:inline-flex">
            <Link href="/dashboard/pos">
              <Utensils className="w-3.5 h-3.5 text-brand-terracotta" />
              Counter POS
            </Link>
          </Button>

          <Button asChild variant="default" size="sm" className="h-9 gap-1.5 bg-brand-forest px-3">
            <Link href="/dashboard/kitchen">
              <span className="hidden sm:inline">Open KDS</span>
              <span className="sm:hidden">KDS</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* Filter Controls Bar */}
        <div className="p-3.5 sm:p-4 rounded-[14px] bg-card border border-border shadow-sm space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order #, table, customer..."
                className="pl-9 text-xs h-9 bg-background/50"
              />
            </div>

            {/* Quick Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar w-full sm:w-auto">
              {[
                { id: "all", label: "All Active" },
                { id: "pending", label: "Pending Verification" },
                { id: "preparing", label: "In Kitchen" },
                { id: "ready", label: "Ready" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedStatus === tab.id
                      ? "bg-brand-forest text-brand-cream shadow-sm"
                      : "bg-secondary/40 text-brand-charcoal hover:bg-secondary/70 border border-border"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Payment Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-muted-foreground font-medium hidden lg:inline">
                Payment:
              </span>
              <button
                type="button"
                onClick={() => setSelectedPaymentFilter(selectedPaymentFilter === "unpaid" ? "all" : "unpaid")}
                className={`px-2.5 py-1.5 rounded-[8px] text-xs font-semibold border transition-colors ${
                  selectedPaymentFilter === "unpaid"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "border-border text-brand-charcoal hover:bg-secondary/40"
                }`}
              >
                Unpaid Tabs Only
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table / Cards */}
        {loading ? (
          <div className="py-24 text-center space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-forest opacity-50" />
            <p className="text-sm font-semibold text-brand-charcoal">Loading active orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-[18px] space-y-2">
            <Receipt className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="font-bold text-brand-charcoal text-base">No Matching Orders Found</p>
            <p className="text-xs text-muted-foreground">Adjust your filters or inject a test order.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isLocked = actionLock.has(order.id);
              const isPendingVerification = order.status === "pending" || order.status === "unconfirmed";

              return (
                <Card
                  key={order.id}
                  className={`rounded-[14px] bg-card border shadow-sm transition-all overflow-hidden ${
                    isPendingVerification ? "border-brand-terracotta ring-1 ring-brand-terracotta/30" : "border-border"
                  }`}
                >
                  <CardContent className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    {/* Order Metadata */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-lg font-extrabold text-brand-forest">
                          {order.order_number}
                        </span>
                        <Badge variant="accent" className="font-bold text-xs">
                          {order.tableLabel}
                        </Badge>
                        <Badge
                          variant={
                            order.status === "ready"
                              ? "success"
                              : order.status === "preparing"
                              ? "accent"
                              : "default"
                          }
                          className="capitalize text-xs font-semibold"
                        >
                          {order.status}
                        </Badge>
                        <Badge
                          variant={order.payment_status === "paid" ? "success" : "outline"}
                          className={`text-xs ${
                            order.payment_status === "unpaid" ? "border-amber-600/50 text-amber-800 bg-amber-50" : ""
                          }`}
                        >
                          {order.payment_status === "paid" ? "Paid" : "Unpaid Tab"}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Items Summary */}
                      <div className="text-xs text-brand-charcoal space-y-0.5">
                        <p className="font-medium">
                          {order.items.map((i) => `${i.quantity}x ${i.item_name_snapshot}`).join(" • ")}
                        </p>
                        {order.customer_name && (
                          <p className="text-muted-foreground">
                            Customer: {order.customer_name} {order.customer_phone ? `(${order.customer_phone})` : ""}
                          </p>
                        )}
                        {order.special_notes && (
                          <p className="text-amber-800 italic">
                            &ldquo;{order.special_notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bill Amount */}
                    <div className="text-right shrink-0">
                      <span className="text-xs text-muted-foreground block">Grand Total</span>
                      <span className="text-xl font-extrabold font-mono text-brand-forest">
                        {formatBDT(order.total_amount)}
                      </span>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                      {/* Cashier Accept Button */}
                      {isPendingVerification && (
                        <Button
                          type="button"
                          variant="accent"
                          size="sm"
                          disabled={isLocked}
                          onClick={() => updateOrderStatus(order.id, "accepted")}
                          className="font-bold text-xs bg-brand-terracotta hover:bg-brand-terracotta-light text-white shadow-sm gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accept & Send
                        </Button>
                      )}

                      {/* Settle Payment Button */}
                      {order.payment_status !== "paid" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setOrderToPay(order)}
                          className="font-semibold text-xs border-emerald-600/40 text-emerald-800 hover:bg-emerald-50 gap-1"
                        >
                          <Banknote className="w-3.5 h-3.5 text-emerald-700" /> Settle Bill
                        </Button>
                      )}

                      {/* 1-Click Print KOT */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPrintOrder(order);
                          setPrintMode("kot");
                          setIsPrintModalOpen(true);
                        }}
                        className="text-xs gap-1 border-border hover:bg-muted text-brand-forest"
                        title="Print Kitchen Order Ticket (58/80mm)"
                      >
                        <Printer className="w-3.5 h-3.5 text-brand-terracotta" /> KOT
                      </Button>

                      {/* 1-Click Print Customer Receipt */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPrintOrder(order);
                          setPrintMode("bill");
                          setIsPrintModalOpen(true);
                        }}
                        className="text-xs gap-1 border-border hover:bg-muted text-brand-forest"
                        title="Print Customer Bill Receipt (58/80mm)"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-700" /> Receipt
                      </Button>

                      {/* Cancellation Modal Trigger */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setOrderToCancel(order)}
                        className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Cancellation & Spam Rejection Modal (logs to audit_logs) */}
      <Dialog open={!!orderToCancel} onOpenChange={(open) => !open && setOrderToCancel(null)}>
        <DialogContent className="rounded-[18px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" />
              Cancel Order {orderToCancel?.order_number}
            </DialogTitle>
            <DialogDescription>
              This will remove the ticket from the active kitchen queue and record an immutable entry in the tenant audit log.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-brand-charcoal block">
              Reason for Cancellation (Required for Audit Trail)
            </label>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer walked out, accidental double order, out of stock..."
              className="text-sm"
              required
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOrderToCancel(null)}
              disabled={isCancelling}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isCancelling || !cancelReason.trim()}
              onClick={handleConfirmCancel}
              className="gap-1.5"
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancellation & Log"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Settlement Modal */}
      <SettlePaymentDialog
        order={orderToPay}
        allOrders={orders}
        isOpen={!!orderToPay}
        onClose={() => setOrderToPay(null)}
        onSuccess={handleSettlementSuccess}
      />

      {/* Thermal Print Modal */}
      <ThermalPrintDialog
        order={printOrder}
        mode={printMode}
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setPrintOrder(null);
        }}
      />
    </div>
  );
}
