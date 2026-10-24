import type {
  OrderRow,
  OrderItemRow,
  OrderStatus as DbOrderStatus,
  OrderType,
  PaymentStatus,
  PaymentMethod,
} from "@/lib/supabase/database.types";

export type { OrderRow, OrderItemRow, DbOrderStatus, OrderType, PaymentStatus, PaymentMethod };

export type OrderStatus = DbOrderStatus;

export interface Order {
  id: string;
  tenantId: string;
  tableNumber: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

export {
  CartProvider,
  useCart,
  type CartItem,
  type CartTotals,
} from "./cart-context";
