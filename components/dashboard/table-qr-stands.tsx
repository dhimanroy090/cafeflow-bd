"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  QrCode,
  Printer,
  ExternalLink,
  Download,
  Copy,
  Check,
  Sparkles,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DEMO_RESTAURANT, DEMO_TABLES } from "@/features/menu/demo-menu-data";
import { toast } from "sonner";

interface QRStandItemProps {
  table: (typeof DEMO_TABLES)[0];
  origin: string;
}

function TableCard({ table, origin }: QRStandItemProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const tableUrl = `${origin}/r/${DEMO_RESTAURANT.slug}?t=${table.qr_token}`;

  useEffect(() => {
    QRCode.toDataURL(tableUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: "#1B3B36", // Brand forest green
        light: "#FFFFFF",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating QR:", err));
  }, [tableUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(tableUrl);
    setCopied(true);
    toast.success(`Copied link for ${table.table_label}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `QR-${table.table_label.replace(/\s+/g, "_")}.png`;
    a.click();
    toast.success(`Downloaded QR code for ${table.table_label}`);
  };

  return (
    <Card className="rounded-[16px] border border-border/80 bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      {/* Printable Table Tent Header */}
      <CardHeader className="p-4 pb-3 bg-secondary/30 border-b border-border/80">
        <div className="flex items-center justify-between">
          <Badge variant="accent" className="font-bold text-xs">
            {table.table_label}
          </Badge>
          <span className="text-[11px] font-mono text-muted-foreground">
            Token: {table.qr_token}
          </span>
        </div>
        <CardTitle className="text-base font-extrabold text-brand-forest truncate pt-1">
          {table.table_label}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground truncate">
          Self-ordering station for dine-in guests
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 flex flex-col items-center justify-center space-y-4">
        {/* Rendered Scannable QR Code */}
        <div className="p-3 bg-white rounded-2xl border-2 border-brand-forest/20 shadow-inner flex flex-col items-center">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`QR code for ${table.table_label}`}
              className="w-48 h-48 rounded-lg object-contain"
            />
          ) : (
            <div className="w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center animate-pulse">
              <QrCode className="w-12 h-12 text-slate-400" />
            </div>
          )}
          <span className="text-[11px] font-bold text-brand-forest mt-1 tracking-wider uppercase">
            Scan with Phone Camera
          </span>
        </div>

        {/* PIN Badge if required */}
        {DEMO_RESTAURANT.require_table_pin && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            Daily PIN: <span className="font-mono font-bold">{DEMO_RESTAURANT.daily_table_pin}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <Button
              asChild
              className="flex-1 bg-brand-forest hover:bg-brand-forest-light text-brand-cream text-xs font-bold h-9"
            >
              <a href={tableUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Open Menu
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-9 px-3 border-border hover:bg-secondary text-xs"
              title="Copy URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-9 px-3 border-border hover:bg-secondary text-xs"
              title="Download QR Image PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TableQRStandsScreen() {
  const [origin, setOrigin] = useState<string>("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-brand-cream/40 p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/80 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground">
              <Link href="/dashboard">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to Dashboard
              </Link>
            </Button>
            <Badge variant="accent" className="text-xs">
              Dining Table Setup
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-forest flex items-center gap-2">
            <QrCode className="w-7 h-7 text-brand-terracotta" />
            Table QR Codes & Stands
          </h1>
          <p className="text-xs sm:text-sm text-brand-charcoal/80">
            Generate, test, download, and print table tent cards for your dine-in tables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handlePrintAll}
            className="bg-brand-forest hover:bg-brand-forest-light text-brand-cream font-bold text-xs sm:text-sm shadow-md gap-2 h-10 px-4"
          >
            <Printer className="w-4 h-4" />
            Print All Table Stands
          </Button>
        </div>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-8">
        {DEMO_TABLES.map((table) => (
          <TableCard key={table.id} table={table} origin={origin} />
        ))}
      </div>

      {/* Helpful Instructions Card */}
      <Card className="rounded-[14px] bg-secondary/30 border border-border/80 p-5 space-y-3 print:hidden">
        <div className="flex items-center gap-2 text-brand-forest font-bold text-sm">
          <Sparkles className="w-4 h-4 text-brand-terracotta" />
          How Dining Table QR Ordering Works in CaféFlow BD
        </div>
        <ol className="list-decimal list-inside text-xs text-brand-charcoal/80 space-y-1.5 leading-relaxed">
          <li>
            <strong>Print or scan a Table Card:</strong> Each QR code embeds a secure token unique to that physical table.
          </li>
          <li>
            <strong>Customer scans with iPhone or Android camera:</strong> No app download required. The live menu opens immediately.
          </li>
          <li>
            <strong>Kitchen auto-dispatches:</strong> Orders placed from a table appear instantly on the Kitchen Display System (`/dashboard/kitchen`) tagged with that table number.
          </li>
          <li>
            <strong>Cashier bill settlement:</strong> Cashiers can merge all orders from the table and collect payment via Cash, bKash, or Card.
          </li>
        </ol>
      </Card>

      {/* Print Stylesheet for Physical Acrylic & Tent Cards */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header,
          nav,
          aside,
          button,
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
