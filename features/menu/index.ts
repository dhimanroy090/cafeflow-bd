import type {
  MenuCategoryRow,
  MenuItemRow,
  ItemVariantRow,
  ItemAddonRow,
} from "@/lib/supabase/database.types";

export type { MenuCategoryRow, MenuItemRow, ItemVariantRow, ItemAddonRow };

export interface MenuItem {
  id: string;
  tenantId: string;
  name: string;
  nameBengali?: string;
  price: number;
  isAvailable: boolean;
}
