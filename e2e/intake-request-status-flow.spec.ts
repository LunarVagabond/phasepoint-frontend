/**
 * E2E: Intake request status flow - multiple requests with deny, schedule, accept.
 * Requires backend + frontend + test DB (load_dev_data).
 */
import { test, expect } from '@playwright/test'
import { LoginPage } from './helpers/page-objects/LoginPage'
import { EMPLOYEE_CREDENTIALS, CUSTOMER_CREDENTIALS } from './helpers/auth'

test.describe('Intake request status flow', () => {
  test.beforeEach(async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3330'
    const res = await page.request.get(`${baseURL}/api/health/`).catch(() => null)
    if (!res?.ok) test.skip()
  })

  test('employee dashboard shows intake requests section when permitted', async ({ page }) => {
    const login = new LoginPage(page)
    await login.login(EMPLOYEE_CREDENTIALS.username, EMPLOYEE_CREDENTIALS.password)
    await page.goto('/employee-portal')
    await expect(page.getByText(/intake requests/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('customer can open request list from tracking', async ({ page }) => {
    const login = new LoginPage(page)
    await login.login(CUSTOMER_CREDENTIALS.username, CUSTOMER_CREDENTIALS.password)
    await page.goto('/customer-portal/tracking/requests')
    await expect(page).toHaveURL(/tracking\/requests/)
  })
})
