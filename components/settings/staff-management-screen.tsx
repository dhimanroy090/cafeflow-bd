"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  ChefHat,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DEMO_RESTAURANT } from "@/features/menu/demo-menu-data";
import {
  INITIAL_STAFF_MEMBERS,
  type StaffMemberWithProfile,
} from "@/features/admin/restaurant-store";
import type { RestaurantRole } from "@/lib/supabase/database.types";
import { toast } from "sonner";

export function StaffManagementScreen() {
  const [staffList, setStaffList] = useState<StaffMemberWithProfile[]>(INITIAL_STAFF_MEMBERS);

  // Active Simulated Role for RBAC testing
  const [simulatedRole, setSimulatedRole] = useState<RestaurantRole>("owner");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<RestaurantRole>("cashier");
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch staff
  const fetchStaff = async () => {
    try {
      const res = await fetch(`/api/v1/dashboard/staff?restaurantId=${DEMO_RESTAURANT.id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStaffList(data.staff);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Toggle active status
  const handleToggleStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      setStaffList((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, is_active: nextStatus } : s))
      );

      const res = await fetch("/api/v1/dashboard/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: DEMO_RESTAURANT.id,
          staffId,
          isActive: nextStatus,
        }),
      });

      if (!res.ok) throw new Error();
      toast.success(nextStatus ? "Staff member activated" : "Staff member deactivated");
    } catch {
      toast.error("Failed to update status");
      fetchStaff();
    }
  };

  // Add staff
  const handleAddStaff = async () => {
    if (!newFullName.trim() || !newPhone.trim()) {
      toast.error("Full Name and Phone number are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/dashboard/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: DEMO_RESTAURANT.id,
          fullName: newFullName.trim(),
          phone: newPhone.trim(),
          role: newRole,
          email: newEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add staff");
      }

      toast.success(`${newFullName} added as ${newRole.toUpperCase()}`);
      setIsAddModalOpen(false);
      setNewFullName("");
      setNewPhone("");
      setNewEmail("");
      setNewRole("cashier");
      fetchStaff();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  // RBAC Permission Matrix for current simulated role
  const permissions = useMemo(() => {
    return {
      canAccessKDS: true, // all can view KDS
      canAccessPOS: simulatedRole === "owner" || simulatedRole === "manager" || simulatedRole === "cashier",
      canAccessLiveOrders: simulatedRole === "owner" || simulatedRole === "manager" || simulatedRole === "cashier",
      canAccessReports: simulatedRole === "owner" || simulatedRole === "manager",
      canExportFinancials: simulatedRole === "owner",
      canManageStaff: simulatedRole === "owner",
      canDeleteMenuItems: simulatedRole === "owner",
      canAccessBilling: simulatedRole === "owner",
    };
  }, [simulatedRole]);

  return (
    <div className="min-h-screen bg-brand-cream text-brand-charcoal flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border/80 bg-brand-cream/90 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-[10px] bg-card border border-border flex items-center justify-center text-brand-forest hover:bg-secondary/40 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-brand-forest text-brand-cream flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-terracotta" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-brand-forest leading-tight">
                Staff & Role Management (RBAC)
              </h1>
              <p className="text-[11px] text-muted-foreground font-mono">
                {DEMO_RESTAURANT.name} • Team Permissions & Access Control
              </p>
            </div>
          </div>
        </div>

        {/* Add Staff Button (Owner only) */}
        {permissions.canManageStaff && (
          <Button
            type="button"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-brand-forest hover:bg-brand-forest/90 text-brand-cream text-xs font-bold gap-1.5 h-9"
          >
            <UserPlus className="w-4 h-4 text-brand-terracotta" />
            Add Team Member
          </Button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Interactive RBAC Simulator Bar */}
        <div className="p-4 rounded-xl bg-card border-2 border-brand-forest/20 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-terracotta" />
              <span className="text-xs font-extrabold text-brand-forest">
                Simulate Active Staff Role:
              </span>
              <span className="text-xs text-muted-foreground">
                (Test how the interface adapts to strict role-based access limits)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {(["owner", "manager", "cashier", "kitchen"] as RestaurantRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSimulatedRole(role)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                    simulatedRole === role
                      ? "bg-brand-forest text-brand-cream shadow"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Role Access Notice */}
          <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1.5 border border-border/60">
            <div className="flex items-center gap-2 font-bold text-brand-forest">
              <Eye className="w-4 h-4 text-brand-terracotta" />
              Currently Viewing As: <span className="uppercase text-brand-terracotta">{simulatedRole}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
              <div className="flex items-center gap-1.5">
                {permissions.canAccessKDS ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                )}
                <span>Kitchen KDS Access</span>
              </div>
              <div className="flex items-center gap-1.5">
                {permissions.canAccessPOS ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                )}
                <span>Counter POS & Billing</span>
              </div>
              <div className="flex items-center gap-1.5">
                {permissions.canAccessReports ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                )}
                <span>Daily Sales Reports</span>
              </div>
              <div className="flex items-center gap-1.5">
                {permissions.canManageStaff ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                )}
                <span>Manage Staff & Team</span>
              </div>
            </div>
          </div>
        </div>

        {/* If Simulated Role is Kitchen, show Restricted Access message */}
        {simulatedRole === "kitchen" ? (
          <div className="p-8 text-center bg-card rounded-2xl border border-dashed border-border space-y-4">
            <Lock className="w-12 h-12 text-muted-foreground/50 mx-auto" />
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="font-extrabold text-lg text-brand-forest">
                Kitchen Display Access Only
              </h3>
              <p className="text-xs text-muted-foreground">
                Kitchen staff members are restricted from viewing billing, staff settings, or customer revenue figures.
              </p>
            </div>
            <Button asChild className="bg-brand-forest hover:bg-brand-forest/90 text-brand-cream font-bold text-xs gap-1.5">
              <Link href="/dashboard/kitchen">
                <ChefHat className="w-4 h-4 text-brand-terracotta" /> Open Kitchen Display System
              </Link>
            </Button>
          </div>
        ) : (
          /* Staff List Table */
          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border/80">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-extrabold text-brand-forest">
                    Active Staff Roster ({staffList.length} Members)
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Assign granular access rights to ensure cashier honesty and kitchen focus.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground border-b border-border uppercase font-bold text-[11px]">
                  <tr>
                    <th className="p-3.5">Staff Member</th>
                    <th className="p-3.5">Phone Number</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Assigned Stations</th>
                    <th className="p-3.5 text-center">Status</th>
                    {permissions.canManageStaff && <th className="p-3.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {staffList.map((staff) => {
                    const isOwner = staff.role === "owner";
                    return (
                      <tr key={staff.id} className="hover:bg-muted/30 transition-colors">
                        {/* Member */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-brand-forest/10 text-brand-forest font-bold flex items-center justify-center uppercase font-mono">
                              {staff.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-extrabold text-brand-charcoal text-sm leading-tight">
                                {staff.fullName}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{staff.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="p-3.5 font-mono font-semibold text-brand-charcoal">
                          {staff.phone}
                        </td>

                        {/* Role Badge */}
                        <td className="p-3.5">
                          <Badge
                            variant={
                              staff.role === "owner"
                                ? "accent"
                                : staff.role === "manager"
                                ? "default"
                                : staff.role === "cashier"
                                ? "secondary"
                                : "outline"
                            }
                            className="capitalize text-xs font-bold"
                          >
                            {staff.role}
                          </Badge>
                        </td>

                        {/* Allowed Stations */}
                        <td className="p-3.5 text-[11px] text-muted-foreground">
                          {staff.role === "owner" && "Full System Access"}
                          {staff.role === "manager" && "KDS, POS, Live Orders, Daily Closing"}
                          {staff.role === "cashier" && "POS, Live Orders, Bill Settlement"}
                          {staff.role === "kitchen" && "Kitchen KDS Monitor Only"}
                        </td>

                        {/* Status Toggle */}
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            disabled={!permissions.canManageStaff || isOwner}
                            onClick={() => handleToggleStatus(staff.id, staff.is_active)}
                            className={`inline-flex items-center gap-1.5 font-bold text-xs px-2.5 py-1 rounded-full transition-all ${
                              staff.is_active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800 opacity-60"
                            } ${isOwner ? "cursor-default" : "cursor-pointer"}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                staff.is_active ? "bg-emerald-600" : "bg-red-600"
                              }`}
                            />
                            {staff.is_active ? "Active" : "Disabled"}
                          </button>
                        </td>

                        {/* Actions */}
                        {permissions.canManageStaff && (
                          <td className="p-3.5 text-right">
                            {isOwner ? (
                              <span className="text-[11px] text-muted-foreground italic">
                                Primary Owner
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(staff.id, staff.is_active)}
                                className="text-xs text-muted-foreground hover:text-brand-forest h-7 px-2"
                              >
                                {staff.is_active ? "Deactivate" : "Activate"}
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>

      {/* Add Staff Member Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-brand-forest flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-brand-terracotta" />
              Add Restaurant Staff Member
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new staff profile with role-based access for kitchen, cashiers, or managers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-charcoal block">
                Full Name *
              </label>
              <Input
                placeholder="e.g. Mahin Chowdhury"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-charcoal block">
                Phone Number (Used for Login & SMS) *
              </label>
              <Input
                placeholder="017XXXXXXXX"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="text-xs h-9 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-charcoal block">
                Select Role & Station *
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as RestaurantRole)}
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-bold text-brand-forest focus:outline-none focus:ring-1 focus:ring-brand-forest"
              >
                <option value="cashier">Cashier (POS, Live Orders & Bill Settlement)</option>
                <option value="manager">Manager (POS, KDS, Live Orders, Daily Closing Reports)</option>
                <option value="kitchen">Kitchen Staff (Kitchen Display System Only)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-charcoal block">
                Email Address (Optional)
              </label>
              <Input
                type="email"
                placeholder="staff@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={handleAddStaff}
              className="bg-brand-forest hover:bg-brand-forest/90 text-brand-cream font-bold text-xs"
            >
              {isSubmitting ? "Adding..." : "Add Staff Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
