import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { adminRestaurantsMap } from "@/features/admin/restaurant-store";
import { DEMO_RESTAURANT } from "@/features/menu/demo-menu-data";
import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export async function GET() {
  const restaurants = Array.from(adminRestaurantsMap.values());
  return NextResponse.json({
    success: true,
    restaurants,
    totalTenants: restaurants.length,
  });
}

const updateSubscriptionSchema = z.object({
  restaurantId: z.string(),
  subscriptionPlan: z.enum(["starter", "growth"]).optional(),
  subscriptionStatus: z.enum(["trialing", "active", "past_due", "suspended"]).optional(),
  validUntilExtensionDays: z.number().int().optional(),
  customValidUntil: z.string().optional(),
  actorName: z.string().default("Super Admin"),
});

export async function PATCH(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = updateSubscriptionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription update", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      restaurantId,
      subscriptionPlan,
      subscriptionStatus,
      validUntilExtensionDays,
      customValidUntil,
      actorName,
    } = parsed.data;

    const restaurant = adminRestaurantsMap.get(restaurantId);
    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "Restaurant tenant not found" },
        { status: 404 }
      );
    }

    const updates: Partial<typeof restaurant> = {
      updated_at: new Date().toISOString(),
    };

    if (subscriptionPlan) {
      updates.subscription_plan = subscriptionPlan as SubscriptionPlan;
    }

    if (subscriptionStatus) {
      updates.subscription_status = subscriptionStatus as SubscriptionStatus;
      // If suspended, also toggle is_accepting_orders = false
      if (subscriptionStatus === "suspended") {
        updates.is_accepting_orders = false;
      } else if (subscriptionStatus === "active") {
        updates.is_accepting_orders = true;
      }
    }

    if (customValidUntil) {
      updates.subscription_valid_until = customValidUntil;
    } else if (validUntilExtensionDays) {
      const currentValid = restaurant.subscription_valid_until
        ? new Date(restaurant.subscription_valid_until)
        : new Date();
      const base = currentValid.getTime() < Date.now() ? new Date() : currentValid;
      base.setDate(base.getDate() + validUntilExtensionDays);
      updates.subscription_valid_until = base.toISOString();
    }

    // Apply updates to in-memory store
    Object.assign(restaurant, updates);
    adminRestaurantsMap.set(restaurantId, restaurant);

    // If updating DEMO_RESTAURANT, synchronize demo object
    if (restaurantId === DEMO_RESTAURANT.id) {
      Object.assign(DEMO_RESTAURANT, updates);
    }

    // Attempt updating Supabase
    try {
      const supabase = createAdminClient();
      await supabase
        .from("restaurants")
        .update({
          subscription_plan: restaurant.subscription_plan,
          subscription_status: restaurant.subscription_status,
          subscription_valid_until: restaurant.subscription_valid_until,
          is_accepting_orders: restaurant.is_accepting_orders,
          updated_at: updates.updated_at,
        })
        .eq("id", restaurantId);

      await supabase.from("audit_logs").insert({
        action: "subscription_modified",
        entity_type: "restaurant",
        entity_id: restaurantId,
        metadata: {
          restaurant_name: restaurant.name,
          previous_status: restaurant.subscription_status,
          new_status: updates.subscription_status,
          new_plan: updates.subscription_plan,
          valid_until: updates.subscription_valid_until,
          actor: actorName,
          timestamp: updates.updated_at,
        },
      });
    } catch {
      // Offline fallback
    }

    return NextResponse.json({
      success: true,
      message: `Subscription for ${restaurant.name} updated successfully.`,
      restaurant,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to update subscription" },
      { status: 500 }
    );
  }
}
