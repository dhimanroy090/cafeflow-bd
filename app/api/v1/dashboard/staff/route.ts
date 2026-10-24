import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import {
  restaurantStaffMap,
  INITIAL_STAFF_MEMBERS,
  type StaffMemberWithProfile,
} from "@/features/admin/restaurant-store";
import { DEMO_RESTAURANT } from "@/features/menu/demo-menu-data";
import type { RestaurantRole } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId") || DEMO_RESTAURANT.id;

  const staff = restaurantStaffMap.get(restaurantId) || INITIAL_STAFF_MEMBERS;
  return NextResponse.json({
    success: true,
    staff,
  });
}

const addStaffSchema = z.object({
  restaurantId: z.string().default(DEMO_RESTAURANT.id),
  fullName: z.string().min(2, "Name required").max(100),
  phone: z.string().min(10, "Valid phone required").max(20),
  email: z.string().email("Valid email required").optional(),
  role: z.enum(["owner", "manager", "cashier", "kitchen"]),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = addStaffSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid staff details", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { restaurantId, fullName, phone, email, role } = parsed.data;
    const now = new Date().toISOString();

    const newStaff: StaffMemberWithProfile = {
      id: `staff-${Date.now()}`,
      restaurant_id: restaurantId,
      user_id: `user-${Date.now()}`,
      role: role as RestaurantRole,
      is_active: true,
      created_at: now,
      fullName,
      phone,
      email: email || `${phone.replace(/\D/g, "")}@cafeflow.internal`,
    };

    const currentList = restaurantStaffMap.get(restaurantId) || [...INITIAL_STAFF_MEMBERS];
    currentList.push(newStaff);
    restaurantStaffMap.set(restaurantId, currentList);

    // Attempt writing to Supabase
    try {
      const supabase = createAdminClient();
      await supabase.from("audit_logs").insert({
        action: "staff_member_added",
        entity_type: "restaurant_member",
        entity_id: newStaff.id,
        metadata: {
          staff_name: fullName,
          role,
          phone,
          timestamp: now,
        },
      });
    } catch {
      // Offline fallback
    }

    return NextResponse.json({
      success: true,
      message: `${fullName} added as ${role.toUpperCase()}`,
      member: newStaff,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to add staff" },
      { status: 500 }
    );
  }
}

const updateStaffSchema = z.object({
  restaurantId: z.string().default(DEMO_RESTAURANT.id),
  staffId: z.string(),
  isActive: z.boolean().optional(),
  role: z.enum(["owner", "manager", "cashier", "kitchen"]).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = updateStaffSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid staff update", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { restaurantId, staffId, isActive, role } = parsed.data;
    const currentList = restaurantStaffMap.get(restaurantId) || [...INITIAL_STAFF_MEMBERS];
    const memberIndex = currentList.findIndex((m) => m.id === staffId);

    if (memberIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 }
      );
    }

    if (isActive !== undefined) {
      currentList[memberIndex].is_active = isActive;
    }
    if (role !== undefined) {
      currentList[memberIndex].role = role as RestaurantRole;
    }

    restaurantStaffMap.set(restaurantId, currentList);

    return NextResponse.json({
      success: true,
      message: `Staff member updated`,
      member: currentList[memberIndex],
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to update staff" },
      { status: 500 }
    );
  }
}
