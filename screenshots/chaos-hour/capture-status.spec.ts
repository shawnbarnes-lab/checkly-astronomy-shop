import { test } from '@playwright/test'

// Captures the public status dashboard during the chaos hour.
// Filename label comes from CAPTURE_LABEL so each phase gets its own file.
const LABEL = process.env.CAPTURE_LABEL ?? 'unlabeled'

test('capture status dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('https://astronomy-shop-tensorspace.checkly-dashboards.com')
  await page.getByText('Storefront purchase journey').waitFor({ timeout: 30000 })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `screenshots/chaos-hour/status-${LABEL}.png`, fullPage: true })
})
