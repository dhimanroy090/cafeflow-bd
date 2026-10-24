"use client";

import React, { useState, useMemo } from "react";
import {
  Banknote,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Users,
  Coins,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatBDT } from "@/lib/utils";
import type { DashboardOrderWithItems } from "@/lib/orders/memory-store";
import type { PaymentMethod } from "@/lib/supabase/database.types";
import { toast } from "sonner";

interface SettlePaymentDialogProps {
  order: DashboardOrderWithItems | null;
  allOrders?: DashboardOrderWithItems[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (settledOrders: DashboardOrderWithItems[], printReceipt?: boolean) => void;
}

export function SettlePaymentDialog({
  order,
  allOrders = [],
  isOpen,
  onClose,
  onSuccess,
}: SettlePaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [isMergeTabChecked, setIsMergeTabChecked] = useState<boolean>(true);
  const [isSettling, setIsSettling] = useState<boolean>(false);

  // Detect other unpaid orders at the same table
  const relatedTableOrders = useMemo(() => {
    if (!order || !order.table_id || order.order_type === "takeaway") return [];
    return allOrders.filter(
      (o) =>
        o.id !== order.id &&
        o.table_id === order.table_id &&
        o.payment_status === "unpaid" &&
        o.status !== "cancelled"
    );
  }, [order, allOrders]);

  const hasMultipleTableOrders = relatedTableOrders.length > 0;

  // Calculate effective total depending on whether tab merging is enabled
  const ordersToSettle = useMemo(() => {
    if (!order) return [];
    if (hasMultipleTableOrders && isMergeTabChecked) {
      return [order, ...relatedTableOrders];
    }
    return [order];
  }, [order, relatedTableOrders, hasMultipleTableOrders, isMergeTabChecked]);

  const combinedTotal = useMemo(() => {
    return ordersToSettle.reduce((sum, o) => sum + o.total_amount, 0);
  }, [ordersToSettle]);

  // Cash change calculation
  const numericCash = parseFloat(cashReceived) || 0;
  const changeToReturn = Math.max(0, numericCash - combinedTotal);
  const isCashSufficient = numericCash >= combinedTotal;
  const shortAmount = combinedTotal - numericCash;

  if (!order) return null;

  const handleQuickCashPreset = (amount: number) => {
    setCashReceived(amount.toString());
  };

  const handleConfirmSettlement = async (printReceipt = false) => {
    setIsSettling(true);
    try {
      const orderIds = ordersToSettle.map((o) => o.id);

      if (orderIds.length > 1) {
        // Batch settle table tab
        const res = await fetch("/api/v1/dashboard/orders/settle-tab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableId: order.table_id,
            tableLabel: order.tableLabel,
            orderIds,
            paymentMethod: selectedMethod,
            paymentReference: paymentReference.trim() || null,
            actorName: "Cashier",
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Batch settlement failed");
        }

        toast.success(`Table Tab Settled: ${formatBDT(combinedTotal)}`, {
          description: `${orderIds.length} orders settled via ${selectedMethod.toUpperCase()}`,
        });
      } else {
        // Settle single order
        const res = await fetch(`/api/v1/dashboard/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentStatus: "paid",
            paymentMethod: selectedMethod,
            paymentReference: paymentReference.trim() || null,
            actorName: "Cashier",
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Payment update failed");
        }

        toast.success(`Order ${order.order_number} Settled: ${formatBDT(combinedTotal)}`, {
          description: `Paid via ${selectedMethod.toUpperCase()}${
            paymentReference ? ` (Ref: ${paymentReference})` : ""
          }`,
        });
      }

      onSuccess(ordersToSettle, printReceipt);
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to settle payment");
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 space-y-4">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="accent" className="text-xs">
              Bill Settlement
            </Badge>
            <span className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded">
              {order.tableLabel}
            </span>
          </div>
          <DialogTitle className="text-xl font-black text-brand-forest flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-terracotta" />
            Settle Bill: {order.order_number}
          </DialogTitle>
          <DialogDescription className="text-xs text-brand-charcoal/80">
            Accept payment and record transaction reference in Bangladesh banking / MFS audit logs.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Merging Card (if multiple orders at same table) */}
        {hasMultipleTableOrders && (
          <div className="p-3 bg-brand-forest/5 border border-brand-forest/20 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-brand-forest flex items-center gap-1.5">
                <Users className="w-4 h-4 text-brand-terracotta" />
                Active Table Tab ({relatedTableOrders.length + 1} Unpaid Orders)
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-forest">
                <input
                  type="checkbox"
                  checked={isMergeTabChecked}
                  onChange={(e) => setIsMergeTabChecked(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-forest focus:ring-brand-forest"
                />
                Settle All Together
              </label>
            </div>
            {isMergeTabChecked && (
              <div className="text-[11px] text-muted-foreground divide-y divide-border/60">
                <div className="flex justify-between py-1">
                  <span>Current: {order.order_number}</span>
                  <span className="font-mono font-semibold">{formatBDT(order.total_amount)}</span>
                </div>
                {relatedTableOrders.map((ro) => (
                  <div key={ro.id} className="flex justify-between py-1">
                    <span>Additional: {ro.order_number}</span>
                    <span className="font-mono font-semibold">{formatBDT(ro.total_amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Grand Total Callout */}
        <div className="p-4 bg-brand-cream border-2 border-brand-forest/15 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-brand-charcoal/70 uppercase tracking-wide">
              {isMergeTabChecked && hasMultipleTableOrders ? "Combined Tab Amount" : "Payable Amount"}
            </p>
            <p className="text-2xl font-black text-brand-forest">{formatBDT(combinedTotal)}</p>
          </div>
          <Badge className="bg-brand-forest text-brand-cream px-3 py-1 font-bold">
            {ordersToSettle.length} {ordersToSettle.length === 1 ? "Order" : "Orders"}
          </Badge>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-brand-charcoal block">Select Payment Method</label>
          <div className="grid grid-cols-4 gap-2">
            {/* Cash */}
            <button
              type="button"
              onClick={() => setSelectedMethod("cash")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-extrabold ${
                selectedMethod === "cash"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm ring-2 ring-emerald-500/20"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <Banknote className="w-5 h-5 text-emerald-600" />
              Cash (নগদ)
            </button>

            {/* bKash */}
            <button
              type="button"
              onClick={() => setSelectedMethod("bkash")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-extrabold ${
                selectedMethod === "bkash"
                  ? "border-[#E2136E] bg-pink-50 text-[#E2136E] shadow-sm ring-2 ring-[#E2136E]/20"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <Smartphone className="w-5 h-5 text-[#E2136E]" />
              bKash
            </button>

            {/* Nagad */}
            <button
              type="button"
              onClick={() => setSelectedMethod("nagad")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-extrabold ${
                selectedMethod === "nagad"
                  ? "border-[#F7941D] bg-orange-50 text-[#F7941D] shadow-sm ring-2 ring-[#F7941D]/20"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <Smartphone className="w-5 h-5 text-[#F7941D]" />
              Nagad
            </button>

            {/* Card */}
            <button
              type="button"
              onClick={() => setSelectedMethod("card")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-extrabold ${
                selectedMethod === "card"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-800 shadow-sm ring-2 ring-indigo-500/20"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Card / POS
            </button>
          </div>
        </div>

        {/* Dynamic Payment Method Fields */}
        {selectedMethod === "cash" ? (
          <div className="space-y-3 p-3 bg-muted/40 rounded-xl border border-border">
            <div className="space-y-1.5">
              <label className="text-xs font-bold flex items-center justify-between">
                <span>Cash Received from Customer (৳)</span>
                {cashReceived && (
                  <span className="text-[11px] text-muted-foreground">
                    Entered: {formatBDT(numericCash)}
                  </span>
                )}
              </label>
              <Input
                type="number"
                placeholder={`e.g. ${combinedTotal}`}
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="font-mono text-base font-bold h-11"
                autoFocus
              />
            </div>

            {/* Cash Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1">Presets:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickCashPreset(combinedTotal)}
                className="h-7 text-xs font-mono font-bold"
              >
                Exact ({formatBDT(combinedTotal)})
              </Button>
              {[500, 1000, 2000].map((preset) => {
                if (preset >= combinedTotal) {
                  return (
                    <Button
                      key={preset}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickCashPreset(preset)}
                      className="h-7 text-xs font-mono"
                    >
                      ৳{preset}
                    </Button>
                  );
                }
                return null;
              })}
            </div>

            {/* Change to Return Indicator */}
            {cashReceived && (
              <div
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  isCashSufficient
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : "bg-red-50 border-red-300 text-red-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCashSufficient ? (
                    <Coins className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="text-xs font-bold leading-tight">
                      {isCashSufficient
                        ? "Change to Return (ফেরত দেবেন):"
                        : "Short Amount (ঘাটতি):"}
                    </p>
                    <p className="text-lg font-black font-mono">
                      {isCashSufficient
                        ? formatBDT(changeToReturn)
                        : formatBDT(shortAmount)}
                    </p>
                  </div>
                </div>
                {isCashSufficient && (
                  <Badge className="bg-emerald-600 text-white font-bold text-xs">
                    Ready to Return
                  </Badge>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 p-3 bg-muted/40 rounded-xl border border-border">
            <label className="text-xs font-bold block">
              {selectedMethod === "card"
                ? "Card Approval Code / Last 4 Digits"
                : `${selectedMethod.toUpperCase()} Transaction ID (TrxID)`}
            </label>
            <Input
              placeholder={
                selectedMethod === "card"
                  ? "e.g. Auth: 492041 or Card *4829"
                  : "e.g. 9B8C7A6D5E"
              }
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              className="font-mono text-sm uppercase"
            />
            <p className="text-[11px] text-muted-foreground">
              Optional reference logged into the restaurant audit log for bank reconciliation.
            </p>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSettling}>
            Cancel
          </Button>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleConfirmSettlement(true)}
              disabled={isSettling || (selectedMethod === "cash" && !isCashSufficient && cashReceived !== "")}
              className="gap-1.5 font-bold text-xs"
            >
              <Receipt className="w-4 h-4 text-brand-forest" />
              Settle & Print Receipt
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleConfirmSettlement(false)}
              disabled={isSettling || (selectedMethod === "cash" && !isCashSufficient && cashReceived !== "")}
              className="bg-brand-forest hover:bg-brand-forest/90 text-brand-cream gap-1.5 font-bold text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSettling ? "Settling..." : "Confirm Settle"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
