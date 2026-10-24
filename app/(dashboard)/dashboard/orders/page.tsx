import { LiveOrdersScreen } from "@/components/dashboard/live-orders-screen";

export const metadata = {
  title: "Live Order Queue & Cashier POS | CaféFlow BD",
  description: "Live order verification, customer tab settlement, and cancellation queue for cafe managers.",
};

export default function OrdersPage() {
  return <LiveOrdersScreen />;
}
