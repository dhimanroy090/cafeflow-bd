/**
 * Security & Multi-tenancy Utilities for CaféFlow BD
 */
import type { SubscriptionStatus } from "@/lib/supabase/database.types";

/**
 * Sanitizes input string to prevent XSS in user-submitted restaurant / menu details.
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .trim();
}

/**
 * Checks if a user has the appropriate role for tenant management
 */
export type UserRole = "super_admin" | "owner" | "manager" | "cashier" | "kitchen" | "customer";

export function hasPermission(
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean {
  if (userRole === "super_admin") return true;
  return allowedRoles.includes(userRole);
}

/**
 * Verifies that the tenant's subscription allows operational features.
 * Suspended tenants cannot create new orders.
 */
export function isSubscriptionOperational(status: SubscriptionStatus): boolean {
  return status === "active" || status === "trialing" || status === "past_due";
}

/**
 * Sanitizes order notes and special customer instructions.
 */
export function sanitizeOrderNotes(notes?: string | null): string | null {
  if (!notes) return null;
  return sanitizeString(notes).slice(0, 300);
}

/**
 * Verifies that an order belongs to the expected tenant before mutations.
 */
export function verifyTenantOwnership(
  orderRestaurantId: string,
  targetRestaurantId: string
): boolean {
  return orderRestaurantId === targetRestaurantId;
}
