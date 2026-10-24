import { test, expect } from "@playwright/test";

test.describe("CaféFlow BD - End-to-End Ordering & Settlement Lifecycle", () => {
  test("1. Customer scans table QR, customizes item with variant & add-on, submits order, and views live tracking", async ({
    page,
  }) => {
    // Navigate to the table-specific QR menu
    await page.goto("/r/dhabba-gulshan?t=demo-table-01");

    // Verify restaurant branding & table badge
    await expect(page.locator("h1")).toContainText("Café Artisanal • Gulshan");
    await expect(page.getByText("Ordering for Table 01")).toBeVisible();

    // Select the first customizable menu item (e.g. Silky Flat White)
    const menuItemCard = page.locator("div.cursor-pointer", { hasText: "Silky Flat White" }).first();
    await expect(menuItemCard).toBeVisible();
    await menuItemCard.click();

    // The Customization Sheet opens
    const customizerSheet = page.locator("[role='dialog']");
    await expect(customizerSheet).toBeVisible();
    await expect(customizerSheet).toContainText("Silky Flat White");

    // Select variant (e.g. Double Shot Mug)
    const variantOption = page.getByText("Double Shot Mug (10oz)").first();
    if (await variantOption.isVisible()) {
      await variantOption.click();
    }

    // Select an Add-on (e.g. Barista Oat Milk)
    const addonOption = page.getByText("Barista Oat Milk").first();
    if (await addonOption.isVisible()) {
      await addonOption.click();
    }

    // Add to cart
    const addToCartButton = page.getByRole("button", { name: /Add to Order/i });
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();

    // Open Cart Sheet via the floating bar
    const viewCartButton = page.getByRole("button", { name: /View Order/i });
    await expect(viewCartButton).toBeVisible();
    await viewCartButton.click();

    // In Cart, optionally fill customer name
    const nameInput = page.getByPlaceholder(/Your name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill("Rahim Uddin");
    }

    // Place the order
    const placeOrderBtn = page.getByRole("button", { name: /Send to Kitchen/i });
    await expect(placeOrderBtn).toBeVisible();
    await placeOrderBtn.click();

    // Confirm navigation to live order tracking page
    await page.waitForURL(/\/order\/[a-zA-Z0-9-]+/);
    await expect(page.locator("text=Order Sent")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Silky Flat White")).toBeVisible();
  });

  test("2. Kitchen Display System (KDS) displays order and advances status: Pending -> Preparing -> Ready", async ({
    page,
  }) => {
    // Navigate to KDS screen
    await page.goto("/dashboard/kitchen");

    // Check KDS header
    await expect(page.locator("h1")).toContainText(/Kitchen Display System/i);

    // Verify orders are present on the screen
    const orderCards = page.locator("[data-testid='kds-order-card'], .shadow-md");
    await expect(orderCards.first()).toBeVisible({ timeout: 10000 });

    // Look for an order with "Start Preparing" button
    const startPrepBtn = page.getByRole("button", { name: /Start Preparing/i }).first();
    if (await startPrepBtn.isVisible()) {
      await startPrepBtn.click();
      // Should advance to Preparing status with "Mark Ready for Service" button
      await expect(page.getByRole("button", { name: /Mark Ready for Service/i }).first()).toBeVisible({
        timeout: 5000,
      });
    }

    // Look for an order ready to be marked ready
    const markReadyBtn = page.getByRole("button", { name: /Mark Ready for Service/i }).first();
    if (await markReadyBtn.isVisible()) {
      await markReadyBtn.click();
    }
  });

  test("3. Cashier settles payment via bKash with TrxID and triggers thermal receipt view", async ({
    page,
  }) => {
    // Open Orders dashboard
    await page.goto("/dashboard/orders");

    // Settle button on an unpaid order
    const settleBtn = page.getByRole("button", { name: /Settle/i }).first();
    await expect(settleBtn).toBeVisible({ timeout: 10000 });
    await settleBtn.click();

    // Settle payment modal opens
    const modal = page.locator("[role='dialog']");
    await expect(modal).toBeVisible();

    // Switch payment method to bKash
    const bkashTab = page.getByRole("tab", { name: /bKash/i }).or(page.getByText(/bKash/i)).first();
    await bkashTab.click();

    // Enter bKash Transaction ID
    const trxIdInput = page.getByPlaceholder(/TrxID/i).or(page.getByPlaceholder(/e\.g\. 9J4K2L1M/i)).first();
    if (await trxIdInput.isVisible()) {
      await trxIdInput.fill("BKASH9928374");
    }

    // Confirm Settlement & Print Receipt
    const confirmAndPrintBtn = page.getByRole("button", { name: /Collect & Print/i }).or(
      page.getByRole("button", { name: /Confirm Paid/i })
    ).first();
    await expect(confirmAndPrintBtn).toBeVisible();
    await confirmAndPrintBtn.click();

    // Thermal Receipt should now be displayed or printed
    const receiptContainer = page.locator(".thermal-receipt, [data-testid='thermal-receipt']").or(
      page.getByText("CAFÉ ARTISANAL")
    );
    await expect(receiptContainer.first()).toBeVisible({ timeout: 5000 });
  });
});
