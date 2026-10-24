"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Coffee,
  Sparkles,
  ArrowRight,
  Info,
  MapPin,
  Utensils,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatBDT } from "@/lib/utils";
import type { RestaurantRow, RestaurantTableRow, MenuCategoryRow } from "@/lib/supabase/database.types";
import type { FullMenuItem } from "@/features/menu/demo-menu-data";
import { CartProvider, useCart } from "@/features/orders/cart-context";
import { ItemCustomizerSheet } from "./item-customizer-sheet";
import { CartSheet } from "./cart-sheet";

interface QRMenuProps {
  restaurant: RestaurantRow;
  table: RestaurantTableRow | null;
  categories: MenuCategoryRow[];
  menuItems: FullMenuItem[];
  isViewOnly: boolean;
}

function QRMenuInner({
  restaurant,
  table,
  categories,
  menuItems,
  isViewOnly,
}: QRMenuProps) {
  const { calculateTotals, isCartOpen, setIsCartOpen } = useCart();
  const totals = calculateTotals(restaurant);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedItemForCustomizing, setSelectedItemForCustomizing] = useState<FullMenuItem | null>(null);

  // Filter items by category & search query
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategoryId === "all" || item.category_id === selectedCategoryId;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.nameBengali && item.nameBengali.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategoryId, searchQuery]);

  return (
    <div className="min-h-screen bg-brand-cream text-brand-charcoal selection:bg-brand-terracotta selection:text-white pb-32">
      {/* Top Banner / Restaurant Info Header */}
      <header className="border-b border-border/80 bg-brand-cream/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-[10px] bg-brand-forest text-brand-cream flex items-center justify-center shrink-0 shadow-sm">
              <Coffee className="w-5 h-5 text-brand-terracotta" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-extrabold text-sm sm:text-lg text-brand-forest truncate leading-tight">
                {restaurant.name}
              </h1>
              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                {restaurant.address || "Dhaka, Bangladesh"}
              </p>
            </div>
          </div>

          {/* Table / Ordering Status Badge */}
          <div className="shrink-0 text-right">
            {table ? (
              <Badge variant="accent" className="font-bold text-xs py-1 px-2.5 shadow-sm whitespace-nowrap shrink-0">
                <span className="sm:hidden">{table.table_label}</span>
                <span className="hidden sm:inline">Ordering for {table.table_label}</span>
              </Badge>
            ) : isViewOnly ? (
              <Badge variant="outline" className="font-medium text-xs py-1 px-2.5 gap-1 bg-background/50 whitespace-nowrap shrink-0">
                <Eye className="w-3 h-3 text-muted-foreground" />
                View-Only
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-semibold text-xs py-1 px-2.5 whitespace-nowrap shrink-0">
                Takeaway
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Table Welcome Notice or View-Only Callout */}
        {table ? (
          <div className="p-3.5 rounded-[14px] bg-card border border-border/80 shadow-sm flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-brand-forest uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-terracotta" />
                Live QR Ordering Active
              </span>
              <p className="text-xs text-brand-charcoal/80">
                Items will be prepared and served directly to{" "}
                <span className="font-semibold text-brand-forest">{table.table_label}</span>.
              </p>
            </div>
            <Badge variant="success" className="text-[11px] shrink-0 font-medium">
              Ready
            </Badge>
          </div>
        ) : (
          <div className="p-3.5 rounded-[14px] bg-secondary/50 border border-border text-xs text-brand-charcoal space-y-1">
            <p className="font-semibold text-brand-forest flex items-center gap-1.5">
              <Info className="w-4 h-4 text-brand-terracotta" />
              Browsing from outside the restaurant?
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Scan the QR code on your cafe table to place an order directly to your table, or select items for takeaway.
            </p>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coffee, drinks, artisanal toasts..."
            className="pl-10 text-sm bg-card border-border rounded-[10px] shadow-sm h-11"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-brand-charcoal"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sticky Category Pills */}
        <div className="sticky top-[57px] bg-brand-cream/95 backdrop-blur-md py-2.5 z-20 -mx-4 px-4 border-b border-border/40 overflow-x-auto no-scrollbar flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategoryId("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
              selectedCategoryId === "all"
                ? "bg-brand-forest text-brand-cream shadow-sm"
                : "bg-card border border-border text-brand-charcoal hover:bg-secondary/40"
            }`}
          >
            All Items ({menuItems.length})
          </button>
          {categories.map((cat) => {
            const count = menuItems.filter((i) => i.category_id === cat.id).length;
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isSelected
                    ? "bg-brand-forest text-brand-cream shadow-sm"
                    : "bg-card border border-border text-brand-charcoal hover:bg-secondary/40"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Menu Items Grid */}
        <div className="space-y-3 pt-1">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-sm font-semibold text-brand-charcoal">
                No items match your search
              </p>
              <p className="text-xs text-muted-foreground">
                Try searching for something else or reset category filter.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategoryId("all");
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            filteredItems.map((item) => (
              <Card
                key={item.id}
                onClick={() => setSelectedItemForCustomizing(item)}
                className="rounded-[14px] border-border/80 bg-card hover:border-brand-forest/60 transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99] group overflow-hidden"
              >
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <h3 className="font-extrabold text-base text-brand-forest group-hover:text-brand-terracotta transition-colors leading-tight">
                        {item.name}
                      </h3>
                      {item.variants.length > 0 && (
                        <span className="inline-flex items-center text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border border-border/80 bg-secondary/50 text-muted-foreground whitespace-nowrap shrink-0">
                          {item.variants.length} Sizes
                        </span>
                      )}
                    </div>

                    {item.nameBengali && (
                      <p className="font-bengali text-xs text-brand-charcoal/80 font-medium">
                        {item.nameBengali}
                      </p>
                    )}

                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    <div className="pt-1 flex items-center gap-2">
                      <span className="font-extrabold text-sm text-brand-charcoal font-mono">
                        {formatBDT(item.base_price)}
                      </span>
                      {item.addons.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          • Customizations available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual or Add Pill */}
                  <div className="shrink-0 flex flex-col items-end justify-between h-full pt-1">
                    <div className="w-12 h-12 rounded-[10px] bg-secondary/50 flex items-center justify-center text-brand-forest group-hover:bg-brand-forest group-hover:text-white transition-all shadow-sm">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-brand-forest mt-2 group-hover:text-brand-terracotta transition-colors flex items-center gap-0.5">
                      Add +
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Pill */}
      {totals.itemCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-30">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-brand-forest text-brand-cream hover:bg-brand-forest-light transition-all p-4 rounded-[16px] shadow-2xl flex items-center justify-between border border-brand-cream/20 animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-terracotta text-white font-extrabold text-xs flex items-center justify-center shadow-md">
                {totals.itemCount}
              </div>
              <div className="text-left">
                <span className="text-xs opacity-80 block">Table Order Cart</span>
                <span className="text-base font-extrabold font-mono leading-none">
                  {formatBDT(totals.grandTotal)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-sm font-bold bg-white/10 px-3.5 py-1.5 rounded-[10px]">
              <span>View Order</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Item Customizer Bottom Sheet */}
      <ItemCustomizerSheet
        item={selectedItemForCustomizing}
        isOpen={!!selectedItemForCustomizing}
        onClose={() => setSelectedItemForCustomizing(null)}
      />

      {/* Cart & Checkout Slide-Over */}
      <CartSheet
        restaurant={restaurant}
        table={table}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
}

export function QRMenu(props: QRMenuProps) {
  return (
    <CartProvider
      restaurantSlug={props.restaurant.slug}
      tableToken={props.table?.qr_token || null}
    >
      <QRMenuInner {...props} />
    </CartProvider>
  );
}
