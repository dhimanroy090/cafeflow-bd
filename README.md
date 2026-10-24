# CaféFlow BD • Modern Cloud POS & Dine-In QR Ordering System

> **CaféFlow BD** is a high-performance, multi-tenant restaurant management platform built specifically for the food and beverage industry in Bangladesh. It unifies table QR self-ordering, real-time Kitchen Display Systems (KDS), high-speed counter POS, Bangladesh-native payment tracking (Cash, bKash, Nagad), 58mm/80mm thermal receipt printing, and comprehensive sales closing reports.

---

## 🌟 Key Features

### 1. Customer Dine-In QR Self-Ordering (`/r/[slug]`)
- **Instant Table QR Scans**: Scans resolve directly to the customer's table session without requiring app downloads.
- **Rich Menu Customization**: Select item sizes/variants (e.g., Regular vs Double Shot) and add-ons (e.g., Oat Milk, Extra Shot).
- **Anti-Fraud Security**: Optional 4-digit daily table PIN prevents off-premise malicious ordering.
- **Live Real-time Order Tracking**: Customers monitor order progress (`Pending` → `Preparing` → `Ready` → `Served`) with real-time updates.

### 2. Kitchen Display System (KDS) (`/dashboard/kitchen`)
- **Real-Time Order Queue**: Real-time order stream with Web Audio chime alerts for incoming orders.
- **Elapsed Timer Badges**: Visual indicator of ticket age with color-coded alerts (green, amber, red).
- **One-Click Progression**: Advance tickets effortlessly from `Start Preparing` to `Mark Ready for Service`.

### 3. Quick Counter POS (`/dashboard/pos`)
- **Speed-Optimized Manual Entry**: Category grid, keyboard navigation, and fast variant/addon selection.
- **Order Types**: Support for `Dine-In Table`, `Takeaway`, and `Counter Walk-In`.
- **Dynamic Discounts**: Flat BDT (`৳`) or percentage (`%`) discounts with automatic recalculation.

### 4. Bangladesh Bill Settlement & Table Tab Merging
- **Payment Methods**: Native support for `Cash`, `bKash`, `Nagad`, and `Card`.
- **Cash Drawer Calculator**: Instant "Change to Return" display (`ফেরত টাকা: ৳XX`).
- **Transaction ID Tracking**: Record merchant wallet TrxID or card authorization references.
- **Tab Merging**: Settle all orders belonging to a table in one transaction.

### 5. 58mm & 80mm Thermal Receipt & KOT Printing
- **POS Roll Optimization**: High-contrast monospace layout formatted for standard 58mm and 80mm ESC/POS thermal printers.
- **KOT Mode**: Kitchen Order Ticket prints only items, variants, add-ons, and chef notes (prices hidden).
- **Customer Receipt**: Prints restaurant header, itemized bill, VAT breakdown, payment method, and TrxID.

### 6. Sales Analytics & Daily Closing (`/dashboard/reports`)
- **Reconciliation Engine**: Accurate breakdown by `Cash`, `bKash`, `Nagad`, and `Card` for instant end-of-day register balancing.
- **Top Sellers**: Fast identification of high-margin and top-volume items.
- **Accounting Export**: 1-click CSV export for external bookkeeping.

### 7. Multi-Tenant Role-Based Access Control (RBAC)
- **Granular Roles**: `owner`, `manager`, `cashier`, and `kitchen`.
- **Tenant Isolation**: Row Level Security (RLS) and server-side role validation ensure complete multi-tenant data boundaries.
- **Platform Super-Admin (`/super-admin`)**: Platform administrators can manage restaurant subscriptions (`starter` / `growth`), adjust renewal dates, and manage tenant statuses.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + RLS + Realtime)
- **Unit Testing**: [Vitest](https://vitest.dev/)
- **E2E Testing**: [Playwright](https://playwright.dev/)

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd cafeflow-bd
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

### Unit Tests (Vitest)
Executes financial calculation tests, VAT inclusive/exclusive logic, service charges, and discounts:
```bash
npm run test
```

### End-to-End Tests (Playwright)
Executes customer QR order placement, KDS ticket advancement, and cashier bill settlement:
```bash
npm run test:e2e
```

---

## 📚 Deployment

For complete production deployment instructions on **Vercel** and **Supabase Production**, refer to [`docs/deployment.md`](file:///e:/Flutter/order/docs/deployment.md).
