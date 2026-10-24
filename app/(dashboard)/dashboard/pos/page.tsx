import type { Metadata } from "next";
import { CounterPOSScreen } from "@/components/pos/counter-pos-screen";

export const metadata: Metadata = {
  title: "Counter POS | CaféFlow BD",
  description: "Touch-friendly manual order entry, bill settlement, and thermal receipt printing for cashiers.",
};

export default function CounterPOSPage() {
  return <CounterPOSScreen />;
}
