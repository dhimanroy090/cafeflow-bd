"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { FullMenuItem } from "@/features/menu/demo-menu-data";
import type { ItemVariantRow, ItemAddonRow, RestaurantRow } from "@/lib/supabase/database.types";

export interface CartItem {
  id: string; // unique line-item id
  item: FullMenuItem;
  variant?: ItemVariantRow;
  addons: ItemAddonRow[];
  notes?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CartTotals {
  subtotal: number;
  vatAmount: number;
  serviceChargeAmount: number;
  grandTotal: number;
  itemCount: number;
}

interface CartContextType {
  items: CartItem[];
  restaurantSlug: string;
  tableToken: string | null;
  idempotencyKey: string;
  customerName: string;
  customerPhone: string;
  tablePin: string;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addItem: (
    item: FullMenuItem,
    variant: ItemVariantRow | undefined,
    addons: ItemAddonRow[],
    quantity: number,
    notes?: string
  ) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  regenerateIdempotencyKey: () => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setTablePin: (pin: string) => void;
  calculateTotals: (restaurant: RestaurantRow) => CartTotals;
}

const CartContext = createContext<CartContextType | null>(null);

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function computeItemLineTotal(
  basePrice: number,
  variant: ItemVariantRow | undefined,
  addons: ItemAddonRow[],
  quantity: number
): { unitPrice: number; lineTotal: number } {
  const variantDelta = variant ? Number(variant.price_delta) : 0;
  const addonsTotal = addons.reduce((sum, a) => sum + Number(a.price), 0);
  const unitPrice = Number(basePrice) + variantDelta + addonsTotal;
  const lineTotal = unitPrice * quantity;
  return { unitPrice, lineTotal };
}

export function CartProvider({
  restaurantSlug,
  tableToken,
  children,
}: {
  restaurantSlug: string;
  tableToken: string | null;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(generateUUID());
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [tablePin, setTablePin] = useState<string>("");
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  const storageKey = useMemo(
    () => `cafeflow_cart_${restaurantSlug}_${tableToken || "takeaway"}`,
    [restaurantSlug, tableToken]
  );

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.items)) {
          setItems(parsed.items);
        }
        if (parsed.idempotencyKey) {
          setIdempotencyKey(parsed.idempotencyKey);
        }
        if (parsed.customerName) setCustomerName(parsed.customerName);
        if (parsed.customerPhone) setCustomerPhone(parsed.customerPhone);
      }
    } catch {
      // Ignore storage read error
    } finally {
      setHasLoaded(true);
    }
  }, [storageKey]);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (!hasLoaded) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          items,
          idempotencyKey,
          customerName,
          customerPhone,
        })
      );
    } catch {
      // Ignore storage write error
    }
  }, [items, idempotencyKey, customerName, customerPhone, hasLoaded, storageKey]);

  const regenerateIdempotencyKey = useCallback(() => {
    setIdempotencyKey(generateUUID());
  }, []);

  const addItem = useCallback(
    (
      item: FullMenuItem,
      variant: ItemVariantRow | undefined,
      addons: ItemAddonRow[],
      quantity: number,
      notes?: string
    ) => {
      const { unitPrice, lineTotal } = computeItemLineTotal(
        item.base_price,
        variant,
        addons,
        quantity
      );

      // Check if exact same item with same variant and addons already exists in cart
      setItems((prev) => {
        const addonIds = addons.map((a) => a.id).sort().join(",");
        const existingIndex = prev.findIndex((ci) => {
          const matchItem = ci.item.id === item.id;
          const matchVariant = ci.variant?.id === variant?.id;
          const matchAddons = ci.addons.map((a) => a.id).sort().join(",") === addonIds;
          const matchNotes = (ci.notes || "") === (notes || "");
          return matchItem && matchVariant && matchAddons && matchNotes;
        });

        if (existingIndex > -1) {
          const updated = [...prev];
          const current = updated[existingIndex];
          const newQty = current.quantity + quantity;
          updated[existingIndex] = {
            ...current,
            quantity: newQty,
            lineTotal: current.unitPrice * newQty,
          };
          return updated;
        }

        const newItem: CartItem = {
          id: generateUUID(),
          item,
          variant,
          addons,
          notes,
          quantity,
          unitPrice,
          lineTotal,
        };
        return [...prev, newItem];
      });
    },
    []
  );

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.id !== cartItemId);
      }
      return prev.map((i) => {
        if (i.id === cartItemId) {
          return {
            ...i,
            quantity,
            lineTotal: i.unitPrice * quantity,
          };
        }
        return i;
      });
    });
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    regenerateIdempotencyKey();
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
  }, [regenerateIdempotencyKey, storageKey]);

  const calculateTotals = useCallback(
    (restaurant: RestaurantRow): CartTotals => {
      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      const serviceChargePct = Number(restaurant.service_charge_percentage || 0);
      const serviceChargeAmount = Math.round(subtotal * (serviceChargePct / 100));

      const vatPct = Number(restaurant.vat_percentage || 0);
      let vatAmount = 0;
      let grandTotal = 0;

      if (restaurant.is_vat_inclusive) {
        // VAT is included in item prices
        if (vatPct > 0) {
          vatAmount = Math.round(subtotal - subtotal / (1 + vatPct / 100));
        }
        grandTotal = subtotal + serviceChargeAmount;
      } else {
        // VAT is added on top
        vatAmount = Math.round(subtotal * (vatPct / 100));
        grandTotal = subtotal + vatAmount + serviceChargeAmount;
      }

      return {
        subtotal,
        vatAmount,
        serviceChargeAmount,
        grandTotal,
        itemCount,
      };
    },
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantSlug,
        tableToken,
        idempotencyKey,
        customerName,
        customerPhone,
        tablePin,
        isCartOpen,
        setIsCartOpen,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        regenerateIdempotencyKey,
        setCustomerName,
        setCustomerPhone,
        setTablePin,
        calculateTotals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
