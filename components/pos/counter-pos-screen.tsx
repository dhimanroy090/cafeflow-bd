"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Utensils,
  Receipt,
  ArrowLeft,
  ArrowRight,
  ChefHat,
  Tag,
  Coffee,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DEMO_RESTAURANT,
  DEMO_TABLES,
  DEMO_CATEGORIES,
  DEMO_MENU_ITEMS,
  type FullMenuItem,
} from "@/features/menu/demo-menu-data";
import { formatBDT } from "@/lib/utils";
import { SettlePaymentDialog } from "@/components/dashboard/settle-payment-dialog";
import {
  ThermalPrintDialog,
  type ThermalPrintMode,
} from "@/components/pos/thermal-receipt";
import type { DashboardOrderWithItems } from "@/lib/orders/memory-store";
import type {
  OrderType,
  ItemVariantRow,
  ItemAddonRow,
} from "@/lib/supabase/database.types";
import { toast } from "sonner";

interface CartLineItem {
  id: string;
  item: FullMenuItem;
  selectedVariant: ItemVariantRow | null;
  selectedAddons: ItemAddonRow[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  itemNotes: string;
}

export function CounterPOSScreen() {
  // Category & search state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileView, setMobileView] = useState<"menu" | "ticket">("menu");

  // Cart & Order Configuration
  const [cart, setCart] = useState<CartLineItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("counter_pos");
  const [selectedTableId, setSelectedTableId] = useState<string>(DEMO_TABLES[0].id);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Discount
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountValue, setDiscountValue] = useState<string>("");

  // Modal states
  const [customizingItem, setCustomizingItem] = useState<FullMenuItem | null>(null);
  const [tempVariant, setTempVariant] = useState<ItemVariantRow | null>(null);
  const [tempAddons, setTempAddons] = useState<ItemAddonRow[]>([]);
  const [tempQuantity, setTempQuantity] = useState(1);
  const [tempNotes, setTempNotes] = useState("");

