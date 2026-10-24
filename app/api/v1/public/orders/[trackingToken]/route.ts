import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getMemoryOrder } from "@/lib/orders/memory-store";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ trackingToken: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { trackingToken } = await params;

  if (!trackingToken) {
    return NextResponse.json(
      { success: false, error: "Tracking token is required." },
      { status: 400 }
    );
  }

  // 1. Try Supabase lookup
  try {
    const supabase = createAdminClient();
    const { data: order } = await supabase
      .from("orders")
      .select("*, order_items(*), restaurant_tables(table_label), restaurants(name, slug, currency)")
      .eq("public_tracking_token", trackingToken)
      .maybeSingle();

    if (order) {
      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          orderType: order.order_type,
          status: order.status,
          paymentStatus: order.payment_status,
          paymentMethod: order.payment_method,
          subtotal: order.subtotal,
          vatAmount: order.vat_amount,
          serviceChargeAmount: order.service_charge_amount,
          totalAmount: order.total_amount,
          customerName: order.customer_name,
          createdAt: order.created_at,
          tableLabel: (order.restaurant_tables as { table_label?: string })?.table_label || "Takeaway",
          restaurantName: (order.restaurants as { name?: string })?.name || "Restaurant",
          restaurantSlug: (order.restaurants as { slug?: string })?.slug || "",
          items: order.order_items || [],
        },
      });
    }
  } catch {
    // Fallback to memory order
  }

  // 2. Try in-memory fallback store
  const memoryOrder = getMemoryOrder(trackingToken);
  if (memoryOrder) {
    return NextResponse.json({
      success: true,
      order: {
        id: memoryOrder.id,
        orderNumber: memoryOrder.order_number,
        orderType: memoryOrder.order_type,
        status: memoryOrder.status,
        paymentStatus: memoryOrder.payment_status,
        paymentMethod: memoryOrder.payment_method,
        subtotal: memoryOrder.subtotal,
        vatAmount: memoryOrder.vat_amount,
        serviceChargeAmount: memoryOrder.service_charge_amount,
        totalAmount: memoryOrder.total_amount,
        customerName: memoryOrder.customer_name,
        createdAt: memoryOrder.created_at,
        tableLabel: memoryOrder.tableLabel || "Table Order",
        restaurantName: "Café Artisanal • Gulshan",
        restaurantSlug: "dhabba-gulshan",
        items: memoryOrder.items,
      },
    });
  }

  return NextResponse.json(
    { success: false, error: "Order not found or invalid tracking token." },
    { status: 404 }
  );
}
