"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  Smartphone,
  Building,
  Check,
  Send,
  Sparkles,
  Zap,
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
import { DEMO_RESTAURANT } from "@/features/menu/demo-menu-data";
import { toast } from "sonner";

export function BillingScreen() {
  const [isSubmitTrxOpen, setIsSubmitTrxOpen] = useState(false);
  const [methodUsed, setMethodUsed] = useState<"bkash" | "nagad" | "bank">("bkash");
  const [trxId, setTrxId] = useState("");
  const [amountPaid, setAmountPaid] = useState("3999");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validUntilStr = DEMO_RESTAURANT.subscription_valid_until
    ? new Date(DEMO_RESTAURANT.subscription_valid_until).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Lifetime";

  const isSuspended = DEMO_RESTAURANT.subscription_status === "suspended";

  const handleSubmitProof = async () => {
    if (!trxId.trim()) {
      toast.error("Please provide the Transaction ID / Reference");
      return;
    }

    setIsSubmitting(true);
    // Simulate payment submission logging
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitTrxOpen(false);
      toast.success("Payment Proof Submitted for Verification", {
        description: `TrxID: ${trxId.toUpperCase()}. Super-Admin will verify and extend validity within 1 hour.`,
      });
      setTrxId("");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-charcoal flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border/80 bg-brand-cream/90 backdrop-blur-md px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-[10px] bg-card border border-border flex items-center justify-center text-brand-forest hover:bg-secondary/40 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-brand-forest text-brand-cream flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-brand-terracotta" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg text-brand-forest leading-tight">
                Subscription & Platform Billing
              </h1>
              <p className="text-[11px] text-muted-foreground font-mono">
                {DEMO_RESTAURANT.name} • SaaS Plan & Renewal
              </p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsSubmitTrxOpen(true)}
          className="bg-brand-forest hover:bg-brand-forest/90 text-brand-cream text-xs font-bold gap-1.5 h-9"
        >
          <Send className="w-4 h-4 text-brand-terracotta" />
          Submit bKash / Bank Proof
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Suspended Warning Notice (if applicable) */}
        {isSuspended && (
          <div className="p-4 rounded-xl bg-red-50 border-2 border-red-400 text-red-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm">Restaurant Subscription Suspended</p>
                <p className="text-xs text-red-900/80">
                  New customer QR orders and counter tickets are temporarily disabled. Please renew below to restore immediate service.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsSubmitTrxOpen(true)}
              className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs shrink-0"
            >
              Pay Now via bKash
            </Button>
          </div>
        )}

        {/* Current Plan Overview Card */}
        <Card className="border-border bg-card shadow-sm overflow-hidden">
          <CardHeader className="p-5 border-b border-border/80 bg-secondary/15">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="accent" className="capitalize text-xs font-bold">
                    {DEMO_RESTAURANT.subscription_plan} Tier
                  </Badge>
                  <Badge
                    variant={
                      DEMO_RESTAURANT.subscription_status === "active"
                        ? "success"
                        : DEMO_RESTAURANT.subscription_status === "trialing"
                        ? "default"
                        : "destructive"
                    }
                    className="capitalize text-xs font-bold"
                  >
                    {DEMO_RESTAURANT.subscription_status}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-black text-brand-forest">
                  CaféFlow {DEMO_RESTAURANT.subscription_plan === "growth" ? "Growth Plan" : "Starter Plan"}
                </CardTitle>
                <CardDescription className="text-xs text-brand-charcoal/80">
                  Full multi-tenant POS, KDS tablet dispatch, customer QR ordering, and thermal roll printing.
                </CardDescription>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-muted-foreground block">Subscription Valid Until</span>
                <span className="text-lg font-black font-mono text-brand-forest">
                  {validUntilStr}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Monthly Fee</span>
              <p className="text-xl font-black font-mono text-brand-forest">
                {DEMO_RESTAURANT.subscription_plan === "growth" ? "৳৩,৯৯৯" : "৳১,৯৯৯"} / mo
              </p>
              <p className="text-[11px] text-muted-foreground">Includes all updates & 24/7 support</p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Dining Tables</span>
              <p className="text-xl font-black font-mono text-brand-charcoal">Unlimited</p>
              <p className="text-[11px] text-muted-foreground">Dynamic QR codes generated</p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Station Limits</span>
              <p className="text-xl font-black font-mono text-brand-charcoal">Unlimited KDS & POS</p>
              <p className="text-[11px] text-muted-foreground">Mount across kitchen & cashier desks</p>
            </div>
          </CardContent>
        </Card>

        {/* Bangladesh Local Payment Instructions */}
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-brand-forest flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-brand-terracotta" />
            How to Renew via bKash / Nagad / Bank Transfer
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* bKash Merchant Box */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="p-4 pb-2 border-b border-border/60 bg-pink-50/50">
                <CardTitle className="text-sm font-extrabold text-[#E2136E] flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  bKash Merchant Payment (বিকাশ মার্চেন্ট পেমেন্ট)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs text-brand-charcoal">
                <ol className="list-decimal pl-4 space-y-1 text-xs">
                  <li>Open bKash App $\rightarrow$ Tap <strong>&ldquo;Make Payment&rdquo;</strong></li>
                  <li>
                    Enter Merchant Number:{" "}
                    <strong className="font-mono text-sm text-[#E2136E]">01711-000000</strong>
                  </li>
                  <li>
                    Enter Amount:{" "}
                    <strong className="font-mono">
                      {DEMO_RESTAURANT.subscription_plan === "growth" ? "৳3,999" : "৳1,999"}
                    </strong>
                  </li>
                  <li>
                    Enter Reference:{" "}
                    <strong className="font-mono bg-pink-100 px-1 py-0.5 rounded text-[#E2136E]">
                      {DEMO_RESTAURANT.slug}
                    </strong>{" "}
                    (Counter: 1)
                  </li>
                  <li>Enter PIN to confirm and copy your <strong>Transaction ID (TrxID)</strong>.</li>
                </ol>
              </CardContent>
            </Card>

            {/* Bank Transfer Box */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="p-4 pb-2 border-b border-border/60 bg-secondary/30">
                <CardTitle className="text-sm font-extrabold text-brand-forest flex items-center gap-2">
                  <Building className="w-4 h-4 text-brand-terracotta" />
                  Bank Transfer (NPSB / BEFTN / CityTouch)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-1.5 text-xs text-brand-charcoal">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank Name:</span>
                  <span className="font-bold">The City Bank Limited</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Name:</span>
                  <span className="font-bold">CaféFlow BD Technologies Ltd.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Number:</span>
                  <span className="font-mono font-bold">1102948291001</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Branch / Routing:</span>
                  <span className="font-mono">Gulshan Branch (225272341)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Plan Comparison Matrix */}
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-brand-forest flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-terracotta" />
            CaféFlow BD Subscription Tiers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Starter */}
            <Card className="border-border bg-card p-5 space-y-4">
              <div className="space-y-1">
                <Badge variant="secondary" className="text-xs font-bold">
                  Starter Plan
                </Badge>
                <p className="text-2xl font-black text-brand-forest font-mono">
                  ৳১,৯৯৯ <span className="text-xs font-normal text-muted-foreground">/ month</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Perfect for boutique coffee shops and takeaway counters.
                </p>
              </div>

              <div className="space-y-2 text-xs divide-y divide-border/60">
                <div className="flex items-center gap-2 pt-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Up to 10 QR Dining Tables
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Check className="w-4 h-4 text-emerald-600" /> 1 Mounted KDS Screen
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Check className="w-4 h-4 text-emerald-600" /> Quick Counter POS & Cashier Station
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Check className="w-4 h-4 text-emerald-600" /> 58mm / 80mm Thermal Receipt Printing
                </div>
              </div>
            </Card>

            {/* Growth */}
            <Card className="border-2 border-brand-forest bg-brand-forest/5 p-5 space-y-4 shadow-md">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="accent" className="text-xs font-bold">
                    Growth Plan (Most Popular)
                  </Badge>
                  <Sparkles className="w-4 h-4 text-brand-terracotta" />
                </div>
                <p className="text-2xl font-black text-brand-forest font-mono">
                  ৳৩,৯৯৯ <span className="text-xs font-normal text-muted-foreground">/ month</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  For high-volume multi-station dining halls and specialty roasteries.
                </p>
              </div>

              <div className="space-y-2 text-xs divide-y divide-border/60">
                <div className="flex items-center gap-2 pt-2">
                  <Check className="w-4 h-4 text-emerald-600 font-bold" /> Unlimited QR Tables & Takeaways
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Check className="w-4 h-4 text-emerald-600 font-bold" /> Multiple KDS Screens (Kitchen + Barista)
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Check className="w-4 h-4 text-emerald-600 font-bold" /> Advanced Sales & MFS Daily Reconciliation
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Check className="w-4 h-4 text-emerald-600 font-bold" /> Granular Team RBAC (Owner, Manager, Cashier, Chef)
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Check className="w-4 h-4 text-emerald-600 font-bold" /> Priority 24/7 Dedicated Support in Dhaka
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Submit Payment Proof Modal */}
      <Dialog open={isSubmitTrxOpen} onOpenChange={setIsSubmitTrxOpen}>
        <DialogContent className="max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-brand-forest flex items-center gap-2">
              <Send className="w-5 h-5 text-brand-terracotta" />
              Submit Subscription Renewal Proof
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide your Transaction ID after making payment so the Super-Admin can verify and renew your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-charcoal block">Payment Method Used *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethodUsed("bkash")}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all border ${
                    methodUsed === "bkash"
                      ? "border-[#E2136E] bg-pink-50 text-[#E2136E]"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  bKash
                </button>
                <button
                  type="button"
                  onClick={() => setMethodUsed("nagad")}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all border ${
                    methodUsed === "nagad"
                      ? "border-[#F7941D] bg-orange-50 text-[#F7941D]"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Nagad
                </button>
                <button
                  type="button"
                  onClick={() => setMethodUsed("bank")}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all border ${
                    methodUsed === "bank"
                      ? "border-brand-forest bg-brand-forest/10 text-brand-forest"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  City Bank
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-charcoal block">
                Transaction ID (TrxID) / Deposit Slip No. *
              </label>
              <Input
                placeholder="e.g. 9B8C7A6D5E"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                className="font-mono text-sm uppercase h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-charcoal block">Amount Paid (৳) *</label>
              <Input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="font-mono text-sm font-bold h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-charcoal block">
                Optional Notes / Sender Phone
              </label>
              <Input
                placeholder="Sender bKash number: 017XXXXXXXX"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSubmitTrxOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={handleSubmitProof}
              className="bg-brand-forest hover:bg-brand-forest/90 text-brand-cream font-bold text-xs"
            >
              {isSubmitting ? "Submitting..." : "Submit for Verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
