# CaféFlow BD • Production Deployment & Operations Guide

This document outlines the end-to-end production setup, cloud deployment on **Vercel**, database configuration with **Supabase PostgreSQL**, Row Level Security (RLS), and Super-Admin provisioning for **CaféFlow BD**.

---

## 1. System Architecture

```
   ┌────────────────────────────────────────────────────────┐
   │                End-User Interfaces                     │
   │  • Dine-in QR Menu (`/r/[slug]?t=token`)               │
   │  • Kitchen Display System (`/dashboard/kitchen`)       │
   │  • Cashier Counter POS (`/dashboard/pos`)              │
   │  • Sales & Daily Closing (`/dashboard/reports`)        │
   │  • Super-Admin Platform (`/super-admin`)               │
   └──────────────────────────┬─────────────────────────────┘
                              │ HTTPS / WSS
                              ▼
   ┌────────────────────────────────────────────────────────┐
   │             Next.js 15 (App Router on Vercel)          │
   │  • Server Actions & Route Handlers (`/api/v1/*`)       │
   │  • Edge-compatible Supabase SSR Auth Middleware        │
   │  • Server-authoritative Order Calculation Engine       │
   │  • RBAC & Multi-tenant Isolation Utilities             │
   └──────────────────────────┬─────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
   ┌───────────────────────┐     ┌───────────────────────┐
   │  Supabase PostgreSQL  │     │   Supabase Realtime   │
   │  • Multi-tenant RLS   │     │  • Order stream       │
   │  • Schema Migrations  │     │  • Sound alerts (KDS) │
   │  • Audit Logs         │     │  • Live table status  │
   └───────────────────────┘     └───────────────────────┘
```

---

## 2. Prerequisites

- **Node.js**: `v20.x` or higher
- **Package Manager**: `npm`
- **Supabase Account**: [https://supabase.com](https://supabase.com)
- **Vercel Account**: [https://vercel.com](https://vercel.com)

---

## 3. Supabase Production Setup

### Step 3.1: Create New Project
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**, choose an organization, and select region (e.g., `Singapore - ap-southeast-1` or `India - ap-south-1` for minimum latency from Bangladesh).
3. Set a strong database password and copy your project ref.

### Step 3.2: Execute Schema Migrations
1. In the Supabase dashboard, navigate to the **SQL Editor**.
2. Open [`supabase/migrations/0001_initial_schema.sql`](file:///e:/Flutter/order/supabase/migrations/0001_initial_schema.sql) in this repository.
3. Paste the full SQL content into the SQL Editor and click **Run**.
4. Verify that all tables have been created:
   - `profiles`
   - `restaurants`
   - `restaurant_members`
   - `restaurant_tables`
   - `menu_categories`
   - `menu_items`
   - `item_variants`
   - `item_addons`
   - `orders`
   - `order_items`
   - `audit_logs`

### Step 3.3: Enable Realtime on Orders Table
1. In Supabase Dashboard, navigate to **Database** -> **Replication**.
2. Under **Source**, toggle on the `orders` and `restaurant_tables` tables for the `supabase_realtime` publication:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE orders;
   ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables;
   ```

### Step 3.4: Promoting the First Super-Admin
To grant platform management rights to the primary operator:

1. Have the user sign up or create their account via `/login`.
2. Once the user is registered in Supabase Auth, run the following SQL command in the **SQL Editor**:
   ```sql
   -- Promote primary administrator
   UPDATE public.profiles
   SET is_super_admin = true
   WHERE email = 'admin@cafeflow.com';
   ```
3. The user can now access `/super-admin` to manage subscriptions, extend plans, and oversee tenant restaurants.

---

## 4. Environment Variables Configuration

Copy `.env.example` to your production environment management (Vercel Project Settings -> Environment Variables):

| Variable Name | Required | Environment | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Client & Server | Supabase Project REST URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Client & Server | Supabase Public Anonymous Key (RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | **Server Only** | Supabase Admin Key. **NEVER expose to client** |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Client & Server | Production domain (e.g., `https://cafeflow.app`) |

> [!CAUTION]
> **Security Audit Check**: `SUPABASE_SERVICE_ROLE_KEY` must never be prefixed with `NEXT_PUBLIC_`. It must only ever be accessed in server routes via `createAdminClient()`.

---

## 5. Vercel Deployment Instructions

### Deploying via Vercel Dashboard
1. Push your repository to GitHub or GitLab.
2. In [Vercel Dashboard](https://vercel.com/new), click **Add New...** -> **Project**.
3. Import the repository.
4. Set Framework Preset: **Next.js**.
5. Set Root Directory: `./` (or leave default).
6. In **Environment Variables**, add the four environment variables listed in Section 4.
7. Click **Deploy**.

### Production Build Verification
To ensure the build will succeed prior to deployment, execute locally:
```bash
# 1. Run unit tests
npm run test

# 2. Typecheck without emitting JS
npx tsc --noEmit

# 3. Lint check
npm run lint

# 4. Production Next.js compilation
npm run build
```

---

## 6. Daily Operations & Hardware Support

### 58mm & 80mm Thermal Receipt Printers
- CaféFlow BD includes print-optimized media queries (`@media print`) designed specifically for standard ESC/POS 58mm and 80mm USB / Bluetooth / Ethernet thermal receipt printers.
- Cashiers can print receipts directly via the **Print Receipt** or **Print KOT** buttons on the POS and order drawers.
- All web interface chrome, sidebars, headers, and navigation are automatically hidden during print mode.

### Audio Alerts & Kitchen Sound
- KDS utilizes Web Audio API synthesis for new order chime notifications, working across all modern desktop and tablet browsers without requiring external audio file downloads.
