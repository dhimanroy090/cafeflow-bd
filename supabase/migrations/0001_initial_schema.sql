-- ============================================================================
-- CaféFlow BD: Multi-tenant Production PostgreSQL Schema & Security Policies
-- Migration: 0001_initial_schema.sql
-- Description: Core tables, RLS policies, helper RPCs, indexes & audit logging
-- ============================================================================

-- Enable essential extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Restaurants (Tenant Organization Entity)
-- ----------------------------------------------------------------------------
create table if not exists public.restaurants (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text unique not null,
    logo_url text,
    phone text,
    address text,
    currency text not null default 'BDT',
    vat_percentage numeric(5,2) not null default 0.00 check (vat_percentage >= 0 and vat_percentage <= 100),
    is_vat_inclusive boolean not null default true,
    service_charge_percentage numeric(5,2) not null default 0.00 check (service_charge_percentage >= 0 and service_charge_percentage <= 100),
    require_table_pin boolean not null default false,
    daily_table_pin varchar(6),
    is_accepting_orders boolean not null default true,
    subscription_status text not null default 'trialing' check (subscription_status in ('trialing', 'active', 'past_due', 'suspended')),
    subscription_plan text not null default 'starter' check (subscription_plan in ('starter', 'growth')),
    subscription_valid_until timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Profiles (Extends auth.users for authenticated staff, managers & owners)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    phone text,
    is_super_admin boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Restaurant Members (Tenant Team & RBAC Role Assignment)
-- ----------------------------------------------------------------------------
create table if not exists public.restaurant_members (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null references public.restaurants(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    role text not null check (role in ('owner', 'manager', 'cashier', 'kitchen')),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    constraint unique_restaurant_user unique (restaurant_id, user_id)
);

-- ----------------------------------------------------------------------------
-- Restaurant Tables (Physical Dining Tables & QR Token Routing)
-- ----------------------------------------------------------------------------
create table if not exists public.restaurant_tables (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null references public.restaurants(id) on delete cascade,
    table_label text not null,
    qr_token text unique not null default encode(gen_random_bytes(16), 'hex'),
    is_active boolean not null default true,
    current_session_id uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint unique_restaurant_table_label unique (restaurant_id, table_label)
);

-- ----------------------------------------------------------------------------
-- Menu Categories (Hierarchical Food/Beverage Groups)
-- ----------------------------------------------------------------------------
create table if not exists public.menu_categories (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null references public.restaurants(id) on delete cascade,
    name text not null,
    sort_order integer not null default 0,
    is_active boolean not null default true,
    is_archived boolean not null default false,
    created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Menu Items (Dishes, Drinks & Pricing)
-- ----------------------------------------------------------------------------
create table if not exists public.menu_items (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null references public.restaurants(id) on delete cascade,
    category_id uuid not null references public.menu_categories(id) on delete cascade,
    name text not null,
    description text,
    base_price numeric(10,2) not null check (base_price >= 0),
    image_url text,
    is_available boolean not null default true,
    is_archived boolean not null default false,
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Item Variants (Sizes/Portions e.g. Regular, Large, 250ml)
-- ----------------------------------------------------------------------------
create table if not exists public.item_variants (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null references public.restaurants(id) on delete cascade,
    item_id uuid not null references public.menu_items(id) on delete cascade,
    name text not null,
    price_delta numeric(10,2) not null default 0.00,
    is_available boolean not null default true,
    created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Item Addons (Customizations e.g. Extra Cheese, Oat Milk, Espresso Shot)
-- ----------------------------------------------------------------------------
create table if not exists public.item_addons (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null references public.restaurants(id) on delete cascade,
    item_id uuid not null references public.menu_items(id) on delete cascade,
    name text not null,
    price numeric(10,2) not null check (price >= 0),
    is_available boolean not null default true,
    created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Orders (Table QR Orders & POS Counter Tickets)
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null references public.restaurants(id) on delete cascade,
    table_id uuid references public.restaurant_tables(id) on delete set null,
    order_number text not null,
    order_type text not null check (order_type in ('dine_in_qr', 'counter_pos', 'takeaway')),
    status text not null default 'pending' check (status in ('unconfirmed', 'pending', 'accepted', 'preparing', 'ready', 'served', 'cancelled')),
    payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded')),
    payment_method text not null default 'unpaid' check (payment_method in ('cash', 'bkash', 'nagad', 'card', 'unpaid')),
    payment_reference varchar(100),
    customer_name text,
    customer_phone text,
    special_notes text,
    subtotal numeric(10,2) not null default 0.00 check (subtotal >= 0),
    vat_amount numeric(10,2) not null default 0.00 check (vat_amount >= 0),
    service_charge_amount numeric(10,2) not null default 0.00 check (service_charge_amount >= 0),
    discount_amount numeric(10,2) not null default 0.00 check (discount_amount >= 0),
    total_amount numeric(10,2) not null default 0.00 check (total_amount >= 0),
    client_idempotency_key text unique not null,
    public_tracking_token uuid unique not null default gen_random_uuid(),
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Order Items (Line Items with Snapshot Preservation)
-- ----------------------------------------------------------------------------
create table if not exists public.order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders(id) on delete cascade,
    restaurant_id uuid not null references public.restaurants(id) on delete cascade,
    menu_item_id uuid references public.menu_items(id) on delete set null,
    item_name_snapshot text not null,
    variant_name_snapshot text,
    unit_price_snapshot numeric(10,2) not null check (unit_price_snapshot >= 0),
    addons_snapshot jsonb not null default '[]'::jsonb,
    quantity integer not null check (quantity > 0),
    line_total numeric(10,2) not null check (line_total >= 0),
    item_notes text
);

-- ----------------------------------------------------------------------------
-- Audit Logs (Compliance, Security Telemetry & Staff Action Tracking)
-- ----------------------------------------------------------------------------
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid references public.restaurants(id) on delete cascade,
    actor_user_id uuid references public.profiles(id) on delete set null,
    action text not null,
    entity_type text not null,
    entity_id text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- ============================================================================
-- 2. INDEXES FOR HIGH-THROUGHPUT LOOKUPS & RLS ACCELERATION
-- ============================================================================

-- Orders: Fast kitchen/counter filtering and live status queries
create index if not exists idx_orders_restaurant_status_created
    on public.orders(restaurant_id, status, created_at desc);

-- Orders: Customer public live-tracking via secure token
create index if not exists idx_orders_public_tracking_token
    on public.orders(public_tracking_token);

-- Orders: Idempotency deduplication check
create index if not exists idx_orders_idempotency
    on public.orders(client_idempotency_key);

-- Tables: Ultra-fast QR scan resolution
create index if not exists idx_restaurant_tables_qr_token
    on public.restaurant_tables(qr_token);

create index if not exists idx_restaurant_tables_restaurant_active
    on public.restaurant_tables(restaurant_id, is_active);

-- Menu Items: Menu category browsing & active availability
create index if not exists idx_menu_items_restaurant_category
    on public.menu_items(restaurant_id, category_id);

create index if not exists idx_menu_items_active_lookup
    on public.menu_items(restaurant_id, is_archived, is_available);

-- Menu Categories: Sorted category rendering
create index if not exists idx_menu_categories_restaurant_order
    on public.menu_categories(restaurant_id, sort_order)
    where is_archived = false;

-- Variants & Addons: Item foreign key lookup
create index if not exists idx_item_variants_item_id
    on public.item_variants(item_id);

create index if not exists idx_item_addons_item_id
    on public.item_addons(item_id);

-- Order Items: Fast order line item retrieval
create index if not exists idx_order_items_order_id
    on public.order_items(order_id);

-- Restaurant Members: Fast RBAC authorization lookups
create index if not exists idx_restaurant_members_user_id
    on public.restaurant_members(user_id);

create index if not exists idx_restaurant_members_auth_lookup
    on public.restaurant_members(restaurant_id, user_id, is_active);

-- Restaurants: Slug-based routing resolution
create index if not exists idx_restaurants_slug
    on public.restaurants(slug);

-- Audit Logs: Recent activity stream by tenant
create index if not exists idx_audit_logs_restaurant_created
    on public.audit_logs(restaurant_id, created_at desc);

-- ============================================================================
-- 3. SECURITY HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

-- Automatic updated_at timestamp refresher
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger tr_restaurants_updated_at
    before update on public.restaurants
    for each row execute function public.handle_updated_at();

create trigger tr_profiles_updated_at
    before update on public.profiles
    for each row execute function public.handle_updated_at();

create trigger tr_restaurant_tables_updated_at
    before update on public.restaurant_tables
    for each row execute function public.handle_updated_at();

create trigger tr_orders_updated_at
    before update on public.orders
    for each row execute function public.handle_updated_at();

-- Automatically provision a public.profile upon auth.users signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, full_name, phone, is_super_admin)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        new.phone,
        false
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- RBAC Helper: is_super_admin()
-- Checks if current caller possesses global SaaS super-admin privileges
-- ----------------------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1
        from public.profiles
        where id = auth.uid()
          and is_super_admin = true
    );
$$;

-- ----------------------------------------------------------------------------
-- RBAC Helper: is_restaurant_member(rest_id, allowed_roles)
-- Checks if current caller is an active staff member of tenant with allowed role
-- ----------------------------------------------------------------------------
create or replace function public.is_restaurant_member(
    rest_id uuid,
    allowed_roles text[]
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1
        from public.restaurant_members
        where restaurant_id = rest_id
          and user_id = auth.uid()
          and is_active = true
          and role = any(allowed_roles)
    );
$$;

-- ----------------------------------------------------------------------------
-- Secure RPC: verify_table_pin(p_restaurant_id, p_table_id, p_pin)
-- Validates the daily rotation PIN for table orders without leaking PIN to client
-- ----------------------------------------------------------------------------
create or replace function public.verify_table_pin(
    p_restaurant_id uuid,
    p_table_id uuid,
    p_pin text
)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
    v_require_pin boolean;
    v_correct_pin text;
    v_table_active boolean;
begin
    select require_table_pin, daily_table_pin
    into v_require_pin, v_correct_pin
    from public.restaurants
    where id = p_restaurant_id
      and is_accepting_orders = true;

    if not found then
        return false;
    end if;

    -- If PIN protection is not enabled by restaurant, allow table order freely
    if not v_require_pin then
        return true;
    end if;

    -- Verify table belongs to restaurant and is currently active
    select is_active into v_table_active
    from public.restaurant_tables
    where id = p_table_id
      and restaurant_id = p_restaurant_id;

    if not found or not v_table_active then
        return false;
    end if;

    -- Compare sanitized PIN string
    return v_correct_pin is not null and v_correct_pin = trim(p_pin);
end;
$$;

-- ----------------------------------------------------------------------------
-- Secure View: v_public_restaurants
-- Exposes only safe tenant attributes to customers (daily_table_pin NEVER exposed)
-- ----------------------------------------------------------------------------
create or replace view public.v_public_restaurants as
    select
        id,
        name,
        slug,
        logo_url,
        phone,
        address,
        currency,
        vat_percentage,
        is_vat_inclusive,
        service_charge_percentage,
        require_table_pin,
        is_accepting_orders,
        subscription_status,
        subscription_plan,
        subscription_valid_until,
        created_at
    from public.restaurants
    where is_accepting_orders = true
      and subscription_status in ('trialing', 'active');

-- Grant permissions on safe view
grant select on public.v_public_restaurants to anon, authenticated;

-- ============================================================================
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS across all tables
alter table public.restaurants enable row level security;
alter table public.profiles enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.item_variants enable row level security;
alter table public.item_addons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.audit_logs enable row level security;

-- ----------------------------------------------------------------------------
-- Column-Level Security on restaurants:
-- Revoke direct selection of daily_table_pin from public/anon role
-- ----------------------------------------------------------------------------
revoke select (daily_table_pin) on public.restaurants from anon;

-- ----------------------------------------------------------------------------
-- Policies: restaurants
-- ----------------------------------------------------------------------------
-- Public/Anon can read active operating restaurants
create policy "Public can view active restaurants"
    on public.restaurants
    for select
    to anon, authenticated
    using (
        subscription_status in ('trialing', 'active')
        and is_accepting_orders = true
    );

-- Tenant members can view their restaurant details (including staff settings)
create policy "Members can view their own restaurant"
    on public.restaurants
    for select
    to authenticated
    using (
        public.is_restaurant_member(id, array['owner', 'manager', 'cashier', 'kitchen'])
        or public.is_super_admin()
    );

-- Only Owners and Managers can update their restaurant settings
create policy "Owners and managers can update their restaurant"
    on public.restaurants
    for update
    to authenticated
    using (
        public.is_restaurant_member(id, array['owner', 'manager'])
        or public.is_super_admin()
    )
    with check (
        public.is_restaurant_member(id, array['owner', 'manager'])
        or public.is_super_admin()
    );

-- Super admin can insert or delete restaurants
create policy "Super admins can insert restaurants"
    on public.restaurants
    for insert
    to authenticated
    with check (public.is_super_admin());

create policy "Super admins can delete restaurants"
    on public.restaurants
    for delete
    to authenticated
    using (public.is_super_admin());

-- ----------------------------------------------------------------------------
-- Policies: profiles
-- ----------------------------------------------------------------------------
create policy "Users can view own profile or team profiles"
    on public.profiles
    for select
    to authenticated
    using (
        id = auth.uid()
        or public.is_super_admin()
        or exists (
            select 1 from public.restaurant_members rm1
            join public.restaurant_members rm2 on rm1.restaurant_id = rm2.restaurant_id
            where rm1.user_id = auth.uid() and rm2.user_id = public.profiles.id
        )
    );

create policy "Users can update own profile"
    on public.profiles
    for update
    to authenticated
    using (id = auth.uid() or public.is_super_admin())
    with check (id = auth.uid() or public.is_super_admin());

-- ----------------------------------------------------------------------------
-- Policies: restaurant_members
-- ----------------------------------------------------------------------------
create policy "Members can view fellow staff in their restaurant"
    on public.restaurant_members
    for select
    to authenticated
    using (
        user_id = auth.uid()
        or public.is_restaurant_member(restaurant_id, array['owner', 'manager', 'cashier', 'kitchen'])
        or public.is_super_admin()
    );

create policy "Owners and managers can manage restaurant members"
    on public.restaurant_members
    for all
    to authenticated
    using (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager'])
        or public.is_super_admin()
    )
    with check (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager'])
        or public.is_super_admin()
    );

-- ----------------------------------------------------------------------------
-- Policies: restaurant_tables
-- ----------------------------------------------------------------------------
-- Public/Customers can read active tables via QR token
create policy "Public can view active tables"
    on public.restaurant_tables
    for select
    to anon, authenticated
    using (is_active = true);

-- Staff members can view all tables in their restaurant
create policy "Staff can view all tables in their restaurant"
    on public.restaurant_tables
    for select
    to authenticated
    using (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager', 'cashier', 'kitchen'])
        or public.is_super_admin()
    );

-- Owners and managers can insert/update/delete tables
create policy "Owners and managers can manage tables"
    on public.restaurant_tables
    for all
    to authenticated
    using (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager'])
        or public.is_super_admin()
    )
    with check (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager'])
        or public.is_super_admin()
    );

-- ----------------------------------------------------------------------------
-- Policies: menu_categories
-- ----------------------------------------------------------------------------
create policy "Public can view active non-archived categories"
    on public.menu_categories
    for select
    to anon, authenticated
    using (is_active = true and is_archived = false);

create policy "Staff can view all categories in their restaurant"
    on public.menu_categories
    for select
    to authenticated
    using (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager', 'cashier', 'kitchen'])
        or public.is_super_admin()
    );

create policy "Owners and managers can manage categories"
    on public.menu_categories
    for all
    to authenticated
    using (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager'])
        or public.is_super_admin()
    )
    with check (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager'])
        or public.is_super_admin()
    );

-- ----------------------------------------------------------------------------
-- Policies: menu_items
-- ----------------------------------------------------------------------------
create policy "Public can view non-archived menu items"
    on public.menu_items
    for select
    to anon, authenticated
    using (is_archived = false);

create policy "Staff can view all items in their restaurant"
    on public.menu_items
    for select
    to authenticated
    using (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager', 'cashier', 'kitchen'])
        or public.is_super_admin()
    );

create policy "Owners and managers can manage menu items"
    on public.menu_items
    for all
    to authenticated
    using (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager'])
        or public.is_super_admin()
    )
    with check (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager'])
        or public.is_super_admin()
    );

-- ----------------------------------------------------------------------------
-- Policies: item_variants
-- ----------------------------------------------------------------------------
create policy "Public can view available variants"
    on public.item_variants
    for select
    to anon, authenticated
    using (is_available = true);

create policy "Staff can view all variants in their restaurant"
    on public.item_variants
    for select
    to authenticated
    using (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager', 'cashier', 'kitchen'])
        or public.is_super_admin()
    );

create policy "Owners and managers can manage item variants"
    on public.item_variants
    for all
    to authenticated
    using (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager'])
        or public.is_super_admin()
    )
    with check (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager'])
        or public.is_super_admin()
    );

-- ----------------------------------------------------------------------------
-- Policies: item_addons
-- ----------------------------------------------------------------------------
create policy "Public can view available addons"
    on public.item_addons
    for select
    to anon, authenticated
    using (is_available = true);

create policy "Staff can view all addons in their restaurant"
    on public.item_addons
    for select
    to authenticated
    using (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager', 'cashier', 'kitchen'])
        or public.is_super_admin()
    );

create policy "Owners and managers can manage item addons"
    on public.item_addons
    for all
    to authenticated
    using (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager'])
        or public.is_super_admin()
    )
    with check (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager'])
        or public.is_super_admin()
    );

-- ----------------------------------------------------------------------------
-- Policies: orders
-- ----------------------------------------------------------------------------
-- Customer Public Tracking: Anonymous or authenticated customers can track an order
-- via its unguessable public_tracking_token
create policy "Customers can track their order via public tracking token"
    on public.orders
    for select
    to anon, authenticated
    using (public_tracking_token is not null);

-- Restaurant Staff can view all orders for their tenant
create policy "Staff can view orders for their restaurant"
    on public.orders
    for select
    to authenticated
    using (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager', 'cashier', 'kitchen'])
        or public.is_super_admin()
    );

-- Counter POS / Cashiers / Managers / Owners can insert orders directly
-- Note: Anonymous QR orders are handled through secure RPC / Server Action transaction
create policy "Staff can insert orders"
    on public.orders
    for insert
    to authenticated
    with check (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager', 'cashier'])
        or public.is_super_admin()
    );

-- Staff can update order status and payment status based on role
create policy "Staff can update orders"
    on public.orders
    for update
    to authenticated
    using (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager', 'cashier', 'kitchen'])
        or public.is_super_admin()
    )
    with check (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager', 'cashier', 'kitchen'])
        or public.is_super_admin()
    );

-- ----------------------------------------------------------------------------
-- Policies: order_items
-- ----------------------------------------------------------------------------
-- Customers can view order items for orders they possess public tracking token for
create policy "Customers can view items of tracked orders"
    on public.order_items
    for select
    to anon, authenticated
    using (
        exists (
            select 1 from public.orders o
            where o.id = public.order_items.order_id
        )
    );

create policy "Staff can view order items for their restaurant"
    on public.order_items
    for select
    to authenticated
    using (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager', 'cashier', 'kitchen'])
        or public.is_super_admin()
    );

create policy "Staff can insert order items"
    on public.order_items
    for insert
    to authenticated
    with check (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager', 'cashier'])
        or public.is_super_admin()
    );

-- ----------------------------------------------------------------------------
-- Policies: audit_logs
-- ----------------------------------------------------------------------------
create policy "Owners and managers can view audit logs"
    on public.audit_logs
    for select
    to authenticated
    using (
        public.is_restaurant_member(restaurant_id, array['owner', 'manager'])
        or public.is_super_admin()
    );

create policy "Authenticated users can create audit log records"
    on public.audit_logs
    for insert
    to authenticated
    with check (
        auth.uid() is not null
        or public.is_super_admin()
    );
