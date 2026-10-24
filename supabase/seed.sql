-- ============================================================================
-- CaféFlow BD: Seed Data for Initial Setup & Demo Testing
-- ============================================================================

-- 1. Insert Demo Restaurant
INSERT INTO public.restaurants (
    id,
    name,
    slug,
    phone,
    address,
    currency,
    vat_percentage,
    is_vat_inclusive,
    service_charge_percentage,
    require_table_pin,
    daily_table_pin,
    is_accepting_orders,
    subscription_status,
    subscription_plan,
    subscription_valid_until
) VALUES (
    '777e4567-e89b-12d3-a456-426614174000',
    'Café Artisanal • Gulshan',
    'dhabba-gulshan',
    '+8801711223344',
    'Road 11, Block D, Gulshan-2, Dhaka 1212',
    'BDT',
    5.00,
    true,
    10.00,
    false,
    '1234',
    true,
    'active',
    'growth',
    '2028-12-31 23:59:59+00'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Restaurant Tables
INSERT INTO public.restaurant_tables (id, restaurant_id, table_label, qr_token, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111101', '777e4567-e89b-12d3-a456-426614174000', 'Table 01 (Window)', 'demo-table-01', true),
    ('11111111-1111-1111-1111-111111111104', '777e4567-e89b-12d3-a456-426614174000', 'Table 04 (Main Dining)', 'demo-table-04', true),
    ('11111111-1111-1111-1111-111111111108', '777e4567-e89b-12d3-a456-426614174000', 'Table 08 (Garden Terrace)', 'demo-table-08', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Menu Categories
INSERT INTO public.menu_categories (id, restaurant_id, name, sort_order, is_active)
VALUES
    ('22222222-2222-2222-2222-222222222201', '777e4567-e89b-12d3-a456-426614174000', 'Specialty Espresso & Brews', 1, true),
    ('22222222-2222-2222-2222-222222222202', '777e4567-e89b-12d3-a456-426614174000', 'Cold Brews & Tonics', 2, true),
    ('22222222-2222-2222-2222-222222222203', '777e4567-e89b-12d3-a456-426614174000', 'Artisanal Bakes & Sourdough', 3, true),
    ('22222222-2222-2222-2222-222222222204', '777e4567-e89b-12d3-a456-426614174000', 'Handcrafted Desserts', 4, true)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Menu Items
INSERT INTO public.menu_items (id, restaurant_id, category_id, name, description, base_price, is_available, sort_order)
VALUES
    ('33333333-3333-3333-3333-333333333301', '777e4567-e89b-12d3-a456-426614174000', '22222222-2222-2222-2222-222222222201', 'Silky Flat White', 'Double ristretto over velvety micro-textured whole milk. Notes of roasted hazelnut and dark caramel.', 360.00, true, 1),
    ('33333333-3333-3333-3333-333333333302', '777e4567-e89b-12d3-a456-426614174000', '22222222-2222-2222-2222-222222222202', 'Tiramisu Foam Iced Latte', 'Cold milk poured over rich espresso, capped with fresh mascarpone whipped cream & Dutch cocoa dust.', 480.00, true, 2),
    ('33333333-3333-3333-3333-333333333303', '777e4567-e89b-12d3-a456-426614174000', '22222222-2222-2222-2222-222222222203', 'French Butter Croissant', 'Layered laminated pastry with 100% French butter. Flaky golden crust with airy honeycomb interior.', 240.00, true, 3),
    ('33333333-3333-3333-3333-333333333304', '777e4567-e89b-12d3-a456-426614174000', '22222222-2222-2222-2222-222222222204', 'Pistachio Espresso Tiramisu', 'Savoiardi ladyfingers soaked in single-origin espresso & Marsala syrup, layered with pistachio cream.', 490.00, true, 4)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Item Variants
INSERT INTO public.item_variants (id, restaurant_id, item_id, name, price_delta, is_available)
VALUES
    ('44444444-4444-4444-4444-444444444401', '777e4567-e89b-12d3-a456-426614174000', '33333333-3333-3333-3333-333333333301', 'Standard (6oz)', 0.00, true),
    ('44444444-4444-4444-4444-444444444402', '777e4567-e89b-12d3-a456-426614174000', '33333333-3333-3333-3333-333333333301', 'Double Shot Mug (10oz)', 80.00, true),
    ('44444444-4444-4444-4444-444444444403', '777e4567-e89b-12d3-a456-426614174000', '33333333-3333-3333-3333-333333333302', 'Regular (12oz)', 0.00, true),
    ('44444444-4444-4444-4444-444444444404', '777e4567-e89b-12d3-a456-426614174000', '33333333-3333-3333-3333-333333333302', 'Large (16oz)', 70.00, true)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Item Add-ons
INSERT INTO public.item_addons (id, restaurant_id, item_id, name, price, is_available)
VALUES
    ('55555555-5555-5555-5555-555555555501', '777e4567-e89b-12d3-a456-426614174000', '33333333-3333-3333-3333-333333333301', 'Barista Oat Milk', 90.00, true),
    ('55555555-5555-5555-5555-555555555502', '777e4567-e89b-12d3-a456-426614174000', '33333333-3333-3333-3333-333333333301', 'Extra Espresso Shot', 70.00, true),
    ('55555555-5555-5555-5555-555555555503', '777e4567-e89b-12d3-a456-426614174000', '33333333-3333-3333-3333-333333333303', 'Organic Strawberry Preserve', 40.00, true)
ON CONFLICT (id) DO NOTHING;

-- 7. Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_tables;
