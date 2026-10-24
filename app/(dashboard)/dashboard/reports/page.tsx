import type { Metadata } from "next";
import { DailyClosingReportScreen } from "@/components/reports/daily-closing-report";

export const metadata: Metadata = {
  title: "Sales & Daily Closing Reports | CaféFlow BD",
  description: "Nightly Cash, bKash, Nagad reconciliation and restaurant sales analytics.",
};

export default function ReportsPage() {
  return <DailyClosingReportScreen />;
}
