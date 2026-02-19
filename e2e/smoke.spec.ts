/**
 * E2E smoke: public app loads without backend. No login or API required.
 * Other specs (intake-to-shipment, asset-lifecycle, intake-request-status-flow) cover real flows with backend.
 */
import { test, expect } from '@playwright/test'

test.describe('Smoke', () => {
  test('landing page loads and shows key content', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Phasepoint/i)
    await expect(page.getByRole('heading', { name: /secure itad/i }).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('link', { name: /access portal/i })).toBeVisible()
  })
})
