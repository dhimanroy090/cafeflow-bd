/**
 * Payments & Bangladesh MFS (bKash, Nagad, Cash, Card) Feature
 */
export type PaymentMethod = "cash" | "bkash" | "nagad" | "card";

export interface PaymentTransaction {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  status: "pending" | "paid" | "failed";
}
