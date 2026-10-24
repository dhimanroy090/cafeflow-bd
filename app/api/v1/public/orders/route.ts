import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import {
  DEMO_RESTAURANT,
  DEMO_TABLES,
  DEMO_MENU_ITEMS,
} from "@/features/menu/demo-menu-data";
import type { OrderRow, OrderItemRow } from "@/lib/supabase/database.types";
import { roundCurrency, calculateOrderTotals } from "@/lib/orders/calculator";
import {
  memoryOrders,
  saveMemoryOrder,
} from "@/lib/orders/memory-store";

const orderItemSchema = z.object({
  menuItemId: z.string().min(1, "menuItemId is required"),
  variantId: z.string().optional(),
  addonIds: z.array(z.string()).optional().default([]),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(50),
  notes: z.string().max(200).optional(),
});

const createOrderSchema = z.object({
  restaurantSlug: z.string().min(1, "restaurantSlug is required"),
  tableToken: z.string().optional(),
  orderType: z.enum(["dine_in_qr", "counter_pos", "takeaway"]).default("dine_in_qr"),
  tablePin: z.string().optional(),
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().max(30).optional(),
  specialNotes: z.string().max(500).optional(),
  client_idempotency_key: z.string().min(10, "client_idempotency_key is required"),
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = createOrderSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid order payload",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const supabase = createAdminClient();

    // ------------------------------------------------------------------------
    // Step 1: Check Idempotency Key (Return existing order if already placed)
    // ------------------------------------------------------------------------
    try {
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id, order_number, public_tracking_token, status, total_amount, subtotal, vat_amount, service_charge_amount")
        .eq("client_idempotency_key", payload.client_idempotency_key)
        .maybeSingle();

      if (existingOrder) {
        return NextResponse.json({
          success: true,
          message: "Order already placed (idempotent response)",
          order: {
            id: existingOrder.id,
            orderNumber: existingOrder.order_number,
            publicTrackingToken: existingOrder.public_tracking_token,
            status: existingOrder.status,
            totalAmount: existingOrder.total_amount,
            subtotal: existingOrder.subtotal,
            vatAmount: existingOrder.vat_amount,
            serviceChargeAmount: existingOrder.service_charge_amount,
          },
        });
      }
    } catch {
      // Fallback in-memory idempotency check
      if (memoryOrders.has(payload.client_idempotency_key)) {
        const mem = memoryOrders.get(payload.client_idempotency_key)!;
        return NextResponse.json({
          success: true,
          message: "Order already placed (idempotent fallback response)",
          order: {
            id: mem.id,
            orderNumber: mem.order_number,
            publicTrackingToken: mem.public_tracking_token,
            status: mem.status,
            totalAmount: mem.total_amount,
            subtotal: mem.subtotal,
            vatAmount: mem.vat_amount,
            serviceChargeAmount: mem.service_charge_amount,
          },
        });
      }
    }

    // ------------------------------------------------------------------------
    // Step 2: Resolve & Validate Restaurant
    // ------------------------------------------------------------------------
    let restaurant = null;
    try {
      const { data: restDb } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", payload.restaurantSlug)
        .maybeSingle();

      restaurant = restDb;
    } catch {
      // Supabase not reachable, use demo fallback
    }

    if (!restaurant) {
      if (payload.restaurantSlug === DEMO_RESTAURANT.slug || payload.restaurantSlug === "dhabba-gulshan") {
        restaurant = DEMO_RESTAURANT;
      } else {
        return NextResponse.json(
          { success: false, error: "Restaurant not found." },
          { status: 404 }
        );
      }
    }

    if (!restaurant.is_accepting_orders) {
      return NextResponse.json(
        { success: false, error: "This restaurant is currently not accepting new orders." },
        { status: 400 }
      );
    }

    if (restaurant.subscription_status === "suspended") {
      return NextResponse.json(
        {
          success: false,
          error: "This restaurant's online QR ordering service is currently suspended pending renewal.",
        },
        { status: 403 }
      );
    }

    // ------------------------------------------------------------------------
    // Step 3: Validate Table & Table PIN
    // ------------------------------------------------------------------------
    let table = null;
    if (payload.orderType === "dine_in_qr") {
      if (!payload.tableToken) {
        return NextResponse.json(
          { success: false, error: "Table QR token is required for dine-in orders." },
          { status: 400 }
        );
      }

      try {
        const { data: tableDb } = await supabase
          .from("restaurant_tables")
          .select("*")
          .eq("restaurant_id", restaurant.id)
          .eq("qr_token", payload.tableToken)
          .maybeSingle();

        table = tableDb;
      } catch {
        // Fallback
      }

      if (!table) {
        table = DEMO_TABLES.find((t) => t.qr_token === payload.tableToken) || null;
      }

      if (!table || !table.is_active) {
        return NextResponse.json(
          { success: false, error: "Invalid or inactive table QR code." },
          { status: 400 }
        );
      }

      // Verify Table PIN if restaurant requires it
      if (restaurant.require_table_pin) {
        if (!payload.tablePin || payload.tablePin.trim() !== restaurant.daily_table_pin?.trim()) {
          return NextResponse.json(
            { success: false, error: "Incorrect Table PIN. Please check the 4-digit code on your table stand." },
            { status: 400 }
          );
        }
      }
    }

    // ------------------------------------------------------------------------
    // Step 4: Server-Authoritative Price Calculation
    // Never trust client prices! Fetch catalog directly from database.
    // ------------------------------------------------------------------------
    const calculatedLineItems: Array<{
      menuItem: { id: string; name: string; base_price: number };
      variant?: { id: string; name: string; price_delta: number };
      addons: Array<{ id: string; name: string; price: number }>;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      notes?: string;
    }> = [];

    // Attempt DB fetch or fallback to demo catalog
    try {
      const itemIds = payload.items.map((i) => i.menuItemId);
      const { data: dbItems } = await supabase
        .from("menu_items")
        .select("*, item_variants(*), item_addons(*)")
        .eq("restaurant_id", restaurant.id)
        .in("id", itemIds)
        .eq("is_archived", false)
        .eq("is_available", true);

      if (dbItems && dbItems.length > 0) {
        for (const reqItem of payload.items) {
          const item = dbItems.find((i) => i.id === reqItem.menuItemId);
          if (!item) {
            return NextResponse.json(
              { success: false, error: `One or more items are no longer available on the menu.` },
              { status: 400 }
            );
          }

          let matchedVariant: { id: string; name: string; price_delta: number } | undefined = undefined;
          if (reqItem.variantId) {
            const v = (item.item_variants || []).find((v: { id: string }) => v.id === reqItem.variantId);
            if (!v || !v.is_available) {
              return NextResponse.json(
                { success: false, error: `Selected size for "${item.name}" is currently unavailable.` },
                { status: 400 }
              );
            }
            matchedVariant = { id: v.id, name: v.name, price_delta: Number(v.price_delta) };
          }

          const matchedAddons: Array<{ id: string; name: string; price: number }> = [];
          if (reqItem.addonIds && reqItem.addonIds.length > 0) {
            for (const addId of reqItem.addonIds) {
              const a = (item.item_addons || []).find((a: { id: string }) => a.id === addId);
              if (!a || !a.is_available) {
                return NextResponse.json(
                  { success: false, error: `An extra customization for "${item.name}" is unavailable.` },
                  { status: 400 }
                );
              }
              matchedAddons.push({ id: a.id, name: a.name, price: Number(a.price) });
            }
          }

          const basePrice = Number(item.base_price);
          const variantDelta = matchedVariant ? matchedVariant.price_delta : 0;
          const addonsSum = matchedAddons.reduce((s, a) => s + a.price, 0);
          const unitPrice = roundCurrency(basePrice + variantDelta + addonsSum);
          const lineTotal = roundCurrency(unitPrice * reqItem.quantity);

          calculatedLineItems.push({
            menuItem: { id: item.id, name: item.name, base_price: basePrice },
            variant: matchedVariant,
            addons: matchedAddons,
            quantity: reqItem.quantity,
            unitPrice,
            lineTotal,
            notes: reqItem.notes,
          });
        }
      }
    } catch {
      // Will proceed to fallback below if calculatedLineItems is empty
    }

    // Fallback calculation using DEMO_MENU_ITEMS
    if (calculatedLineItems.length === 0) {
      for (const reqItem of payload.items) {
        const item = DEMO_MENU_ITEMS.find((i) => i.id === reqItem.menuItemId);
        if (!item) {
          return NextResponse.json(
            { success: false, error: "Item not found in menu." },
            { status: 400 }
          );
        }

        let matchedVariant: { id: string; name: string; price_delta: number } | undefined = undefined;
        if (reqItem.variantId) {
          const v = item.variants.find((v) => v.id === reqItem.variantId);
          if (v) {
            matchedVariant = { id: v.id, name: v.name, price_delta: Number(v.price_delta) };
          }
        }

        const matchedAddons: Array<{ id: string; name: string; price: number }> = [];
        if (reqItem.addonIds && reqItem.addonIds.length > 0) {
          for (const addId of reqItem.addonIds) {
            const a = item.addons.find((a) => a.id === addId);
            if (a) {
              matchedAddons.push({ id: a.id, name: a.name, price: Number(a.price) });
            }
          }
        }

        const basePrice = Number(item.base_price);
        const variantDelta = matchedVariant ? matchedVariant.price_delta : 0;
        const addonsSum = matchedAddons.reduce((s, a) => s + a.price, 0);
        const unitPrice = roundCurrency(basePrice + variantDelta + addonsSum);
        const lineTotal = roundCurrency(unitPrice * reqItem.quantity);

        calculatedLineItems.push({
          menuItem: { id: item.id, name: item.name, base_price: basePrice },
          variant: matchedVariant,
          addons: matchedAddons,
          quantity: reqItem.quantity,
          unitPrice,
          lineTotal,
          notes: reqItem.notes,
        });
      }
    }

    // ------------------------------------------------------------------------
    // Step 5: Compute Subtotal, Service Charge & VAT Authoritatively
    // ------------------------------------------------------------------------
    const orderCalc = calculateOrderTotals({
      items: calculatedLineItems.map((cli) => ({
        basePrice: cli.menuItem.base_price,
        variantDelta: cli.variant?.price_delta,
        addonPrices: cli.addons.map((a) => a.price),
        quantity: cli.quantity,
      })),
      vatPercentage: Number(restaurant.vat_percentage || 0),
      isVatInclusive: !!restaurant.is_vat_inclusive,
      serviceChargePercentage: Number(restaurant.service_charge_percentage || 0),
      orderType: payload.orderType,
      waiveServiceChargeForTakeaway: true,
    });

    const subtotal = orderCalc.subtotal;
    const vatAmount = orderCalc.vatAmount;
    const serviceChargeAmount = orderCalc.serviceChargeAmount;
    const totalAmount = orderCalc.grandTotal;

    // Generate human-readable order number, e.g. #CF-304
    const orderNumber = `#CF-${Math.floor(100 + Math.random() * 900)}`;
    const publicTrackingToken = crypto.randomUUID();
    const orderId = crypto.randomUUID();

    const orderRow: OrderRow = {
      id: orderId,
      restaurant_id: restaurant.id,
      table_id: table ? table.id : null,
      order_number: orderNumber,
      order_type: payload.orderType,
      status: "pending",
      payment_status: "unpaid",
      payment_method: "unpaid",
      payment_reference: null,
      customer_name: payload.customerName || null,
      customer_phone: payload.customerPhone || null,
      special_notes: payload.specialNotes || null,
      subtotal,
      vat_amount: vatAmount,
      service_charge_amount: serviceChargeAmount,
      discount_amount: 0,
      total_amount: totalAmount,
      client_idempotency_key: payload.client_idempotency_key,
      public_tracking_token: publicTrackingToken,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const orderItemRows: OrderItemRow[] = calculatedLineItems.map((li) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      restaurant_id: restaurant.id,
      menu_item_id: li.menuItem.id,
      item_name_snapshot: li.menuItem.name,
      variant_name_snapshot: li.variant ? li.variant.name : null,
      unit_price_snapshot: li.unitPrice,
      addons_snapshot: li.addons.map((a) => ({ name: a.name, price: a.price })),
      quantity: li.quantity,
      line_total: li.lineTotal,
      item_notes: li.notes || null,
    }));

    // ------------------------------------------------------------------------
    // Step 6: Atomic Insert into Supabase (with In-Memory Store Fallback)
    // ------------------------------------------------------------------------
    let insertedInDb = false;
    try {
      const { error: orderErr } = await supabase.from("orders").insert(orderRow);
      if (!orderErr) {
        await supabase.from("order_items").insert(orderItemRows);
        insertedInDb = true;
      }
    } catch {
      // Fallback below
    }

    // Save in global memory store so live tracking page, idempotency, and KDS update seamlessly
    saveMemoryOrder({
      ...orderRow,
      items: orderItemRows,
      tableLabel: table ? table.table_label : "Takeaway",
    });

    return NextResponse.json({
      success: true,
      message: "Order placed successfully.",
      order: {
        id: orderRow.id,
        orderNumber: orderRow.order_number,
        publicTrackingToken: orderRow.public_tracking_token,
        status: orderRow.status,
        totalAmount: orderRow.total_amount,
        subtotal: orderRow.subtotal,
        vatAmount: orderRow.vat_amount,
        serviceChargeAmount: orderRow.service_charge_amount,
        tableLabel: table ? table.table_label : "Takeaway",
        itemCount: calculatedLineItems.reduce((s, i) => s + i.quantity, 0),
        databaseSynced: insertedInDb,
      },
    });
  } catch (error: unknown) {
    console.error("[CreateOrder Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error occurred while processing order.",
      },
      { status: 500 }
    );
  }
}
