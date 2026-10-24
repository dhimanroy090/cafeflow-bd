"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { Plus, Minus, Check } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import type { FullMenuItem } from "@/features/menu/demo-menu-data";
import type { ItemVariantRow, ItemAddonRow } from "@/lib/supabase/database.types";
import { useCart } from "@/features/orders/cart-context";
import { toast } from "sonner";

interface ItemCustomizerSheetProps {
  item: FullMenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ItemCustomizerSheet({
  item,
  isOpen,
  onClose,
}: ItemCustomizerSheetProps) {
  const { addItem } = useCart();

  const [selectedVariant, setSelectedVariant] = useState<ItemVariantRow | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<ItemAddonRow[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");

  // Reset state when opening a new item
  useEffect(() => {
    if (item) {
      // Default to first variant if available
      if (item.variants && item.variants.length > 0) {
        setSelectedVariant(item.variants[0]);
      } else {
        setSelectedVariant(undefined);
      }
      setSelectedAddons([]);
      setQuantity(1);
      setNotes("");
    }
  }, [item]);

  // Compute live price for the current customization
  const currentTotal = useMemo(() => {
    if (!item) return 0;
    const base = Number(item.base_price);
    const variantDelta = selectedVariant ? Number(selectedVariant.price_delta) : 0;
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + Number(a.price), 0);
    return (base + variantDelta + addonsTotal) * quantity;
  }, [item, selectedVariant, selectedAddons, quantity]);

  if (!item) return null;

  const toggleAddon = (addon: ItemAddonRow) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleAddToCart = () => {
    addItem(item, selectedVariant, selectedAddons, quantity, notes.trim() || undefined);
    toast.success(`Added ${quantity}x ${item.name} to order`, {
      description: selectedVariant ? `Size: ${selectedVariant.name}` : undefined,
    });
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-[22px] p-0 border-t border-border bg-card text-card-foreground shadow-2xl"
      >
        {/* Sticky drag indicator */}
        <div className="pt-3 pb-1 flex justify-center sticky top-0 bg-card z-10">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-6 pb-28 pt-2 space-y-6">
          {/* Item Header (with pr-12 to guarantee safe margin for close button) */}
          <SheetHeader className="text-left space-y-2 pr-12">
            <div className="flex flex-wrap items-baseline justify-between gap-2.5">
              <SheetTitle className="text-xl sm:text-2xl font-extrabold text-brand-forest leading-tight">
                {item.name}
              </SheetTitle>
              <Badge variant="accent" className="text-sm px-2.5 py-0.5 font-bold font-mono shrink-0 shadow-sm">
                {formatBDT(item.base_price)}
              </Badge>
            </div>
            {item.nameBengali && (
              <p className="font-bengali text-xs sm:text-sm text-brand-charcoal/80 font-medium">
                {item.nameBengali}
              </p>
            )}
            {item.description && (
              <SheetDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-0.5">
                {item.description}
              </SheetDescription>
            )}
          </SheetHeader>

          {/* Variants Selection (if present) */}
          {item.variants && item.variants.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                  Select Size / Portion
                </span>
                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                  Required
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {item.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const delta = Number(variant.price_delta);
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`flex items-center justify-between p-3.5 rounded-[12px] border text-sm transition-all duration-150 text-left ${
                        isSelected
                          ? "border-brand-forest bg-brand-forest/5 text-brand-forest font-semibold shadow-sm ring-1 ring-brand-forest"
                          : "border-border hover:bg-secondary/40 text-brand-charcoal"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-brand-forest bg-brand-forest text-white"
                              : "border-muted-foreground/50"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span>{variant.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {delta > 0 ? `+${formatBDT(delta)}` : delta < 0 ? `-${formatBDT(Math.abs(delta))}` : "Standard"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Addons Selection (if present) */}
          {item.addons && item.addons.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                  Add Extra Customizations
                </span>
                <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                  Optional
                </Badge>
              </div>

              <div className="space-y-2">
                {item.addons.map((addon) => {
                  const isChecked = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddon(addon)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-[12px] border text-sm transition-all duration-150 ${
                        isChecked
                          ? "border-brand-terracotta bg-brand-terracotta/5 text-brand-charcoal font-medium shadow-sm"
                          : "border-border hover:bg-secondary/40 text-brand-charcoal"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-[4px] border flex items-center justify-center ${
                            isChecked
                              ? "border-brand-terracotta bg-brand-terracotta text-white"
                              : "border-muted-foreground/50"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span>{addon.name}</span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-brand-forest">
                        +{formatBDT(Number(addon.price))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="space-y-2 pt-2 border-t border-border/70">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-charcoal block">
              Special Instructions
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Less sugar, extra ice, allergy note..."
              className="text-sm bg-background/60"
              maxLength={140}
            />
          </div>

          {/* Quantity Stepper */}
          <div className="flex items-center justify-between pt-2 border-t border-border/70">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              Quantity
            </span>
            <div className="flex items-center gap-3 bg-secondary/50 p-1.5 rounded-[12px] border border-border">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-[8px]"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="w-8 text-center font-bold text-sm text-brand-charcoal">
                {quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-[8px]"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Add Button */}
        <div className="fixed bottom-0 inset-x-0 p-4 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-between gap-4 z-20">
          <div className="hidden sm:block">
            <span className="text-xs text-muted-foreground block">Item Total</span>
            <span className="text-lg font-extrabold text-brand-forest">
              {formatBDT(currentTotal)}
            </span>
          </div>
          <Button
            type="button"
            variant="default"
            size="lg"
            onClick={handleAddToCart}
            className="w-full sm:w-auto sm:min-w-[220px] font-bold text-base shadow-lg"
          >
            Add to Order • {formatBDT(currentTotal)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
