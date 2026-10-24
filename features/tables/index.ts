import type { RestaurantTableRow } from "@/lib/supabase/database.types";

export type { RestaurantTableRow };

export interface DiningTable {
  id: string;
  tenantId: string;
  tableNumber: string;
  qrCodeUrl: string;
  capacity: number;
}
