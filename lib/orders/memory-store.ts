import type { OrderRow, OrderItemRow } from "@/lib/supabase/database.types";
import { DEMO_RESTAURANT } from "@/features/menu/demo-menu-data";

export interface DashboardOrderWithItems extends OrderRow {
  tableLabel: string;
  items: OrderItemRow[];
}

// Global persistent state across Next.js route compilation boundaries
declare global {
  // eslint-disable-next-line no-var
  var __cafeflow_memory_orders__: Map<string, OrderRow & { items: OrderItemRow[]; tableLabel?: string }> | undefined;
  // eslint-disable-next-line no-var
  var __cafeflow_dashboard_orders__: Map<string, DashboardOrderWithItems> | undefined;
}

if (!globalThis.__cafeflow_memory_orders__) {
  globalThis.__cafeflow_memory_orders__ = new Map();
}

if (!globalThis.__cafeflow_dashboard_orders__) {
  globalThis.__cafeflow_dashboard_orders__ = new Map();

  // Populate realistic seeds
  const seed1Id = "seed-order-1";
  const seed2Id = "seed-order-2";
  const seed3Id = "seed-order-3";

  const tenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000).toISOString();
  const fourMinutesAgo = new Date(Date.now() - 4 * 60 * 1000).toISOString();
  const sixteenMinutesAgo = new Date(Date.now() - 16 * 60 * 1000).toISOString();

  const seed1: DashboardOrderWithItems = {
    id: seed1Id,
    restaurant_id: DEMO_RESTAURANT.id,
    table_id: "table-04-uuid",
    order_number: "#CF-104",
    order_type: "dine_in_qr",
    status: "pending",
    payment_status: "unpaid",
    payment_method: "unpaid",
    payment_reference: null,
    customer_name: "Tanvir Ahmed",
    customer_phone: "01711223344",
    special_notes: "Please make the Flat White extra hot, less sugar.",
    subtotal: 780,
    vat_amount: 37.14,
    service_charge_amount: 78,
    discount_amount: 0,
    total_amount: 858,
    client_idempotency_key: "idem-seed-1",
    public_tracking_token: "track-seed-1",
    created_by: null,
    created_at: fourMinutesAgo,
    updated_at: fourMinutesAgo,
    tableLabel: "Table 04",
    items: [
      {
        id: "item-seed-1-1",
        order_id: seed1Id,
        restaurant_id: DEMO_RESTAURANT.id,
        menu_item_id: "item-flat-white",
        item_name_snapshot: "Silky Flat White",
        variant_name_snapshot: "Double Shot Mug (10oz)",
        unit_price_snapshot: 440,
        addons_snapshot: [{ name: "Barista Oat Milk", price: 90 }],
        quantity: 1,
        line_total: 530,
        item_notes: "Extra hot",
      },
      {
        id: "item-seed-1-2",
        order_id: seed1Id,
        restaurant_id: DEMO_RESTAURANT.id,
        menu_item_id: "item-butter-croissant",
        item_name_snapshot: "French Butter Croissant",
        variant_name_snapshot: null,
        unit_price_snapshot: 240,
        addons_snapshot: [{ name: "Organic Strawberry Preserve", price: 40 }],
        quantity: 1,
        line_total: 280,
        item_notes: null,
      },
    ],
  };

  const seed2: DashboardOrderWithItems = {
    id: seed2Id,
    restaurant_id: DEMO_RESTAURANT.id,
    table_id: "table-01-uuid",
    order_number: "#CF-105",
    order_type: "dine_in_qr",
    status: "preparing",
    payment_status: "unpaid",
    payment_method: "unpaid",
    payment_reference: null,
    customer_name: "Ayesha Siddiqua",
    customer_phone: "01812345678",
    special_notes: "Serving together with dessert.",
    subtotal: 1070,
    vat_amount: 50.95,
    service_charge_amount: 107,
    discount_amount: 0,
    total_amount: 1177,
    client_idempotency_key: "idem-seed-2",
    public_tracking_token: "track-seed-2",
    created_by: null,
    created_at: tenMinutesAgo,
    updated_at: tenMinutesAgo,
    tableLabel: "Table 01",
    items: [
      {
        id: "item-seed-2-1",
        order_id: seed2Id,
        restaurant_id: DEMO_RESTAURANT.id,
        menu_item_id: "item-tiramisu-latte",
        item_name_snapshot: "Tiramisu Foam Iced Latte",
        variant_name_snapshot: "Large (16oz)",
        unit_price_snapshot: 550,
        addons_snapshot: [{ name: "Extra Espresso Shot", price: 70 }],
        quantity: 1,
        line_total: 620,
        item_notes: "Less sweet please",
      },
      {
        id: "item-seed-2-2",
        order_id: seed2Id,
        restaurant_id: DEMO_RESTAURANT.id,
        menu_item_id: "item-pistachio-roll",
        item_name_snapshot: "Cardamom & Pistachio Roll",
        variant_name_snapshot: null,
        unit_price_snapshot: 380,
        addons_snapshot: [],
        quantity: 1,
        line_total: 380,
        item_notes: null,
      },
    ],
  };

  const seed3: DashboardOrderWithItems = {
    id: seed3Id,
    restaurant_id: DEMO_RESTAURANT.id,
    table_id: null,
    order_number: "#CF-106",
    order_type: "takeaway",
    status: "ready",
    payment_status: "paid",
    payment_method: "bkash",
    payment_reference: "BK99214A",
    customer_name: "Fahim Shahriar",
    customer_phone: "01999887766",
    special_notes: null,
    subtotal: 420,
    vat_amount: 20,
    service_charge_amount: 0,
    discount_amount: 0,
    total_amount: 420,
    client_idempotency_key: "idem-seed-3",
    public_tracking_token: "track-seed-3",
    created_by: null,
    created_at: sixteenMinutesAgo,
    updated_at: sixteenMinutesAgo,
    tableLabel: "Takeaway",
    items: [
      {
        id: "item-seed-3-1",
        order_id: seed3Id,
        restaurant_id: DEMO_RESTAURANT.id,
        menu_item_id: "item-spanish-latte",
        item_name_snapshot: "Spanish Condensed Latte",
        variant_name_snapshot: "Regular (12oz)",
        unit_price_snapshot: 420,
        addons_snapshot: [],
        quantity: 1,
        line_total: 420,
        item_notes: null,
      },
    ],
  };

  globalThis.__cafeflow_dashboard_orders__.set(seed1Id, seed1);
  globalThis.__cafeflow_dashboard_orders__.set(seed2Id, seed2);
  globalThis.__cafeflow_dashboard_orders__.set(seed3Id, seed3);

  // Also index seeds by tracking token & idempotency key
  globalThis.__cafeflow_memory_orders__.set(seed1.public_tracking_token, seed1);
  globalThis.__cafeflow_memory_orders__.set(seed1.client_idempotency_key, seed1);
  globalThis.__cafeflow_memory_orders__.set(seed2.public_tracking_token, seed2);
  globalThis.__cafeflow_memory_orders__.set(seed2.client_idempotency_key, seed2);
  globalThis.__cafeflow_memory_orders__.set(seed3.public_tracking_token, seed3);
  globalThis.__cafeflow_memory_orders__.set(seed3.client_idempotency_key, seed3);
}

export const memoryOrders = globalThis.__cafeflow_memory_orders__!;
export const memoryDashboardOrders = globalThis.__cafeflow_dashboard_orders__!;

/**
 * Stores a new order in memory, ensuring both public tracking tokens,
 * idempotency keys, and dashboard order queues are instantly updated.
 */
export function saveMemoryOrder(
  order: OrderRow & { items: OrderItemRow[]; tableLabel?: string }
) {
  // Index by tracking token for customer live tracking page
  memoryOrders.set(order.public_tracking_token, order);
  // Index by idempotency key to prevent double charging
  memoryOrders.set(order.client_idempotency_key, order);

  // Sync to dashboard orders so KDS and cashier screens show it immediately
  const dashboardOrder: DashboardOrderWithItems = {
    ...order,
    tableLabel: order.tableLabel || "Table Order",
    items: order.items,
  };
  memoryDashboardOrders.set(order.id, dashboardOrder);
}

/**
 * Retrieves an order by public tracking token or idempotency key.
 */
export function getMemoryOrder(tokenOrKey: string) {
  return memoryOrders.get(tokenOrKey) || null;
}
