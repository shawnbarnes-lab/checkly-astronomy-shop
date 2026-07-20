import { test } from '@playwright/test'

// One-off capture of the public status dashboard (deployed as code).
test('capture status dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('https://astronomy-shop-tensorspace.checkly-dashboards.com')
  await page.getByText('Storefront purchase journey').waitFor({ timeout: 30000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'screenshots/07-status-dashboard.png', fullPage: true })
})
