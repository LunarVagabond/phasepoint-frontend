/**
 * E2E: Asset lifecycle - verify asset-related views and audit.
 * Full transition testing is covered by backend tests (transition_rules).
 * Requires backend + frontend + test DB.
 */
import { test, expect } from '@playwright/test'
import { LoginPage } from './helpers/page-objects/LoginPage'
import { EMPLOYEE_CREDENTIALS, CUSTOMER_CREDENTIALS } from './helpers/auth'

test.describe('Asset lifecycle E2E', () => {
  test.beforeEach(async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3330'
    const res = await page.request.get(`${baseURL}/api/health/`).catch(() => null)
    if (!res?.ok) test.skip()
  })

  test('employee assets list loads', async ({ page }) => {
    const login = new LoginPage(page)
    await login.login(EMPLOYEE_CREDENTIALS.username, EMPLOYEE_CREDENTIALS.password)
    await page.goto('/employee-portal/assets')
    await expect(page).toHaveURL(/employee-portal\/assets/)
    await expect(page.getByRole('heading', { name: /assets/i }).first()).toBeVisible({ timeout: 10_000 })
  })

  test('customer assets list loads', async ({ page }) => {
    const login = new LoginPage(page)
    await login.login(CUSTOMER_CREDENTIALS.username, CUSTOMER_CREDENTIALS.password)
    await page.goto('/customer-portal/tracking/assets')
    await expect(page).toHaveURL(/tracking\/assets/)
  })
})
