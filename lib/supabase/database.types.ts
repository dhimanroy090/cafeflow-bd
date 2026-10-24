/**
 * CaféFlow BD: Multi-tenant Production PostgreSQL Database TypeScript Types
 * Generated & typed to strictly match supabase/migrations/0001_initial_schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "suspended";
export type SubscriptionPlan = "starter" | "growth";
export type RestaurantRole = "owner" | "manager" | "cashier" | "kitchen";
export type OrderType = "dine_in_qr" | "counter_pos" | "takeaway";
export type OrderStatus =
  | "unconfirmed"
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type PaymentMethod = "cash" | "bkash" | "nagad" | "card" | "unpaid";

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          phone: string | null;
          address: string | null;
          currency: string;
          vat_percentage: number;
          is_vat_inclusive: boolean;
          service_charge_percentage: number;
          require_table_pin: boolean;
          daily_table_pin: string | null;
          is_accepting_orders: boolean;
          subscription_status: SubscriptionStatus;
          subscription_plan: SubscriptionPlan;
          subscription_valid_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          phone?: string | null;
          address?: string | null;
          currency?: string;
          vat_percentage?: number;
          is_vat_inclusive?: boolean;
          service_charge_percentage?: number;
          require_table_pin?: boolean;
          daily_table_pin?: string | null;
          is_accepting_orders?: boolean;
          subscription_status?: SubscriptionStatus;
          subscription_plan?: SubscriptionPlan;
          subscription_valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          phone?: string | null;
          address?: string | null;
          currency?: string;
          vat_percentage?: number;
          is_vat_inclusive?: boolean;
          service_charge_percentage?: number;
          require_table_pin?: boolean;
          daily_table_pin?: string | null;
          is_accepting_orders?: boolean;
          subscription_status?: SubscriptionStatus;
          subscription_plan?: SubscriptionPlan;
          subscription_valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          is_super_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          is_super_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          is_super_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      restaurant_members: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string;
          role: RestaurantRole;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id: string;
          role: RestaurantRole;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          user_id?: string;
          role?: RestaurantRole;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "restaurant_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      restaurant_tables: {
        Row: {
          id: string;
          restaurant_id: string;
          table_label: string;
          qr_token: string;
          is_active: boolean;
          current_session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          table_label: string;
          qr_token?: string;
          is_active?: boolean;
          current_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          table_label?: string;
          qr_token?: string;
          is_active?: boolean;
          current_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };

      menu_categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
          is_archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          sort_order?: number;
          is_active?: boolean;
          is_archived?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          sort_order?: number;
          is_active?: boolean;
          is_archived?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_categories_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };

      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          category_id: string;
          name: string;
          description: string | null;
          base_price: number;
          image_url: string | null;
          is_available: boolean;
          is_archived: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          category_id: string;
          name: string;
          description?: string | null;
          base_price: number;
          image_url?: string | null;
          is_available?: boolean;
          is_archived?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          category_id?: string;
          name?: string;
          description?: string | null;
          base_price?: number;
          image_url?: string | null;
          is_available?: boolean;
          is_archived?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_items_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "menu_categories";
            referencedColumns: ["id"];
          },
        ];
      };

      item_variants: {
        Row: {
          id: string;
          restaurant_id: string;
          item_id: string;
          name: string;
          price_delta: number;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          item_id: string;
          name: string;
          price_delta?: number;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          item_id?: string;
          name?: string;
          price_delta?: number;
          is_available?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_variants_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "item_variants_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };

      item_addons: {
        Row: {
          id: string;
          restaurant_id: string;
          item_id: string;
          name: string;
          price: number;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          item_id: string;
          name: string;
          price: number;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          item_id?: string;
          name?: string;
          price?: number;
          is_available?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_addons_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "item_addons_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };

      orders: {
        Row: {
          id: string;
          restaurant_id: string;
          table_id: string | null;
          order_number: string;
          order_type: OrderType;
          status: OrderStatus;
          payment_status: PaymentStatus;
          payment_method: PaymentMethod;
          payment_reference: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          special_notes: string | null;
          subtotal: number;
          vat_amount: number;
          service_charge_amount: number;
          discount_amount: number;
          total_amount: number;
          client_idempotency_key: string;
          public_tracking_token: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          table_id?: string | null;
          order_number: string;
          order_type: OrderType;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          payment_method?: PaymentMethod;
          payment_reference?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          special_notes?: string | null;
          subtotal?: number;
          vat_amount?: number;
          service_charge_amount?: number;
          discount_amount?: number;
          total_amount?: number;
          client_idempotency_key: string;
          public_tracking_token?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          table_id?: string | null;
          order_number?: string;
          order_type?: OrderType;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          payment_method?: PaymentMethod;
          payment_reference?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          special_notes?: string | null;
          subtotal?: number;
          vat_amount?: number;
          service_charge_amount?: number;
          discount_amount?: number;
          total_amount?: number;
          client_idempotency_key?: string;
          public_tracking_token?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_table_id_fkey";
            columns: ["table_id"];
            isOneToOne: false;
            referencedRelation: "restaurant_tables";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      order_items: {
        Row: {
          id: string;
          order_id: string;
          restaurant_id: string;
          menu_item_id: string | null;
          item_name_snapshot: string;
          variant_name_snapshot: string | null;
          unit_price_snapshot: number;
          addons_snapshot: Json;
          quantity: number;
          line_total: number;
          item_notes: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          restaurant_id: string;
          menu_item_id?: string | null;
          item_name_snapshot: string;
          variant_name_snapshot?: string | null;
          unit_price_snapshot: number;
          addons_snapshot?: Json;
          quantity: number;
          line_total: number;
          item_notes?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          restaurant_id?: string;
          menu_item_id?: string | null;
          item_name_snapshot?: string;
          variant_name_snapshot?: string | null;
          unit_price_snapshot?: number;
          addons_snapshot?: Json;
          quantity?: number;
          line_total?: number;
          item_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
        ];
      };

      audit_logs: {
        Row: {
          id: string;
          restaurant_id: string | null;
          actor_user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id?: string | null;
          actor_user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string | null;
          actor_user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: {
      v_public_restaurants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          phone: string | null;
          address: string | null;
          currency: string;
          vat_percentage: number;
          is_vat_inclusive: boolean;
          service_charge_percentage: number;
          require_table_pin: boolean;
          is_accepting_orders: boolean;
          subscription_status: SubscriptionStatus;
          subscription_plan: SubscriptionPlan;
          subscription_valid_until: string | null;
          created_at: string;
        };
        Relationships: [];
      };
    };

    Functions: {
      is_super_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_restaurant_member: {
        Args: {
          rest_id: string;
          allowed_roles: string[];
        };
        Returns: boolean;
      };
      verify_table_pin: {
        Args: {
          p_restaurant_id: string;
          p_table_id: string;
          p_pin: string;
        };
        Returns: boolean;
      };
    };

    Enums: {
      subscription_status: SubscriptionStatus;
      subscription_plan: SubscriptionPlan;
      restaurant_role: RestaurantRole;
      order_type: OrderType;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
    };
  };
}

/**
 * Convenient shorthand types for application entity models
 */
export type RestaurantRow = Database["public"]["Tables"]["restaurants"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type RestaurantMemberRow = Database["public"]["Tables"]["restaurant_members"]["Row"];
export type RestaurantTableRow = Database["public"]["Tables"]["restaurant_tables"]["Row"];
export type MenuCategoryRow = Database["public"]["Tables"]["menu_categories"]["Row"];
export type MenuItemRow = Database["public"]["Tables"]["menu_items"]["Row"];
export type ItemVariantRow = Database["public"]["Tables"]["item_variants"]["Row"];
export type ItemAddonRow = Database["public"]["Tables"]["item_addons"]["Row"];
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
export type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];
export type PublicRestaurantView = Database["public"]["Views"]["v_public_restaurants"]["Row"];
