import { describe, it, expect } from "vitest";
import {
  calculateLineItem,
  calculateOrderTotals,
  roundCurrency,
} from "../lib/orders/calculator";

describe("Order Calculation Engine (Financial Correctness & Edge Cases)", () => {
  describe("roundCurrency", () => {
    it("rounds numbers accurately to 2 decimal places", () => {
      expect(roundCurrency(10.005)).toBe(10.01);
      expect(roundCurrency(10.004)).toBe(10);
      expect(roundCurrency(125.456)).toBe(125.46);
    });
  });

  describe("calculateLineItem", () => {
    it("calculates basic item line total correctly", () => {
      const result = calculateLineItem({
        basePrice: 240,
        quantity: 2,
      });
      expect(result.unitPrice).toBe(240);
      expect(result.lineTotal).toBe(480);
    });

    it("applies positive variant delta correctly", () => {
      const result = calculateLineItem({
        basePrice: 350,
        variantDelta: 90, // e.g. Large / Double Shot
        quantity: 1,
      });
      expect(result.unitPrice).toBe(440);
      expect(result.lineTotal).toBe(440);
    });

    it("combines variant delta and multiple add-ons", () => {
      const result = calculateLineItem({
        basePrice: 320,
        variantDelta: 50,
        addonPrices: [40, 60], // e.g. Extra Syrup + Oat Milk
        quantity: 3,
      });
      // 320 + 50 + 40 + 60 = 470
      expect(result.unitPrice).toBe(470);
      expect(result.lineTotal).toBe(1410);
    });

    it("handles zero or negative inputs defensively", () => {
      const result = calculateLineItem({
        basePrice: -50,
        variantDelta: 100,
        addonPrices: [-20, 30],
        quantity: 0, // Should default to minimum 1
      });
      expect(result.unitPrice).toBe(130);
      expect(result.lineTotal).toBe(130);
    });
  });

  describe("calculateOrderTotals - Exclusive VAT Mode", () => {
    it("calculates exclusive VAT (5%) and service charge (10%) correctly", () => {
      // Subtotal: 1000
      // Discount: none
      // Service charge: 10% = 100
      // VAT: 5% on 1000 = 50
      // Grand total: 1000 + 100 + 50 = 1150
      const result = calculateOrderTotals({
        items: [
          { basePrice: 500, quantity: 2 },
        ],
        vatPercentage: 5,
        isVatInclusive: false,
        serviceChargePercentage: 10,
        orderType: "dine_in_qr",
      });

      expect(result.subtotal).toBe(1000);
      expect(result.discountAmount).toBe(0);
      expect(result.taxableBase).toBe(1000);
      expect(result.serviceChargeAmount).toBe(100);
      expect(result.vatAmount).toBe(50);
      expect(result.grandTotal).toBe(1150);
      expect(result.itemCount).toBe(2);
    });
  });

  describe("calculateOrderTotals - Inclusive VAT Mode (Bangladesh Restaurant Standard)", () => {
    it("extracts inclusive VAT correctly without double-charging the customer", () => {
      // Subtotal: 1050 (prices already include 5% VAT)
      // VAT extracted: 1050 * 5 / 105 = 50
      // Service charge: 10% = 105
      // Grand total: 1050 + 105 = 1155
      const result = calculateOrderTotals({
        items: [
          { basePrice: 350, quantity: 3 },
        ],
        vatPercentage: 5,
        isVatInclusive: true,
        serviceChargePercentage: 10,
        orderType: "dine_in_qr",
      });

      expect(result.subtotal).toBe(1050);
      expect(result.vatAmount).toBe(50);
      expect(result.serviceChargeAmount).toBe(105);
      expect(result.grandTotal).toBe(1155);
    });
  });

  describe("calculateOrderTotals - Discounts", () => {
    it("applies percentage discounts correctly to the taxable base", () => {
      // Subtotal: 1000
      // 20% discount = 200
      // Taxable base = 800
      // VAT 5% exclusive = 40
      // Service charge 10% = 80
      // Grand Total = 800 + 40 + 80 = 920
      const result = calculateOrderTotals({
        items: [{ basePrice: 1000, quantity: 1 }],
        vatPercentage: 5,
        isVatInclusive: false,
        serviceChargePercentage: 10,
        discount: { type: "percent", value: 20 },
      });

      expect(result.subtotal).toBe(1000);
      expect(result.discountAmount).toBe(200);
      expect(result.taxableBase).toBe(800);
      expect(result.serviceChargeAmount).toBe(80);
      expect(result.vatAmount).toBe(40);
      expect(result.grandTotal).toBe(920);
    });

    it("applies flat BDT discount correctly", () => {
      // Subtotal: 650
      // Flat discount: 150
      // Taxable base: 500
      // 0% VAT, 0% SC
      const result = calculateOrderTotals({
        items: [{ basePrice: 650, quantity: 1 }],
        vatPercentage: 0,
        isVatInclusive: false,
        serviceChargePercentage: 0,
        discount: { type: "flat", value: 150 },
      });

      expect(result.subtotal).toBe(650);
      expect(result.discountAmount).toBe(150);
      expect(result.taxableBase).toBe(500);
      expect(result.grandTotal).toBe(500);
    });

    it("caps discount if it exceeds the subtotal", () => {
      const result = calculateOrderTotals({
        items: [{ basePrice: 300, quantity: 1 }],
        vatPercentage: 5,
        isVatInclusive: false,
        serviceChargePercentage: 10,
        discount: { type: "flat", value: 500 }, // greater than 300
      });

      expect(result.discountAmount).toBe(300);
      expect(result.taxableBase).toBe(0);
      expect(result.vatAmount).toBe(0);
      expect(result.serviceChargeAmount).toBe(0);
      expect(result.grandTotal).toBe(0);
    });
  });

  describe("calculateOrderTotals - Takeaway Service Charge Waiver", () => {
    it("waives service charge when orderType is takeaway and flag is true", () => {
      const result = calculateOrderTotals({
        items: [{ basePrice: 500, quantity: 1 }],
        vatPercentage: 0,
        isVatInclusive: false,
        serviceChargePercentage: 10,
        orderType: "takeaway",
        waiveServiceChargeForTakeaway: true,
      });

      expect(result.serviceChargeAmount).toBe(0);
      expect(result.grandTotal).toBe(500);
    });

    it("applies service charge if orderType is dine_in_qr even with waiver flag set", () => {
      const result = calculateOrderTotals({
        items: [{ basePrice: 500, quantity: 1 }],
        vatPercentage: 0,
        isVatInclusive: false,
        serviceChargePercentage: 10,
        orderType: "dine_in_qr",
        waiveServiceChargeForTakeaway: true,
      });

      expect(result.serviceChargeAmount).toBe(50);
      expect(result.grandTotal).toBe(550);
    });
  });
});
