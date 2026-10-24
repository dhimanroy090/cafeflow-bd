"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Phone,
  User,
  KeyRound,
  Info,
  Loader2,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";
import type { RestaurantRow, RestaurantTableRow } from "@/lib/supabase/database.types";
import { useCart } from "@/features/orders/cart-context";
import { toast } from "sonner";

interface CartSheetProps {
  restaurant: RestaurantRow;
  table: RestaurantTableRow | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CartSheet({
  restaurant,
  table,
  isOpen,
  onClose,
}: CartSheetProps) {
  const router = useRouter();
  const {
    items,
    tableToken,
    idempotencyKey,
    customerName,
    customerPhone,
    tablePin,
    updateQuantity,
    removeItem,
    clearCart,
    setCustomerName,
    setCustomerPhone,
    setTablePin,
    calculateTotals,
    regenerateIdempotencyKey,
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totals = calculateTotals(restaurant);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (restaurant.require_table_pin && !tablePin.trim()) {
      setErrorMessage("Please enter the 4-digit Table PIN provided on your table tent.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        restaurantSlug: restaurant.slug,
        tableToken: tableToken || undefined,
        orderType: tableToken ? "dine_in_qr" : "takeaway",
        tablePin: restaurant.require_table_pin ? tablePin.trim() : undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        client_idempotency_key: idempotencyKey,
        items: items.map((ci) => ({
          menuItemId: ci.item.id,
          variantId: ci.variant?.id,
          addonIds: ci.addons.map((a) => a.id),
          quantity: ci.quantity,
          notes: ci.notes,
        })),
      };

      const response = await fetch("/api/v1/public/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to place order. Please try again.");
      }

      toast.success("Order Placed Successfully!", {
        description: `Order ${data.order.orderNumber} sent to kitchen.`,
      });

      // Clear local cart
      clearCart();
      onClose();

      // Redirect to live order tracking page
      router.push(`/r/${restaurant.slug}/order/${data.order.publicTrackingToken}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error placing order.";
      setErrorMessage(msg);
      // In case of an error other than duplicate idempotency, generate new key for next attempt
      regenerateIdempotencyKey();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-card text-card-foreground shadow-2xl border-l border-border rounded-l-[18px]"
      >
        {/* Header */}
        <SheetHeader className="p-5 border-b border-border/80 text-left space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-forest" />
              <SheetTitle className="text-lg font-bold text-brand-forest">
                Your Order Cart
              </SheetTitle>
            </div>
            {table ? (
              <Badge variant="accent" className="font-semibold text-xs">
                {table.table_label}
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-semibold text-xs">
                Takeaway Order
              </Badge>
            )}
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            {totals.itemCount} items selected from {restaurant.name}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Cart Items & Checkout Details */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto text-muted-foreground">
                <ShoppingBag className="w-8 h-8 opacity-40" />
              </div>
              <p className="font-semibold text-brand-charcoal text-base">
                Your cart is empty
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Select items from the menu to build your table order.
              </p>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                    Selected Items
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2"
                    onClick={clearCart}
                  >
                    Clear All
                  </Button>
                </div>

                <div className="divide-y divide-border/60 rounded-[14px] border border-border/80 bg-background/50 overflow-hidden">
                  {items.map((cartItem) => (
                    <div key={cartItem.id} className="p-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm text-brand-charcoal">
                            {cartItem.item.name}
                          </p>
                          {cartItem.variant && (
                            <p className="text-xs text-muted-foreground">
                              Size: {cartItem.variant.name}
                            </p>
                          )}
                          {cartItem.addons.length > 0 && (
                            <p className="text-[11px] text-brand-terracotta font-medium">
                              +{cartItem.addons.map((a) => a.name).join(", ")}
                            </p>
                          )}
                          {cartItem.notes && (
                            <p className="text-[11px] text-muted-foreground italic">
                              &ldquo;{cartItem.notes}&rdquo;
                            </p>
                          )}
                        </div>
                        <span className="font-mono font-bold text-sm text-brand-forest shrink-0">
                          {formatBDT(cartItem.lineTotal)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-[8px] border border-border">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-[6px]"
                            onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-xs font-bold">
                            {cartItem.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-[6px]"
                            onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(cartItem.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guest Details & Table Verification */}
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4 pt-2 border-t border-border/80">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal block">
                  Customer Information (No Login Required)
                </span>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-brand-charcoal flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      Your Name (Optional)
                    </label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Tanvir Ahmed"
                      className="text-sm bg-background/60"
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-brand-charcoal flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      Phone Number (Optional)
                    </label>
                    <Input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 017XXXXXXXX"
                      className="text-sm bg-background/60"
                      maxLength={20}
                    />
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-0.5">
                      <Info className="w-3 h-3 text-muted-foreground shrink-0" />
                      Only used if we need to contact you about your order.
                    </p>
                  </div>

                  {restaurant.require_table_pin && (
                    <div className="p-3.5 rounded-[12px] bg-brand-forest/5 border border-brand-forest/30 space-y-2">
                      <div className="flex items-center gap-1.5 text-brand-forest font-semibold text-xs">
                        <KeyRound className="w-3.5 h-3.5" />
                        Table PIN Verification Required
                      </div>
                      <Input
                        type="text"
                        maxLength={6}
                        value={tablePin}
                        onChange={(e) => setTablePin(e.target.value)}
                        placeholder="Enter 4-digit PIN"
                        className="text-center tracking-widest font-mono text-base font-bold bg-white"
                        required
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Find the daily 4-digit PIN on the acrylic stand on your table.
                      </p>
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-[10px] bg-destructive/10 text-destructive text-xs font-medium">
                    {errorMessage}
                  </div>
                )}
              </form>

              {/* Bill Breakdown */}
              <div className="space-y-2 pt-2 border-t border-border/80 text-xs">
                <span className="font-bold uppercase tracking-wider text-brand-charcoal block mb-1">
                  Bill Summary (BDT)
                </span>
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono text-brand-charcoal">{formatBDT(totals.subtotal)}</span>
                </div>
                {totals.serviceChargeAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Service Charge ({restaurant.service_charge_percentage}%)</span>
                    <span className="font-mono text-brand-charcoal">{formatBDT(totals.serviceChargeAmount)}</span>
                  </div>
                )}
                {totals.vatAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      VAT ({restaurant.vat_percentage}%) {restaurant.is_vat_inclusive ? "(Included)" : "(Added)"}
                    </span>
                    <span className="font-mono text-brand-charcoal">{formatBDT(totals.vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-brand-forest border-t pt-2">
                  <span>Total Amount</span>
                  <span className="font-mono text-base">{formatBDT(totals.grandTotal)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-[8px] mt-2">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Pay with Cash, bKash, Nagad, or Card after service.</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Checkout CTA */}
        {items.length > 0 && (
          <div className="p-4 border-t border-border bg-card/95 backdrop-blur-md space-y-2">
            <Button
              type="submit"
              form="checkout-form"
              variant="default"
              size="lg"
              disabled={isSubmitting}
              className="w-full gap-2 font-bold text-base shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Placing Order with Kitchen...
                </>
              ) : (
                <>
                  Confirm Table Order • {formatBDT(totals.grandTotal)}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              Protected against duplicate clicks with idempotency token.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
