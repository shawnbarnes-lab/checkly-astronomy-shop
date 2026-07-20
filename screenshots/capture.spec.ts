import { test } from '@playwright/test'

// One-off capture script, not a monitoring check. Walks the same purchase
// journey and saves screenshots at each step for the walkthrough deck.
const BASE_URL = process.env.ENVIRONMENT_URL ?? 'http://localhost:8080'
const OUT = 'screenshots'

test('capture walkthrough screenshots', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto(BASE_URL)
  await page.waitForSelector('[data-cy="product-card"]')
  await page.screenshot({ path: `${OUT}/01-storefront-home.png`, fullPage: false })

  await page.goto(`${BASE_URL}/product/OLJCESPC7Z`)
  await page.waitForSelector('[data-cy="product-add-to-cart"]')
  await page.screenshot({ path: `${OUT}/02-product-explorascope.png` })

  await page.locator('[data-cy="product-add-to-cart"]').click()
  await page.waitForURL('**/cart')
  await page.waitForSelector('[data-cy="checkout-place-order"]')
  await page.screenshot({ path: `${OUT}/03-cart-checkout.png`, fullPage: true })

  await page.locator('[data-cy="checkout-place-order"]').click()
  await page.waitForURL('**/cart/checkout/**')
  await page.getByText('Your order is complete!').waitFor()
  await page.screenshot({ path: `${OUT}/04-order-confirmation.png` })

  await page.goto(`${BASE_URL}/feature`)
  await page.waitForSelector('text=paymentFailure')
  await page.screenshot({ path: `${OUT}/05-flagd-configurator.png`, fullPage: true })
})
