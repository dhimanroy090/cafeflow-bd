import type {
  RestaurantRow,
  RestaurantMemberRow,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/supabase/database.types";

export type { RestaurantRow, RestaurantMemberRow, SubscriptionPlan, SubscriptionStatus };

export interface RestaurantTenant {
  id: string;
  name: string;
  slug: string;
  currency: string;
  isActive: boolean;
}
