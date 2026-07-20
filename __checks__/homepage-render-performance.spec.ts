import { test, expect } from '@playwright/test'

/**
 * Catches a failure class their APM literally cannot see: nothing errors,
 * nothing 5xxs, every backend span stays clean, because the demo injects
 * this delay at the edge (Envoy fault injection on the image fetch) rather
 * than inside an instrumented service. A customer just watches the product
 * image never appear. Distributed tracing has no span for "felt slow."
 *
 * Threshold: 2s. Normal image fetch is near-instant; the demo's own
 * imageSlowLoad flag injects 5s or 10s, so this fails hard when it's on
 * and passes with headroom when it's off.
 */

const BASE_URL = process.env.ENVIRONMENT_URL ?? 'http://localhost:8080'
const RENDER_BUDGET_MS = 2000

test('the homepage hero image renders within budget', async ({ page }) => {
  const imageRequest = page.waitForResponse((res) => res.url().includes('/images/products/'))

  const start = Date.now()
  await page.goto(BASE_URL)
  await imageRequest
  const elapsedMs = Date.now() - start

  expect(elapsedMs, `product image took ${elapsedMs}ms to arrive (budget: ${RENDER_BUDGET_MS}ms)`).toBeLessThan(RENDER_BUDGET_MS)
})