  // Settlement & Printing
  const [settlingOrder, setSettlingOrder] = useState<DashboardOrderWithItems | null>(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState<DashboardOrderWithItems | null>(null);
  const [printMode, setPrintMode] = useState<ThermalPrintMode>("kot");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return DEMO_MENU_ITEMS.filter((item) => {
      const matchesCat =
        selectedCategory === "all" || item.category_id === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.nameBengali && item.nameBengali.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Selected table label
  const selectedTable = useMemo(() => {
    return DEMO_TABLES.find((t) => t.id === selectedTableId) || DEMO_TABLES[0];
  }, [selectedTableId]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    const val = parseFloat(discountValue) || 0;
    if (val <= 0) return 0;
    if (discountType === "percent") {
      return Math.min(subtotal, (subtotal * val) / 100);
    }
    return Math.min(subtotal, val);
  }, [subtotal, discountType, discountValue]);

  const taxableBase = Math.max(0, subtotal - discountAmount);

  const vatAmount = useMemo(() => {
    const rate = DEMO_RESTAURANT.vat_percentage || 0;
    if (rate <= 0) return 0;
    if (DEMO_RESTAURANT.is_vat_inclusive) {
      return Number(((taxableBase * rate) / (100 + rate)).toFixed(2));
    }
    return Number(((taxableBase * rate) / 100).toFixed(2));
  }, [taxableBase]);

  const serviceChargeAmount = useMemo(() => {
    // Waive service charge for takeaway or quick counter orders
    if (orderType === "takeaway" || orderType === "counter_pos") return 0;
    const rate = DEMO_RESTAURANT.service_charge_percentage || 0;
    return Number(((taxableBase * rate) / 100).toFixed(2));
  }, [taxableBase, orderType]);

  const grandTotal = useMemo(() => {
    const net = taxableBase;
    const sc = serviceChargeAmount;
    const vatExtra = DEMO_RESTAURANT.is_vat_inclusive ? 0 : vatAmount;
    return Number((net + sc + vatExtra).toFixed(2));
  }, [taxableBase, serviceChargeAmount, vatAmount]);

  // Cart operations
  const handleItemClick = (item: FullMenuItem) => {
    if (item.variants.length > 0 || item.addons.length > 0) {
      // Open customization modal
      setCustomizingItem(item);
      setTempVariant(item.variants.length > 0 ? item.variants[0] : null);
      setTempAddons([]);
      setTempQuantity(1);
      setTempNotes("");
    } else {
      // Add directly
      addItemToCart(item, null, [], 1, "");
      toast.success(`Added ${item.name}`, { duration: 1500 });
    }
  };

  const addItemToCart = (
    item: FullMenuItem,
    variant: ItemVariantRow | null,
    addons: ItemAddonRow[],
    qty: number,
    notes: string
  ) => {
    const unitPrice =
      item.base_price +
      (variant ? variant.price_delta : 0) +
      addons.reduce((sum, a) => sum + a.price, 0);

    const lineTotal = unitPrice * qty;

    const lineId = `${item.id}-${variant?.id || "none"}-${addons
      .map((a) => a.id)
      .sort()
      .join("_")}`;

    setCart((prev) => {
      const existingIdx = prev.findIndex((p) => p.id === lineId);
      if (existingIdx >= 0) {
        const next = [...prev];
        const existing = next[existingIdx];
        const newQty = existing.quantity + qty;
        next[existingIdx] = {
          ...existing,
          quantity: newQty,
          lineTotal: existing.unitPrice * newQty,
          itemNotes: notes || existing.itemNotes,
        };
        return next;
      }
      return [
        ...prev,
        {
          id: lineId,
          item,
          selectedVariant: variant,
          selectedAddons: addons,
          quantity: qty,
          unitPrice,
          lineTotal,
          itemNotes: notes,
        },
      ];
    });
  };

  const handleConfirmCustomization = () => {
    if (!customizingItem) return;
    addItemToCart(
      customizingItem,
      tempVariant,
      tempAddons,
      tempQuantity,
      tempNotes
    );
    toast.success(`Added ${customizingItem.name}`, { duration: 1500 });
    setCustomizingItem(null);
  };

  const updateQuantity = (lineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.id === lineId) {
            const nextQty = line.quantity + delta;
            if (nextQty <= 0) return null;
            return {
              ...line,
              quantity: nextQty,
              lineTotal: line.unitPrice * nextQty,
            };
          }
          return line;
        })
        .filter(Boolean) as CartLineItem[]
    );
  };

  const removeLineItem = (lineId: string) => {
    setCart((prev) => prev.filter((l) => l.id !== lineId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue("");
    setOrderNotes("");
    setCustomerName("");
    setCustomerPhone("");
  };

  // Order submission
  const createOrderOnServer = async (
    paymentStatus: "unpaid" | "paid"
  ): Promise<DashboardOrderWithItems | null> => {
    if (cart.length === 0) {
      toast.error("Cart is empty", { description: "Please add menu items to proceed." });
      return null;
    }

    setIsSubmitting(true);
    try {
      const tableLabel =
        orderType === "dine_in_qr"
          ? selectedTable.table_label
          : orderType === "takeaway"
          ? "Takeaway"
          : "Counter POS";

      const orderPayload = {
        orderType,
        tableId: orderType === "dine_in_qr" ? selectedTable.id : null,
        tableLabel,
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        specialNotes: orderNotes.trim() || null,
        subtotal,
        discountAmount,
        vatAmount,
        serviceChargeAmount,
        totalAmount: grandTotal,
        paymentStatus,
        paymentMethod: paymentStatus === "paid" ? "cash" : "unpaid",
        status: paymentStatus === "paid" ? "accepted" : "pending",
        items: cart.map((line) => ({
          menu_item_id: line.item.id,
          item_name_snapshot: line.item.name,
          variant_name_snapshot: line.selectedVariant?.name || null,
          unit_price_snapshot: line.unitPrice,
          addons_snapshot: line.selectedAddons.map((a) => ({ name: a.name, price: a.price })),
          quantity: line.quantity,
          line_total: line.lineTotal,
          item_notes: line.itemNotes || null,
        })),
      };

      const res = await fetch("/api/v1/dashboard/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create order");
      }

      return data.order as DashboardOrderWithItems;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create order");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action 1: Send to Kitchen (Pay Later)
  const handleSendToKitchen = async () => {
    const createdOrder = await createOrderOnServer("unpaid");
    if (createdOrder) {
      toast.success(`Sent to Kitchen: ${createdOrder.order_number}`, {
        description: `Active on KDS (${createdOrder.tableLabel}). Pay later at settlement.`,
      });
      // Prompt auto-print KOT
      setPrintOrder(createdOrder);
      setPrintMode("kot");
      setIsPrintModalOpen(true);
      clearCart();
    }
  };

  // Action 2: Collect Payment & Print Receipt
  const handleCollectPayment = async () => {
    const createdOrder = await createOrderOnServer("unpaid");
    if (createdOrder) {
      // Open settlement modal directly
      setSettlingOrder(createdOrder);
      setIsSettleModalOpen(true);
    }
  };

  const handleSettlementSuccess = (
    settledOrders: DashboardOrderWithItems[],
    printReceipt?: boolean
  ) => {
    clearCart();
    if (printReceipt && settledOrders.length > 0) {
      setPrintOrder(settledOrders[0]);
      setPrintMode("bill");
      setIsPrintModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-charcoal flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-brand-forest text-brand-cream px-4 sm:px-6 py-3 shadow-md flex items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-8 h-8 rounded-lg bg-brand-cream/10 hover:bg-brand-cream/20 flex items-center justify-center transition-colors text-brand-cream"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight flex items-center gap-2">
                <Utensils className="w-5 h-5 text-brand-terracotta" />
                Quick Counter POS
              </h1>
              <Badge className="bg-brand-terracotta text-brand-cream font-mono text-[10px] px-1.5 py-0">
                POS Station 01
              </Badge>
            </div>
            <p className="text-[11px] text-brand-cream/70 hidden sm:block">
              {DEMO_RESTAURANT.name} • Fast Walk-in & Takeaway Billing
            </p>
          </div>
        </div>

        {/* Quick Links & Status */}
        <div className="flex items-center gap-2">
          <Link href="/dashboard/orders">
            <Button
              variant="outline"
              size="sm"
              className="bg-brand-cream/10 border-brand-cream/20 text-brand-cream hover:bg-brand-cream/20 text-xs font-bold gap-1.5 h-8"
            >
              <Receipt className="w-3.5 h-3.5" />
              Live Orders
            </Button>
          </Link>
          <Link href="/dashboard/kitchen">
            <Button
              variant="outline"
              size="sm"
              className="bg-brand-cream/10 border-brand-cream/20 text-brand-cream hover:bg-brand-cream/20 text-xs font-bold gap-1.5 h-8"
            >
              <ChefHat className="w-3.5 h-3.5 text-brand-terracotta" />
              KDS Screen
            </Button>
          </Link>
        </div>
      </header>
      {/* Mobile Station Switcher (< lg) */}
      <div className="lg:hidden bg-card border-b border-border p-2.5 px-4 flex items-center justify-between gap-2 shrink-0">
        <div className="grid grid-cols-2 gap-2 flex-1">
          <Button
            type="button"
            variant={mobileView === "menu" ? "default" : "outline"}
            size="sm"
            onClick={() => setMobileView("menu")}
            className={`text-xs font-bold gap-1.5 h-9 ${
              mobileView === "menu" ? "bg-brand-forest text-brand-cream" : ""
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            Menu Catalog
          </Button>
          <Button
            type="button"
            variant={mobileView === "ticket" ? "default" : "outline"}
            size="sm"
            onClick={() => setMobileView("ticket")}
            className={`text-xs font-bold gap-1.5 h-9 relative ${
              mobileView === "ticket" ? "bg-brand-forest text-brand-cream" : ""
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Ticket
            {cart.length > 0 && (
              <Badge variant="accent" className="ml-1 text-[10px] py-0 px-1.5 font-bold">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side (60%): Menu Catalog & Quick Picker */}
        <section
          className={`flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto max-h-[calc(100vh-60px)] pb-24 lg:pb-5 ${
            mobileView === "ticket" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Search & Category Pills */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Quick item search (press '/' to focus)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card border-border h-10 rounded-xl text-sm"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <Button
                type="button"
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className={`rounded-full text-xs font-bold shrink-0 h-8 ${
                  selectedCategory === "all"
                    ? "bg-brand-forest text-brand-cream shadow-sm"
                    : "bg-card border-border hover:bg-muted"
                }`}
              >
                All Menu ({DEMO_MENU_ITEMS.length})
              </Button>
              {DEMO_CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  type="button"
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full text-xs font-bold shrink-0 h-8 ${
                    selectedCategory === cat.id
                      ? "bg-brand-forest text-brand-cream shadow-sm"
                      : "bg-card border-border hover:bg-muted"
                  }`}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map((item) => {
              const hasCustomizations = item.variants.length > 0 || item.addons.length > 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className="p-3 bg-card border border-border/80 rounded-xl hover:border-brand-forest hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-[0.98] min-h-[120px]"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-extrabold text-sm text-brand-forest leading-tight group-hover:text-brand-terracotta transition-colors line-clamp-2">
                        {item.name}
                      </h4>
                      {hasCustomizations && (
                        <Sparkles className="w-3.5 h-3.5 text-brand-terracotta shrink-0" />
                      )}
                    </div>
                    {item.nameBengali && (
                      <p className="text-[11px] text-muted-foreground font-bengali">
                        {item.nameBengali}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-2">
                    <span className="font-black text-sm text-brand-charcoal font-mono">
                      {formatBDT(item.base_price)}
                    </span>
                    <span className="w-6 h-6 rounded-lg bg-brand-forest/10 group-hover:bg-brand-forest group-hover:text-brand-cream text-brand-forest flex items-center justify-center transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Coffee className="w-10 h-10 mb-2 opacity-40 text-brand-forest" />
              <p className="font-bold text-sm">No menu items match your search.</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="text-xs text-brand-forest"
              >
                Clear search & filters
              </Button>
            </div>
          )}

          {/* Mobile Floating Cart Bar */}
          {cart.length > 0 && mobileView === "menu" && (
            <div className="lg:hidden fixed bottom-4 inset-x-4 z-40 max-w-md mx-auto animate-in slide-in-from-bottom duration-200">
              <button
                type="button"
                onClick={() => setMobileView("ticket")}
                className="w-full bg-brand-forest text-brand-cream hover:bg-brand-forest-light transition-all p-3.5 rounded-[14px] shadow-2xl flex items-center justify-between border border-brand-cream/20"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-brand-terracotta text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] opacity-80 block leading-tight">Ticket Total</span>
                    <span className="text-sm font-extrabold font-mono">
                      {formatBDT(grandTotal)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-[8px]">
                  <span>Review Ticket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          )}
        </section>

        {/* Right Side (40%): Current Bill & POS Cart */}
        <aside
          className={`w-full lg:w-[420px] bg-card border-l border-border flex flex-col shadow-lg z-30 ${
            mobileView === "menu" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Mobile Back to Catalog Bar */}
          <div className="lg:hidden p-2.5 px-4 bg-muted/40 border-b border-border flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMobileView("menu")}
              className="text-xs font-bold gap-1.5 text-brand-forest hover:bg-brand-forest/10 h-8 px-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Add More Items
            </Button>
            <span className="text-xs font-mono font-bold text-muted-foreground">
              {cart.reduce((s, i) => s + i.quantity, 0)} items in ticket
            </span>
          </div>
          {/* Order Header / Order Type Selector */}
          <div className="p-4 border-b border-border space-y-3 bg-secondary/15">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-brand-forest flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-brand-terracotta" />
                Current Ticket
              </span>
              <Badge variant="outline" className="text-xs font-mono">
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </Badge>
            </div>

            {/* Order Type Buttons */}
            <div className="grid grid-cols-3 gap-1 bg-muted/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setOrderType("dine_in_qr")}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  orderType === "dine_in_qr"
                    ? "bg-brand-forest text-brand-cream shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Dine-In Table
              </button>
              <button
                type="button"
                onClick={() => setOrderType("takeaway")}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  orderType === "takeaway"
                    ? "bg-brand-forest text-brand-cream shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Takeaway
              </button>
              <button
                type="button"
                onClick={() => setOrderType("counter_pos")}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  orderType === "counter_pos"
                    ? "bg-brand-forest text-brand-cream shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Counter
              </button>
            </div>

            {/* Table Selector (if Dine-In) */}
            {orderType === "dine_in_qr" && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">Select Dining Table:</label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand-forest focus:outline-none focus:ring-1 focus:ring-brand-forest"
                >
                  {DEMO_TABLES.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.table_label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Optional Customer info */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Input
                placeholder="Customer Name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-8 text-xs bg-card"
              />
              <Input
                placeholder="Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-8 text-xs bg-card font-mono"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-border/60 max-h-[35vh] lg:max-h-[38vh]">
            {cart.map((line, idx) => (
              <div key={line.id} className={idx > 0 ? "pt-2.5" : ""}>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="font-extrabold text-xs text-brand-charcoal leading-tight">
                      {line.item.name}
                    </p>
                    {line.selectedVariant && (
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Size: {line.selectedVariant.name}
                      </p>
                    )}
                    {line.selectedAddons.length > 0 && (
                      <p className="text-[10px] text-brand-terracotta font-medium">
                        + {line.selectedAddons.map((a) => a.name).join(", ")}
                      </p>
                    )}
                    {line.itemNotes && (
                      <p className="text-[10px] text-amber-800 italic">
                        Note: &ldquo;{line.itemNotes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-xs">
                      {formatBDT(line.lineTotal)}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      @{line.unitPrice}
                    </p>
                  </div>
                </div>

                {/* Quantity Controls & Delete */}
                <div className="flex items-center justify-between mt-2 pt-1">
                  <div className="flex items-center gap-1.5 bg-muted rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.id, -1)}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-xs">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.id, 1)}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLineItem(line.id)}
                    className="text-muted-foreground hover:text-red-600 p-1 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-8 text-center text-muted-foreground space-y-1">
                <ShoppingCart className="w-8 h-8 mx-auto opacity-30 text-brand-forest" />
                <p className="text-xs font-bold">Ticket is empty</p>
                <p className="text-[11px]">Click menu items on the left to add.</p>
              </div>
            )}
          </div>

          {/* Discount & Totals Breakdown */}
          <div className="p-4 border-t border-border bg-muted/20 space-y-2.5">
            {/* Discount Row */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                <Tag className="w-3.5 h-3.5 text-brand-terracotta" />
                Discount:
              </div>
              <div className="flex-1 flex items-center gap-1">
                <Input
                  type="number"
                  placeholder={discountType === "flat" ? "৳ Flat" : "% Off"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="h-7 text-xs font-mono font-bold bg-card"
                />
                <button
                  type="button"
                  onClick={() => setDiscountType((prev) => (prev === "flat" ? "percent" : "flat"))}
                  className="px-2 h-7 rounded border border-border bg-card text-xs font-bold hover:bg-muted transition-colors text-brand-forest"
                >
                  {discountType === "flat" ? "৳" : "%"}
                </button>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1 text-xs text-brand-charcoal/80 pt-1 border-t border-border/50">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">{formatBDT(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-brand-terracotta font-bold">
                  <span>Discount:</span>
                  <span className="font-mono">- {formatBDT(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>VAT (5% {DEMO_RESTAURANT.is_vat_inclusive ? "Inclusive" : ""}):</span>
                <span className="font-mono">{formatBDT(vatAmount)}</span>
              </div>
              {serviceChargeAmount > 0 && (
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Service Charge (10%):</span>
                  <span className="font-mono">{formatBDT(serviceChargeAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-brand-forest pt-1 border-t border-brand-forest/20">
                <span>Grand Total:</span>
                <span className="font-mono">{formatBDT(grandTotal)}</span>
              </div>
            </div>

            {/* Order Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSendToKitchen}
                disabled={cart.length === 0 || isSubmitting}
                className="border-brand-forest/30 hover:border-brand-forest hover:bg-brand-forest/5 text-brand-forest font-bold text-xs h-10 gap-1.5"
              >
                <ChefHat className="w-4 h-4 text-brand-terracotta" />
                Send to Kitchen (Pay Later)
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleCollectPayment}
                disabled={cart.length === 0 || isSubmitting}
                className="bg-brand-forest hover:bg-brand-forest/90 text-brand-cream font-bold text-xs h-10 gap-1.5 shadow"
              >
                <Receipt className="w-4 h-4 text-brand-terracotta" />
                Collect & Print
              </Button>
            </div>

            {cart.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="w-full text-[11px] text-muted-foreground hover:text-red-600 h-6"
              >
                Clear Cart
              </Button>
            )}
          </div>
        </aside>
      </div>

      {/* Item Customization Modal */}
      {customizingItem && (
        <Dialog open={true} onOpenChange={() => setCustomizingItem(null)}>
          <DialogContent className="max-w-md p-6 space-y-4">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg font-black text-brand-forest">
                Customize {customizingItem.name}
              </DialogTitle>
              {customizingItem.description && (
                <DialogDescription className="text-xs text-muted-foreground">
                  {customizingItem.description}
                </DialogDescription>
              )}
            </DialogHeader>

            {/* Variants Selector */}
            {customizingItem.variants.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-charcoal">
                  Select Size / Portion (Required):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {customizingItem.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setTempVariant(v)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex justify-between items-center transition-all ${
                        tempVariant?.id === v.id
                          ? "border-brand-forest bg-brand-forest/10 text-brand-forest ring-1 ring-brand-forest"
                          : "border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <span>{v.name}</span>
                      <span className="font-mono text-[11px]">
                        {v.price_delta > 0 ? `+৳${v.price_delta}` : "Base"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Addons Selector */}
            {customizingItem.addons.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-charcoal">
                  Add-ons & Extras (Optional):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {customizingItem.addons.map((addon) => {
                    const isSelected = tempAddons.some((a) => a.id === addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => {
                          setTempAddons((prev) =>
                            isSelected
                              ? prev.filter((a) => a.id !== addon.id)
                              : [...prev, addon]
                          );
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex justify-between items-center transition-all ${
                          isSelected
                            ? "border-brand-terracotta bg-brand-terracotta/10 text-brand-terracotta ring-1 ring-brand-terracotta"
                            : "border-border hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <span>{addon.name}</span>
                        <span className="font-mono text-[11px]">+৳{addon.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity & Notes */}
            <div className="space-y-2 pt-1 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Quantity:</span>
                <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setTempQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded bg-card flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-sm">
                    {tempQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTempQuantity((q) => q + 1)}
                    className="w-7 h-7 rounded bg-card flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <Input
                placeholder="Kitchen note (e.g. 'Less ice, extra hot')..."
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCustomizingItem(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmCustomization}
                className="bg-brand-forest hover:bg-brand-forest/90 text-brand-cream font-bold"
              >
                Add to Ticket (
                {formatBDT(
                  (customizingItem.base_price +
                    (tempVariant?.price_delta || 0) +
                    tempAddons.reduce((s, a) => s + a.price, 0)) *
                    tempQuantity
                )}
                )
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Settlement Modal */}
      <SettlePaymentDialog
        order={settlingOrder}
        isOpen={isSettleModalOpen}
        onClose={() => {
          setIsSettleModalOpen(false);
          setSettlingOrder(null);
        }}
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
