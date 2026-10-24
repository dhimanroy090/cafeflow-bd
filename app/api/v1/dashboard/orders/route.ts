import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { DEMO_RESTAURANT } from "@/features/menu/demo-menu-data";
import {
  memoryDashboardOrders,
  type DashboardOrderWithItems,
} from "@/lib/orders/memory-store";
import type {
  OrderItemRow,
  OrderStatus,
  OrderType,
  PaymentStatus,
  PaymentMethod,
} from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId") || DEMO_RESTAURANT.id;
  const statusFilter = searchParams.get("status");

  try {
    const supabase = createAdminClient();

    let query = supabase
      .from("orders")
      .select("*, order_items(*), restaurant_tables(table_label)")
      .eq("restaurant_id", restaurantId)
      .neq("status", "served")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter as OrderStatus);
    }

    const { data: dbOrders, error } = await query;

    if (!error && dbOrders && dbOrders.length > 0) {
      const formatted: DashboardOrderWithItems[] = dbOrders.map((o) => ({
        ...o,
        tableLabel: (o.restaurant_tables as { table_label?: string })?.table_label || (o.order_type === "takeaway" ? "Takeaway" : "Counter"),
        items: o.order_items || [],
      }));

      return NextResponse.json({
        success: true,
        orders: formatted,
        source: "database",
      });
    }
  } catch {
    // Proceed to fallback below
  }

  // Fallback to in-memory orders
  const fallbackOrders = Array.from(memoryDashboardOrders.values())
    .filter((o) => {
      if (statusFilter && statusFilter !== "all") {
        return o.status === statusFilter;
      }
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({
    success: true,
    orders: fallbackOrders,
    source: "memory_fallback",
  });
}

// Allows creating POS counter orders or simulating new test orders
export async function POST(request: NextRequest) {
  try {
    // Entitlement Check: Block order creation if subscription is suspended
    if (DEMO_RESTAURANT.subscription_status === "suspended") {
      return NextResponse.json(
        {
          success: false,
          error: "Restaurant subscription is currently suspended. Please renew via /dashboard/billing to accept new orders.",
        },
        { status: 403 }
      );
    }

    let body: Record<string, unknown> | null = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }

    const newOrderNumber = `#CF-${Math.floor(100 + Math.random() * 900)}`;
    const newOrderId = crypto.randomUUID();
    const publicTrackingToken = crypto.randomUUID();
    const now = new Date().toISOString();

    let newOrder: DashboardOrderWithItems;

    if (body && Array.isArray(body.items) && body.items.length > 0) {
      // Custom Counter POS / Takeaway order
      const orderType = (body.orderType as OrderType) || "counter_pos";
      const tableId = (body.tableId as string) || null;
      const tableLabel = (body.tableLabel as string) || (orderType === "takeaway" ? "Takeaway" : "Counter POS");
      const customerName = (body.customerName as string) || null;
      const customerPhone = (body.customerPhone as string) || null;
      const specialNotes = (body.specialNotes as string) || null;
      const subtotal = Number(body.subtotal) || 0;
      const discountAmount = Number(body.discountAmount) || 0;
      const vatAmount = Number(body.vatAmount) || 0;
      const serviceChargeAmount = Number(body.serviceChargeAmount) || 0;
      const totalAmount = Number(body.totalAmount) || Math.max(0, subtotal - discountAmount + vatAmount + serviceChargeAmount);
      const paymentStatus = (body.paymentStatus as PaymentStatus) || "unpaid";
      const paymentMethod = (body.paymentMethod as PaymentMethod) || (paymentStatus === "paid" ? "cash" : "unpaid");
      const paymentReference = (body.paymentReference as string) || null;
      const initialStatus = (body.status as OrderStatus) || (paymentStatus === "paid" ? "accepted" : "pending");

      const items: OrderItemRow[] = (body.items as Array<{
        menu_item_id: string;
        item_name_snapshot: string;
        variant_name_snapshot?: string | null;
        unit_price_snapshot: number;
        addons_snapshot?: Array<{ name: string; price: number }>;
        quantity: number;
        line_total: number;
        item_notes?: string | null;
      }>).map((item, idx) => ({
        id: crypto.randomUUID(),
        order_id: newOrderId,
        restaurant_id: DEMO_RESTAURANT.id,
        menu_item_id: item.menu_item_id || `pos-item-${idx}`,
        item_name_snapshot: item.item_name_snapshot,
        variant_name_snapshot: item.variant_name_snapshot || null,
        unit_price_snapshot: item.unit_price_snapshot,
        addons_snapshot: item.addons_snapshot || [],
        quantity: item.quantity,
        line_total: item.line_total,
        item_notes: item.item_notes || null,
      }));

      newOrder = {
        id: newOrderId,
        restaurant_id: DEMO_RESTAURANT.id,
        table_id: tableId,
        order_number: newOrderNumber,
        order_type: orderType,
        status: initialStatus,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        customer_name: customerName,
        customer_phone: customerPhone,
        special_notes: specialNotes,
        subtotal,
        vat_amount: vatAmount,
        service_charge_amount: serviceChargeAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        client_idempotency_key: crypto.randomUUID(),
        public_tracking_token: publicTrackingToken,
        created_by: null,
        created_at: now,
        updated_at: now,
        tableLabel,
        items,
      };
    } else {
      // Default simulated order
      newOrder = {
        id: newOrderId,
        restaurant_id: DEMO_RESTAURANT.id,
        table_id: "table-04-uuid",
        order_number: newOrderNumber,
        order_type: "dine_in_qr",
        status: "pending",
        payment_status: "unpaid",
        payment_method: "unpaid",
        payment_reference: null,
        customer_name: "Walk-in Customer",
        customer_phone: null,
        special_notes: "Simulated test order via POS.",
        subtotal: 390,
        vat_amount: 18.57,
        service_charge_amount: 39,
        discount_amount: 0,
        total_amount: 429,
        client_idempotency_key: crypto.randomUUID(),
        public_tracking_token: publicTrackingToken,
        created_by: null,
        created_at: now,
        updated_at: now,
        tableLabel: "Table 04",
        items: [
          {
            id: crypto.randomUUID(),
            order_id: newOrderId,
            restaurant_id: DEMO_RESTAURANT.id,
            menu_item_id: "item-spanish-latte",
            item_name_snapshot: "Iced Spanish Cortado",
            variant_name_snapshot: "Regular Ice",
            unit_price_snapshot: 390,
            addons_snapshot: [],
            quantity: 1,
            line_total: 390,
            item_notes: null,
          },
        ],
      };
    }

    memoryDashboardOrders.set(newOrderId, newOrder);

    // Also attempt inserting into Supabase if connected
    try {
      const supabase = createAdminClient();
      const orderDbRow = {
        id: newOrder.id,
        restaurant_id: newOrder.restaurant_id,
        table_id: newOrder.table_id,
        order_number: newOrder.order_number,
        order_type: newOrder.order_type,
        status: newOrder.status,
        payment_status: newOrder.payment_status,
        payment_method: newOrder.payment_method,
        payment_reference: newOrder.payment_reference,
        customer_name: newOrder.customer_name,
        customer_phone: newOrder.customer_phone,
        special_notes: newOrder.special_notes,
        subtotal: newOrder.subtotal,
        vat_amount: newOrder.vat_amount,
        service_charge_amount: newOrder.service_charge_amount,
        discount_amount: newOrder.discount_amount,
        total_amount: newOrder.total_amount,
        client_idempotency_key: newOrder.client_idempotency_key,
        public_tracking_token: newOrder.public_tracking_token,
        created_by: newOrder.created_by,
        created_at: newOrder.created_at,
        updated_at: newOrder.updated_at,
      };
      await supabase.from("orders").insert(orderDbRow);
      await supabase.from("order_items").insert(newOrder.items);

      if (newOrder.payment_status === "paid") {
        await supabase.from("audit_logs").insert({
          action: "payment_settled",
          entity_type: "order",
          entity_id: newOrderId,
          metadata: {
            order_number: newOrder.order_number,
            payment_method: newOrder.payment_method,
            payment_reference: newOrder.payment_reference,
            total_amount: newOrder.total_amount,
            actor: "Counter POS",
            timestamp: now,
          },
        });
      }
    } catch {
      // Ignore
    }

    return NextResponse.json({
      success: true,
      message: `Order ${newOrder.order_number} created successfully.`,
      order: newOrder,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to create order" },
      { status: 500 }
    );
  }
}
