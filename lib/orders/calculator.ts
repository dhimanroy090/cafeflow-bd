/**
 * Server-Authoritative Order Calculation Engine for CaféFlow BD
 * Ensures consistent financial calculations across QR ordering, POS cashier terminals, and database mutations.
 * Never trust client prices: always compute totals authoritatively.
 */

export interface LineItemInput {
  basePrice: number;
  variantDelta?: number;
  addonPrices?: number[];
  quantity: number;
}

export interface CalculatedLineItem {
  unitPrice: number;
  lineTotal: number;
}

export interface DiscountInput {
  type: "flat" | "percent";
  value: number;
}

export interface OrderCalculationParams {
  items: Array<{
    basePrice: number;
    variantDelta?: number;
    addonPrices?: number[];
    quantity: number;
  }>;
  vatPercentage: number;
  isVatInclusive: boolean;
  serviceChargePercentage: number;
  discount?: DiscountInput | null;
  orderType?: "dine_in_qr" | "counter_pos" | "takeaway";
  waiveServiceChargeForTakeaway?: boolean;
}

export interface OrderCalculationResult {
  subtotal: number;
  discountAmount: number;
  taxableBase: number;
  vatAmount: number;
  serviceChargeAmount: number;
  grandTotal: number;
  itemCount: number;
  lineItems: CalculatedLineItem[];
}

/**
 * Rounds to 2 decimal places using standard financial half-up rounding.
 */
export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates a single line item's unit price and line total.
 */
export function calculateLineItem(input: LineItemInput): CalculatedLineItem {
  const base = Math.max(0, input.basePrice);
  const variantDelta = input.variantDelta ?? 0;
  const addonsTotal = (input.addonPrices || []).reduce((sum, p) => sum + Math.max(0, p), 0);
  
  const unitPrice = roundCurrency(Math.max(0, base + variantDelta + addonsTotal));
  const quantity = Math.max(1, Math.floor(input.quantity));
  const lineTotal = roundCurrency(unitPrice * quantity);

  return { unitPrice, lineTotal };
}

/**
 * Computes subtotal, discount, VAT, service charge, and grand total.
 */
export function calculateOrderTotals(params: OrderCalculationParams): OrderCalculationResult {
  const lineItems: CalculatedLineItem[] = [];
  let itemCount = 0;

  for (const item of params.items) {
    const calc = calculateLineItem(item);
    lineItems.push(calc);
    itemCount += Math.max(1, Math.floor(item.quantity));
  }

  const subtotal = roundCurrency(lineItems.reduce((acc, curr) => acc + curr.lineTotal, 0));

  // Compute discount
  let discountAmount = 0;
  if (params.discount && params.discount.value > 0) {
    const discountVal = params.discount.value;
    if (params.discount.type === "percent") {
      const calculated = (subtotal * discountVal) / 100;
      discountAmount = roundCurrency(Math.min(subtotal, Math.max(0, calculated)));
    } else {
      discountAmount = roundCurrency(Math.min(subtotal, Math.max(0, discountVal)));
    }
  }

  const taxableBase = Math.max(0, roundCurrency(subtotal - discountAmount));

  // Service charge
  const shouldWaiveServiceCharge =
    params.waiveServiceChargeForTakeaway &&
    (params.orderType === "takeaway" || params.orderType === "counter_pos");

  const serviceChargeRate = shouldWaiveServiceCharge ? 0 : Math.max(0, params.serviceChargePercentage || 0);
  const serviceChargeAmount = roundCurrency((taxableBase * serviceChargeRate) / 100);

  // VAT computation
  const vatRate = Math.max(0, params.vatPercentage || 0);
  let vatAmount = 0;
  let grandTotal = 0;

  if (params.isVatInclusive) {
    if (vatRate > 0) {
      vatAmount = roundCurrency((taxableBase * vatRate) / (100 + vatRate));
    }
    grandTotal = roundCurrency(taxableBase + serviceChargeAmount);
  } else {
    vatAmount = roundCurrency((taxableBase * vatRate) / 100);
    grandTotal = roundCurrency(taxableBase + vatAmount + serviceChargeAmount);
  }

  return {
    subtotal,
    discountAmount,
    taxableBase,
    vatAmount,
    serviceChargeAmount,
    grandTotal,
    itemCount,
    lineItems,
  };
}
