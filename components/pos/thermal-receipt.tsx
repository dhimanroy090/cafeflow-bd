"use client";

import React, { useState } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DEMO_RESTAURANT } from "@/features/menu/demo-menu-data";
import type { DashboardOrderWithItems } from "@/app/api/v1/dashboard/orders/route";

export type ThermalPrintMode = "kot" | "bill";
export type ThermalRollSize = "58mm" | "80mm";

interface ThermalReceiptProps {
  order: DashboardOrderWithItems;
  mode: ThermalPrintMode;
  rollSize?: ThermalRollSize;
}

export function ThermalReceiptContent({
  order,
  mode,
  rollSize = "80mm",
}: ThermalReceiptProps) {
  const isKOT = mode === "kot";
  const dateStr = new Date(order.created_at).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const divider = rollSize === "58mm" ? "--------------------------------" : "------------------------------------------------";
  const doubleDivider = rollSize === "58mm" ? "================================" : "================================================";

  if (isKOT) {
    return (
      <div
        className={`font-mono text-black bg-white leading-tight ${
          rollSize === "58mm" ? "w-[48mm] text-[10px]" : "w-[72mm] text-xs"
        }`}
      >
        <div className="text-center font-bold">
          <p className="text-sm tracking-wider">*** KITCHEN ORDER TICKET ***</p>
          <p className="text-lg font-black my-1">{order.order_number}</p>
          <p className="text-sm uppercase font-extrabold bg-black text-white py-0.5 px-2 inline-block rounded">
            {order.tableLabel || "COUNTER / TAKEAWAY"}
          </p>
        </div>

        <div className="my-2 space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>Date: {dateStr}</span>
          </div>
          <div className="flex justify-between">
            <span>Type: {order.order_type.toUpperCase()}</span>
            <span>Server: Cashier #1</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-1" />

        <div className="py-1">
          <div className="flex justify-between font-bold pb-1 text-[11px]">
            <span>QTY  ITEM</span>
          </div>
          <div className="border-t border-dashed border-black my-1" />

          <div className="space-y-2 pt-1">
            {order.items.map((item, idx) => {
              const addons = (item.addons_snapshot as Array<{ name: string; price: number }>) || [];
              return (
                <div key={item.id || idx} className="space-y-0.5">
                  <div className="flex items-start gap-1 font-bold">
                    <span className="text-sm font-black w-7">{item.quantity}x</span>
                    <span className="flex-1 text-sm font-extrabold">{item.item_name_snapshot}</span>
                  </div>

                  {item.variant_name_snapshot && (
                    <div className="pl-7 text-[10px] italic">
                      Size: {item.variant_name_snapshot}
                    </div>
                  )}

                  {addons.length > 0 && (
                    <div className="pl-7 space-y-0.5">
                      {addons.map((a, i) => (
                        <div key={i} className="text-[10px] font-bold">
                          + {a.name}
                        </div>
                      ))}
                    </div>
                  )}

                  {item.item_notes && (
                    <div className="pl-7 text-[10px] font-bold uppercase underline">
                      NOTE: &ldquo;{item.item_notes}&rdquo;
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {order.special_notes && (
          <div className="my-2 p-1 border border-black font-bold text-[10px]">
            ORDER NOTE: {order.special_notes}
          </div>
        )}

        <div className="border-t border-dashed border-black my-2" />
        <div className="text-center font-bold text-[10px] tracking-wide">
          *** KITCHEN EXPEDITE TICKET ***
        </div>
      </div>
    );
  }

  // Customer Bill / Receipt Mode
  return (
    <div
      className={`font-mono text-black bg-white leading-tight ${
        rollSize === "58mm" ? "w-[48mm] text-[10px]" : "w-[72mm] text-xs"
      }`}
    >
      {/* Restaurant Header */}
      <div className="text-center space-y-0.5">
        <h2 className="text-sm font-black tracking-wide uppercase">{DEMO_RESTAURANT.name}</h2>
        <p className="text-[10px]">{DEMO_RESTAURANT.address}</p>
        <p className="text-[10px]">Tel: {DEMO_RESTAURANT.phone}</p>
        <p className="text-[9px] text-gray-700">BIN/Mushak: 002948123-0101</p>
      </div>

      <div className="my-1.5 text-center text-xs">{divider}</div>

      {/* Order Info */}
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between font-bold">
          <span>Order: {order.order_number}</span>
          <span>{order.tableLabel || "Counter"}</span>
        </div>
        <div className="flex justify-between">
          <span>Date: {dateStr}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier: POS Station</span>
          <span>Type: {order.order_type.replace("_", " ").toUpperCase()}</span>
        </div>
        {order.customer_name && (
          <div className="flex justify-between">
            <span>Customer: {order.customer_name}</span>
            {order.customer_phone && <span>{order.customer_phone}</span>}
          </div>
        )}
      </div>

      <div className="my-1.5 text-center text-xs">{divider}</div>

      {/* Itemized Table */}
      <div className="space-y-1.5">
        <div className="flex justify-between font-bold text-[10px]">
          <span className="w-1/2">ITEM</span>
          <span className="w-12 text-center">QTY</span>
          <span className="w-16 text-right">TOTAL</span>
        </div>
        <div className="border-t border-dashed border-black my-1" />

        {order.items.map((item, idx) => {
          const addons = (item.addons_snapshot as Array<{ name: string; price: number }>) || [];
          return (
            <div key={item.id || idx} className="space-y-0.5 text-[10px]">
              <div className="flex justify-between items-start">
                <span className="w-1/2 font-semibold leading-tight">
                  {item.item_name_snapshot}
                </span>
                <span className="w-12 text-center font-bold">{item.quantity}</span>
                <span className="w-16 text-right font-mono">
                  {item.line_total.toFixed(2)}
                </span>
              </div>
              {item.variant_name_snapshot && (
                <div className="text-[9px] text-gray-700 pl-2">
                  ({item.variant_name_snapshot})
                </div>
              )}
              {addons.map((a, i) => (
                <div key={i} className="text-[9px] text-gray-700 pl-2 flex justify-between">
                  <span>+ {a.name}</span>
                  <span>{a.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="my-1.5 text-center text-xs">{divider}</div>

      {/* Totals Breakdown */}
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>Tk. {order.subtotal.toFixed(2)}</span>
        </div>

        {order.discount_amount > 0 && (
          <div className="flex justify-between font-bold">
            <span>Discount:</span>
            <span>- Tk. {order.discount_amount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-800">
          <span>VAT (5% Inclusive):</span>
          <span>Tk. {order.vat_amount.toFixed(2)}</span>
        </div>

        {order.service_charge_amount > 0 && (
          <div className="flex justify-between text-gray-800">
            <span>Service Charge (10%):</span>
            <span>Tk. {order.service_charge_amount.toFixed(2)}</span>
          </div>
        )}

        <div className="my-1 text-center text-xs">{doubleDivider}</div>

        <div className="flex justify-between text-xs font-black">
          <span>GRAND TOTAL:</span>
          <span>Tk. {order.total_amount.toFixed(2)}</span>
        </div>

        <div className="my-1 text-center text-xs">{doubleDivider}</div>
      </div>

      {/* Payment Details */}
      <div className="my-2 p-1.5 border border-black text-[10px] space-y-0.5">
        <div className="flex justify-between font-bold">
          <span>PAYMENT STATUS:</span>
          <span className={order.payment_status === "paid" ? "uppercase font-black" : "uppercase underline"}>
            {order.payment_status === "paid" ? "PAID" : "UNPAID / TAB OPEN"}
          </span>
        </div>
        {order.payment_status === "paid" && (
          <>
            <div className="flex justify-between">
              <span>Method:</span>
              <span className="uppercase font-semibold">{order.payment_method}</span>
            </div>
            {order.payment_reference && (
              <div className="flex justify-between">
                <span>Ref / TrxID:</span>
                <span className="font-mono">{order.payment_reference}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center space-y-1 pt-2 text-[9px]">
        <p className="font-bold">Thank you for dining with us!</p>
        <p className="text-gray-700">Please visit again soon.</p>
        <p className="font-mono text-[8px] tracking-widest text-gray-600">
          *** POWERED BY CAFÉFLOW BD ***
        </p>
      </div>
    </div>
  );
}

interface ThermalPrintDialogProps {
  order: DashboardOrderWithItems | null;
  mode: ThermalPrintMode;
  isOpen: boolean;
  onClose: () => void;
}

export function ThermalPrintDialog({
  order,
  mode,
  isOpen,
  onClose,
}: ThermalPrintDialogProps) {
  const [rollSize, setRollSize] = useState<ThermalRollSize>("80mm");

  if (!order) return null;

  const handlePrint = () => {
    // 1. Ensure the print container has the right classes
    const printArea = document.getElementById("thermal-print-container");
    if (printArea) {
      printArea.className = rollSize === "58mm" ? "roll-58mm" : "roll-80mm";
    }

    // 2. Trigger browser print dialog
    window.print();
  };

  return (
    <>
      {/* On-screen Preview Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant="accent" className="text-xs">
                {mode === "kot" ? "Kitchen Order Ticket" : "Customer Bill Receipt"}
              </Badge>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setRollSize("58mm")}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    rollSize === "58mm" ? "bg-white shadow-sm font-bold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  58mm Roll
                </button>
                <button
                  type="button"
                  onClick={() => setRollSize("80mm")}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    rollSize === "80mm" ? "bg-white shadow-sm font-bold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  80mm Roll
                </button>
              </div>
            </div>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Printer className="w-5 h-5 text-brand-forest" />
              Thermal Print Preview ({order.order_number})
            </DialogTitle>
            <DialogDescription className="text-xs">
              Formatted for 58mm/80mm ESC/POS thermal roll printers with high-contrast monospace rendering.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Receipt Preview */}
          <div className="my-4 p-4 bg-muted/40 rounded-xl border border-border flex justify-center overflow-y-auto max-h-[50vh]">
            <div className="bg-white p-4 shadow-sm border border-neutral-300 rounded">
              <ThermalReceiptContent order={order} mode={mode} rollSize={rollSize} />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4 mr-1.5" />
              Close Preview
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-brand-forest hover:bg-brand-forest/90 text-brand-cream gap-2 font-bold px-4"
            >
              <Printer className="w-4 h-4" />
              Print to Thermal Roll ({rollSize})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden Thermal Print Container for @media print */}
      <div
        id="thermal-print-container"
        className={rollSize === "58mm" ? "roll-58mm" : "roll-80mm"}
      >
        <ThermalReceiptContent order={order} mode={mode} rollSize={rollSize} />
      </div>
    </>
  );
}
