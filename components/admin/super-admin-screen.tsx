"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  Search,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  INITIAL_RESTAURANTS,
  type OnboardedRestaurant,
} from "@/features/admin/restaurant-store";
import { formatBDT } from "@/lib/utils";
import type { SubscriptionPlan, SubscriptionStatus } from "@/lib/supabase/database.types";
import { toast } from "sonner";

export function SuperAdminScreen() {
  const [restaurants, setRestaurants] = useState<OnboardedRestaurant[]>(INITIAL_RESTAURANTS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Simulated super admin authentication state
  const [isSuperAdminAuth, setIsSuperAdminAuth] = useState(true);

  // Edit Subscription Modal State
  const [editingRestaurant, setEditingRestaurant] = useState<OnboardedRestaurant | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("starter");
  const [selectedStatus, setSelectedStatus] = useState<SubscriptionStatus>("active");
  const [extensionDays, setExtensionDays] = useState<number>(30);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch tenants
  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/restaurants");
      const data = await res.json();
      if (res.ok && data.success) {
        setRestaurants(data.restaurants);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const openEditModal = (r: OnboardedRestaurant) => {
    setEditingRestaurant(r);
    setSelectedPlan(r.subscription_plan);
    setSelectedStatus(r.subscription_status);
    setExtensionDays(30);
  };

  const handleUpdateSubscription = async () => {
    if (!editingRestaurant) return;

    setIsUpdating(true);
    try {
      const res = await fetch("/api/v1/admin/restaurants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: editingRestaurant.id,
          subscriptionPlan: selectedPlan,
          subscriptionStatus: selectedStatus,
          validUntilExtensionDays: extensionDays,
          actorName: "Super Admin (Tanvir)",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Update failed");
      }

      toast.success(`Subscription updated for ${editingRestaurant.name}`, {
        description: `Plan: ${selectedPlan.toUpperCase()}, Status: ${selectedStatus.toUpperCase()}`,
      });

      setEditingRestaurant(null);
      fetchRestaurants();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update subscription");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Platform KPIs
  const totalTenants = restaurants.length;
  const activeTenants = restaurants.filter((r) => r.subscription_status === "active").length;
  const suspendedTenants = restaurants.filter((r) => r.subscription_status === "suspended").length;
  const totalPlatformOrders = restaurants.reduce((sum, r) => sum + r.totalOrdersCount, 0);

  if (!isSuperAdminAuth) {
    return (
      <div className="min-h-screen bg-brand-cream text-brand-charcoal flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-4 border-destructive/40">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
          <div className="space-y-1">
            <h2 className="text-xl font-black text-brand-forest">Super-Admin Access Denied</h2>
            <p className="text-xs text-muted-foreground">
              This area is strictly restricted to platform engineers with `profiles.is_super_admin = true`.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setIsSuperAdminAuth(true)}
            className="w-full bg-brand-forest hover:bg-brand-forest/90 text-brand-cream font-bold text-xs"
          >
            Authenticate as Super-Admin (Demo Mode)
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream text-brand-charcoal flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border/80 bg-brand-forest text-brand-cream px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-[10px] bg-brand-cream/10 hover:bg-brand-cream/20 text-brand-cream flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-brand-terracotta text-brand-cream flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight">
                  CaféFlow BD Platform Super-Admin
                </h1>
                <Badge className="bg-brand-terracotta text-brand-cream font-mono text-[10px]">
                  Root Access
                </Badge>
              </div>
              <p className="text-[11px] text-brand-cream/70 font-mono">
                Multi-Tenant Subscription Lifecycle & bKash Settlement Verification
              </p>
            </div>
          </div>
        </div>

        {/* Header Right */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={fetchRestaurants}
            className="bg-brand-cream/10 border-brand-cream/20 text-brand-cream hover:bg-brand-cream/20 text-xs font-bold gap-1.5 h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh Tenants"}
          </Button>
          <Link href="/dashboard">
            <Button
              variant="default"
              size="sm"
              className="bg-brand-cream text-brand-forest hover:bg-brand-cream/90 text-xs font-bold gap-1 h-8"
            >
              Back to Operations Hub
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Restaurants
              </span>
              <p className="text-3xl font-black font-mono text-brand-forest">{totalTenants}</p>
              <p className="text-[11px] text-muted-foreground">Onboarded cafes in Dhaka</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Active Subscriptions
              </span>
              <p className="text-3xl font-black font-mono text-emerald-700">{activeTenants}</p>
              <p className="text-[11px] text-muted-foreground">Paying monthly SaaS fee</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Suspended Tenants
              </span>
              <p className="text-3xl font-black font-mono text-destructive">{suspendedTenants}</p>
              <p className="text-[11px] text-muted-foreground">Orders blocked pending renewal</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5 space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Platform Orders
              </span>
              <p className="text-3xl font-black font-mono text-brand-charcoal">{totalPlatformOrders}</p>
              <p className="text-[11px] text-muted-foreground">Processed through CaféFlow</p>
            </CardContent>
          </Card>
        </div>

        {/* Restaurant Directory */}
        <Card className="border-border bg-card shadow-sm overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-extrabold text-brand-forest">
                Restaurant Tenants & Subscriptions
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Verify monthly bKash/Bank payments, extend validity, or toggle suspended status.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search restaurant or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs bg-background"
              />
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground border-b border-border uppercase font-bold text-[11px]">
                <tr>
                  <th className="p-3.5">Restaurant</th>
                  <th className="p-3.5">Owner & Contact</th>
                  <th className="p-3.5">Plan</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Valid Until</th>
                  <th className="p-3.5 text-center">Telemetry</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRestaurants.map((restaurant) => {
                  const validUntil = restaurant.subscription_valid_until
                    ? new Date(restaurant.subscription_valid_until).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "No Expiry";

                  const isSuspended = restaurant.subscription_status === "suspended";

                  return (
                    <tr key={restaurant.id} className="hover:bg-muted/30 transition-colors">
                      {/* Restaurant */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-brand-forest text-sm">
                            {restaurant.name}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            /r/{restaurant.slug}
                          </p>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-brand-charcoal">{restaurant.ownerName}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {restaurant.phone}
                          </p>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="p-3.5">
                        <Badge
                          variant={restaurant.subscription_plan === "growth" ? "accent" : "secondary"}
                          className="capitalize text-xs font-bold"
                        >
                          {restaurant.subscription_plan} (
                          {restaurant.subscription_plan === "growth" ? "৳3,999/mo" : "৳1,999/mo"})
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <Badge
                          variant={
                            restaurant.subscription_status === "active"
                              ? "success"
                              : restaurant.subscription_status === "trialing"
                              ? "default"
                              : restaurant.subscription_status === "past_due"
                              ? "accent"
                              : "destructive"
                          }
                          className="capitalize text-xs font-bold"
                        >
                          {restaurant.subscription_status}
                        </Badge>
                      </td>

                      {/* Valid Until */}
                      <td className="p-3.5 font-mono text-xs font-semibold">
                        <span className={isSuspended ? "text-destructive line-through" : ""}>
                          {validUntil}
                        </span>
                      </td>

                      {/* Telemetry */}
                      <td className="p-3.5 text-center">
                        <span className="font-mono font-bold text-xs">
                          {restaurant.totalOrdersCount} orders
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          {formatBDT(restaurant.totalRevenueBDT)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(restaurant)}
                          className="text-xs font-bold border-brand-forest/30 text-brand-forest hover:bg-brand-forest/10 h-7 px-2.5"
                        >
                          Manage Subscription
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* Subscription Management Modal */}
      {editingRestaurant && (
        <Dialog open={true} onOpenChange={() => setEditingRestaurant(null)}>
          <DialogContent className="max-w-md p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-brand-forest flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-terracotta" />
                Manage Subscription: {editingRestaurant.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update billing tier, extend validity after manual bKash/Bank deposit, or toggle suspension.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-1">
              {/* Plan Tier */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-charcoal block">
                  Subscription Plan Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("starter")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      selectedPlan === "starter"
                        ? "border-brand-forest bg-brand-forest/10 text-brand-forest ring-1 ring-brand-forest"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>Starter Plan</span>
                    <span className="text-[11px] font-mono">৳১,৯৯৯ / month</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPlan("growth")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      selectedPlan === "growth"
                        ? "border-brand-terracotta bg-brand-terracotta/10 text-brand-terracotta ring-1 ring-brand-terracotta"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>Growth Plan</span>
                    <span className="text-[11px] font-mono">৳৩,৯৯৯ / month</span>
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-charcoal block">
                  Subscription Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as SubscriptionStatus)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-xs font-bold text-brand-forest focus:outline-none focus:ring-1 focus:ring-brand-forest"
                >
                  <option value="active">Active (All features enabled)</option>
                  <option value="trialing">Trialing (Free initial evaluation)</option>
                  <option value="past_due">Past Due (Grace period active)</option>
                  <option value="suspended">Suspended (Order placement blocked)</option>
                </select>
                {selectedStatus === "suspended" && (
                  <p className="text-[11px] text-destructive font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Warning: Suspending blocks new customer QR orders and POS tickets.
                  </p>
                )}
              </div>

              {/* Validity Extension */}
              <div className="space-y-1.5 pt-1 border-t border-border">
                <label className="text-xs font-bold text-brand-charcoal block">
                  Quick Validity Extension (Upon Payment Verification)
                </label>
                <div className="flex items-center gap-1.5">
                  {[
                    { days: 30, label: "+30 Days (1 Mo)" },
                    { days: 90, label: "+90 Days (Quarterly)" },
                    { days: 365, label: "+1 Year (Annual)" },
                  ].map((preset) => (
                    <Button
                      key={preset.days}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExtensionDays(preset.days)}
                      className={`text-xs font-mono font-bold flex-1 h-8 ${
                        extensionDays === preset.days
                          ? "border-brand-forest bg-brand-forest/10 text-brand-forest"
                          : ""
                      }`}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingRestaurant(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isUpdating}
                onClick={handleUpdateSubscription}
                className="bg-brand-forest hover:bg-brand-forest/90 text-brand-cream font-bold text-xs"
              >
                {isUpdating ? "Updating..." : "Save Subscription Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
