import { createClient } from "@/lib/supabase/server";
import { QRMenu } from "@/components/customer/qr-menu";
import {
  DEMO_RESTAURANT,
  DEMO_TABLES,
  DEMO_CATEGORIES,
  DEMO_MENU_ITEMS,
  type FullMenuItem,
} from "@/features/menu/demo-menu-data";
import type {
  RestaurantRow,
  RestaurantTableRow,
  MenuCategoryRow,
  MenuItemRow,
  ItemVariantRow,
  ItemAddonRow,
} from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

interface CustomerMenuPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function CustomerMenuPage({
  params,
  searchParams,
}: CustomerMenuPageProps) {
  const { slug } = await params;
  const { t: tableToken } = await searchParams;

  let restaurant: RestaurantRow | null = null;
  let table: RestaurantTableRow | null = null;
  let categories: MenuCategoryRow[] = [];
  let menuItems: FullMenuItem[] = [];

  // Attempt database resolution via Supabase
  try {
    const supabase = await createClient();

    const { data: restDb } = await supabase
      .from("restaurants")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (restDb) {
      const rest = restDb as RestaurantRow;
      restaurant = rest;

      // Resolve table if tableToken query param provided
      if (tableToken) {
        const { data: tableDb } = await supabase
          .from("restaurant_tables")
          .select("*")
          .eq("restaurant_id", rest.id)
          .eq("qr_token", tableToken)
          .eq("is_active", true)
          .maybeSingle();

        if (tableDb) {
          table = tableDb as RestaurantTableRow;
        }
      }

      // Fetch categories
      const { data: catsDb } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("restaurant_id", rest.id)
        .eq("is_active", true)
        .eq("is_archived", false)
        .order("sort_order", { ascending: true });

      if (catsDb && Array.isArray(catsDb) && catsDb.length > 0) {
        categories = catsDb as MenuCategoryRow[];
      }

      // Fetch items with variants & addons
      const { data: itemsDb } = await supabase
        .from("menu_items")
        .select("*, item_variants(*), item_addons(*)")
        .eq("restaurant_id", rest.id)
        .eq("is_archived", false)
        .eq("is_available", true)
        .order("sort_order", { ascending: true });

      if (itemsDb && Array.isArray(itemsDb) && itemsDb.length > 0) {
        menuItems = (itemsDb as Array<MenuItemRow & { item_variants?: ItemVariantRow[]; item_addons?: ItemAddonRow[] }>).map((item) => ({
          ...item,
          variants: (item.item_variants || []) as FullMenuItem["variants"],
          addons: (item.item_addons || []) as FullMenuItem["addons"],
        }));
      }
    }
  } catch {
    // If Supabase is unavailable or not seeded, use graceful fallback
  }

  // Graceful Demo Fallback: enables immediate live testing & browser demonstration
  if (!restaurant) {
    if (slug === DEMO_RESTAURANT.slug || slug === "dhabba-gulshan" || slug === "demo") {
      restaurant = DEMO_RESTAURANT;
      categories = DEMO_CATEGORIES;
      menuItems = DEMO_MENU_ITEMS;

      if (tableToken) {
        table = DEMO_TABLES.find((t) => t.qr_token === tableToken) || null;
      }
    } else {
      restaurant = {
        ...DEMO_RESTAURANT,
        name: `${slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ")} • Café`,
        slug: slug,
      };
      categories = DEMO_CATEGORIES;
      menuItems = DEMO_MENU_ITEMS;

      if (tableToken) {
        table = DEMO_TABLES.find((t) => t.qr_token === tableToken) || {
          id: "custom-table-id",
          restaurant_id: restaurant.id,
          table_label: `Table (${tableToken})`,
          qr_token: tableToken,
          is_active: true,
          current_session_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    }
  }

  const isViewOnly = !table;

  return (
    <QRMenu
      restaurant={restaurant}
      table={table}
      categories={categories}
      menuItems={menuItems}
      isViewOnly={isViewOnly}
    />
  );
}
