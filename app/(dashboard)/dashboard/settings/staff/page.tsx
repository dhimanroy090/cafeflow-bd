import type { Metadata } from "next";
import { StaffManagementScreen } from "@/components/settings/staff-management-screen";

export const metadata: Metadata = {
  title: "Staff & Role Management (RBAC) | CaféFlow BD",
  description: "Manage restaurant team members, roles, and station access permissions.",
};

export default function StaffSettingsPage() {
  return <StaffManagementScreen />;
}
