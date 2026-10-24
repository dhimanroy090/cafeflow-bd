/**
 * Sales Analytics & Daily Settlement Reports Feature
 */
export interface DailyReportSummary {
  tenantId: string;
  date: string;
  totalOrders: number;
  totalSalesBDT: number;
}
