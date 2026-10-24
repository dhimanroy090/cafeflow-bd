import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { memoryDashboardOrders } from "../route";
import type { OrderStatus, PaymentStatus } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ orderId: string }>;
}

const updateOrderSchema = z.object({
  status: z
    .enum(["unconfirmed", "pending", "accepted", "preparing", "ready", "served", "cancelled"])
    .optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
  paymentMethod: z.enum(["cash", "bkash", "nagad", "card", "unpaid"]).optional(),
  paymentReference: z.string().max(100).optional().nullable(),
  cancellationReason: z.string().max(300).optional(),
  actorName: z.string().max(100).optional().default("Staff"),
});

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const { orderId } = await params;

  try {
    const json = await request.json();
    const parsed = updateOrderSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid update payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, paymentStatus, paymentMethod, paymentReference, cancellationReason, actorName } = parsed.data;
    const supabase = createAdminClient();

    const updates: {
      status?: OrderStatus;
      payment_status?: PaymentStatus;
      payment_method?: "cash" | "bkash" | "nagad" | "card" | "unpaid";
      payment_reference?: string | null;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (status) updates.status = status;
    if (paymentStatus) updates.payment_status = paymentStatus;
    if (paymentMethod) updates.payment_method = paymentMethod;
    if (paymentReference !== undefined) updates.payment_reference = paymentReference;

    // 1. Update in-memory fallback
    let existingOrder = memoryDashboardOrders.get(orderId);
    if (existingOrder) {
      const updated = {
        ...existingOrder,
        ...updates,
      };
      memoryDashboardOrders.set(orderId, updated);
      existingOrder = updated;
    }

    // 2. Update Supabase Database
    try {
      await supabase.from("orders").update(updates).eq("id", orderId);

      // If cancelling, log in audit_logs
      if (status === "cancelled") {
        await supabase.from("audit_logs").insert({
          action: "order_cancelled",
          entity_type: "order",
          entity_id: orderId,
          metadata: {
            reason: cancellationReason || "Cancelled by staff/manager",
            actor: actorName,
            order_number: existingOrder?.order_number,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // If settling payment, log in audit_logs
      if (paymentStatus === "paid") {
        await supabase.from("audit_logs").insert({
          action: "payment_settled",
          entity_type: "order",
          entity_id: orderId,
          metadata: {
            order_number: existingOrder?.order_number,
            payment_method: paymentMethod || existingOrder?.payment_method || "cash",
            payment_reference: paymentReference || null,
            total_amount: existingOrder?.total_amount,
            actor: actorName,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch {
      // Ignore database sync failure if running in fallback mode
    }

    return NextResponse.json({
      success: true,
      message: `Order updated to ${status || paymentStatus}`,
      orderId,
      status: updates.status,
      paymentStatus: updates.payment_status,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to update order" },
      { status: 500 }
    );
  }
}
