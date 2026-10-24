import type {
  RestaurantRow,
  RestaurantMemberRow,
} from "@/lib/supabase/database.types";
import { DEMO_RESTAURANT } from "@/features/menu/demo-menu-data";

export interface OnboardedRestaurant extends RestaurantRow {
  ownerName: string;
  ownerEmail: string;
  totalOrdersCount: number;
  totalRevenueBDT: number;
  membersCount: number;
  activeTablesCount: number;
}

export interface StaffMemberWithProfile extends RestaurantMemberRow {
  fullName: string;
  phone: string;
  email: string;
}

// In-memory restaurant registry for Super-Admin management
export const INITIAL_RESTAURANTS: OnboardedRestaurant[] = [
  {
    ...DEMO_RESTAURANT,
    ownerName: "Tanvir Ahmed",
    ownerEmail: "tanvir@artisanalcafe.bd",
    totalOrdersCount: 384,
    totalRevenueBDT: 289450,
    membersCount: 4,
    activeTablesCount: 8,
  },
  {
    id: "rest-002-banani",
    name: "Chai Kofe • Banani 11",
    slug: "chai-kofe-banani",
    logo_url: null,
    phone: "+8801822334455",
    address: "House 42, Road 11, Banani, Dhaka",
    currency: "BDT",
    vat_percentage: 5.0,
    is_vat_inclusive: true,
    service_charge_percentage: 5.0,
    require_table_pin: false,
    daily_table_pin: null,
    is_accepting_orders: true,
    subscription_status: "active",
    subscription_plan: "starter",
    subscription_valid_until: "2026-11-20T23:59:59Z",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    ownerName: "Nafis Fuad",
    ownerEmail: "fuad@chaikofe.bd",
    totalOrdersCount: 162,
    totalRevenueBDT: 114200,
    membersCount: 2,
    activeTablesCount: 5,
  },
  {
    id: "rest-003-dhanmondi",
    name: "North End Roasters • Dhanmondi",
    slug: "northend-dhanmondi",
    logo_url: null,
    phone: "+8801933445566",
    address: "Plot 28, Satmasjid Road, Dhanmondi, Dhaka",
    currency: "BDT",
    vat_percentage: 5.0,
    is_vat_inclusive: true,
    service_charge_percentage: 10.0,
    require_table_pin: false,
    daily_table_pin: null,
    is_accepting_orders: true,
    subscription_status: "trialing",
    subscription_plan: "growth",
    subscription_valid_until: "2026-11-08T23:59:59Z",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    ownerName: "Zubair Rahman",
    ownerEmail: "zubair@northenddhk.bd",
    totalOrdersCount: 94,
    totalRevenueBDT: 82500,
    membersCount: 3,
    activeTablesCount: 10,
  },
  {
    id: "rest-004-uttara",
    name: "Crimson Cup • Uttara Sector 3",
    slug: "crimson-uttara",
    logo_url: null,
    phone: "+8801644556677",
    address: "Rabindra Sarani, Sector 3, Uttara, Dhaka",
    currency: "BDT",
    vat_percentage: 5.0,
    is_vat_inclusive: true,
    service_charge_percentage: 5.0,
    require_table_pin: false,
    daily_table_pin: null,
    is_accepting_orders: false,
    subscription_status: "suspended",
    subscription_plan: "starter",
    subscription_valid_until: "2026-10-01T23:59:59Z",
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-10-02T00:00:00Z",
    ownerName: "Mahbub Alam",
    ownerEmail: "mahbub@crimsonuttara.bd",
    totalOrdersCount: 42,
    totalRevenueBDT: 34100,
    membersCount: 1,
    activeTablesCount: 6,
  },
];

// Initial Staff for Café Artisanal Gulshan
export const INITIAL_STAFF_MEMBERS: StaffMemberWithProfile[] = [
  {
    id: "staff-01",
    restaurant_id: DEMO_RESTAURANT.id,
    user_id: "user-tanvir",
    role: "owner",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    fullName: "Tanvir Ahmed",
    phone: "+8801711223344",
    email: "tanvir@artisanalcafe.bd",
  },
  {
    id: "staff-02",
    restaurant_id: DEMO_RESTAURANT.id,
    user_id: "user-arif",
    role: "manager",
    is_active: true,
    created_at: "2026-01-10T00:00:00Z",
    fullName: "Arif Hossain",
    phone: "+8801811223344",
    email: "arif@artisanalcafe.bd",
  },
  {
    id: "staff-03",
    restaurant_id: DEMO_RESTAURANT.id,
    user_id: "user-fatima",
    role: "cashier",
    is_active: true,
    created_at: "2026-01-15T00:00:00Z",
    fullName: "Fatima Begum",
    phone: "+8801911223344",
    email: "fatima@artisanalcafe.bd",
  },
  {
    id: "staff-04",
    restaurant_id: DEMO_RESTAURANT.id,
    user_id: "user-rubel",
    role: "kitchen",
    is_active: true,
    created_at: "2026-01-20T00:00:00Z",
    fullName: "Rubel Mia",
    phone: "+8801611223344",
    email: "rubel@artisanalcafe.bd",
  },
];

// Global mutable maps for demo simulation
export const adminRestaurantsMap = new Map<string, OnboardedRestaurant>(
  INITIAL_RESTAURANTS.map((r) => [r.id, { ...r }])
);

export const restaurantStaffMap = new Map<string, StaffMemberWithProfile[]>();
restaurantStaffMap.set(DEMO_RESTAURANT.id, [...INITIAL_STAFF_MEMBERS]);
