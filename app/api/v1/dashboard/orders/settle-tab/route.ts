import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { memoryDashboardOrders } from "@/lib/orders/memory-store";
import type { PaymentMethod } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

const settleTabSchema = z.object({
  tableId: z.string().optional(),
  tableLabel: z.string().optional(),
  orderIds: z.array(z.string()).min(1, "At least one order must be selected"),
  paymentMethod: z.enum(["cash", "bkash", "nagad", "card"]),
  paymentReference: z.string().max(100).optional().nullable(),
  actorName: z.string().max(100).optional().default("Cashier"),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = settleTabSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid settlement payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { tableLabel, orderIds, paymentMethod, paymentReference, actorName } = parsed.data;
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    let combinedAmount = 0;
    const settledOrderNumbers: string[] = [];

    // 1. Update in-memory orders
    for (const orderId of orderIds) {
      const order = memoryDashboardOrders.get(orderId);
      if (order) {
        order.payment_status = "paid";
        order.payment_method = paymentMethod as PaymentMethod;
        order.payment_reference = paymentReference || null;
        order.updated_at = now;
        combinedAmount += order.total_amount;
        settledOrderNumbers.push(order.order_number);
        memoryDashboardOrders.set(orderId, { ...order });
      }
    }

    // 2. Update Supabase
    try {
      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_method: paymentMethod,
          payment_reference: paymentReference || null,
          updated_at: now,
        })
        .in("id", orderIds);

      // Log combined audit entry
      await supabase.from("audit_logs").insert({
        action: "table_tab_settled",
        entity_type: "table_tab",
        entity_id: orderIds[0],
        metadata: {
          table_label: tableLabel || "Dine-In Table",
          order_ids: orderIds,
          order_numbers: settledOrderNumbers,
          orders_count: orderIds.length,
          combined_amount: combinedAmount,
          payment_method: paymentMethod,
          payment_reference: paymentReference || null,
          actor: actorName,
          timestamp: now,
        },
      });
    } catch {
      // Ignore if offline
    }

    return NextResponse.json({
      success: true,
      message: `Table tab settled for ${orderIds.length} orders (${settledOrderNumbers.join(", ")})`,
      combinedAmount,
      settledOrdersCount: orderIds.length,
      settledOrderNumbers,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to settle table tab" },
      { status: 500 }
    );
  }
}
