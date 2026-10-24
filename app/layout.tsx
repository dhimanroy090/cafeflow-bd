import type { Metadata } from "next";
import { Manrope, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CaféFlow BD | Multi-tenant Restaurant QR Ordering & POS SaaS",
  description:
    "Production-minded restaurant operating system, QR table ordering, and real-time cloud POS tailored for Bangladesh cafes and restaurants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${hindSiliguri.variable}`} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="font-sans min-h-screen bg-background text-foreground antialiased selection:bg-brand-terracotta selection:text-white"
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
