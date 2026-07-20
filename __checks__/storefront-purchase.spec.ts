import { test, expect } from '@playwright/test'

/**
 * The revenue path: browse -> product -> add to cart -> place order -> confirmation.
 *
 * This is the journey the prospect's customers were walking when they found
 * incidents before internal alerting did. Infra metrics stay green when the
 * payment service starts throwing errors; this check fails, because it does
 * exactly what a customer does.
 *
 * Selectors use the data-cy attributes the app itself ships for its own
 * Cypress suite: stable by design, not scraped from rendered markup.
 */

const BASE_URL = process.env.ENVIRONMENT_URL ?? 'http://localhost:8080'

// The National Park Foundation Explorascope. Deliberately pinned: it is also
// the product the demo's `productCatalogFailure` feature flag breaks, so this
// one journey covers both a full-site outage and a single-product failure.
const PRODUCT_ID = 'OLJCESPC7Z'

test('a customer can browse, add to cart, and complete checkout', async ({ page }) => {
  // 1. Home page renders and the catalog is actually populated.
  await page.goto(BASE_URL)
  await expect(page.locator('[data-cy="product-list"]')).toBeVisible()
  await expect(page.locator('[data-cy="product-card"]').first()).toBeVisible()

  // 2. Open the pinned product like a customer would: by clicking its card.
  await page.locator(`a[href="/product/${PRODUCT_ID}"]`).first().click()
  await expect(page.locator('[data-cy="product-detail"]')).toBeVisible()
  await expect(page.locator('[data-cy="product-name"]')).not.toBeEmpty()

  // 3. Add to cart. The app navigates to /cart on success.
  await page.locator('[data-cy="product-add-to-cart"]').click()
  await page.waitForURL('**/cart')

  // 4. Place the order. The demo pre-fills shipping and payment test data,
  //    so checkout is a single click, exactly what its own Cypress suite does.
  await page.locator('[data-cy="checkout-place-order"]').click()

  // 5. Confirmation: order id issued means checkout, payment, and shipping
  //    services all answered. This is the assertion that pages a human.
  await page.waitForURL('**/cart/checkout/**')
  await expect(page.getByText('Your order is complete!')).toBeVisible()
})
