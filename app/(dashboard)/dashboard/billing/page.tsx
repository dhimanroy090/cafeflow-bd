import type { Metadata } from "next";
import { BillingScreen } from "@/components/dashboard/billing-screen";

export const metadata: Metadata = {
  title: "Subscription Billing & Renewal | CaféFlow BD",
  description: "Manage restaurant subscription plan, usage, and bKash/Bank renewal instructions.",
};

export default function BillingPage() {
  return <BillingScreen />;
}
