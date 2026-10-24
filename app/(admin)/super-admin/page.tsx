import type { Metadata } from "next";
import { SuperAdminScreen } from "@/components/admin/super-admin-screen";

export const metadata: Metadata = {
  title: "Super-Admin Panel | CaféFlow BD",
  description: "Platform-wide SaaS tenant subscription management and lifecycle control.",
};

export default function SuperAdminPage() {
  return <SuperAdminScreen />;
}
