/**
 * E2E: Login and page-load checks for employee dashboard, customer tracking, and audit trail pages.
 * Does not run the full flow (customer create request → employee accept → intake → work order → shipment).
 * See docs/testing.md "Full-flow E2E (not yet implemented)" for the intended end-to-end path.
 * Requires backend API + frontend and test DB (load_dev_data).
 */
import { test, expect } from '@playwright/test'
import { LoginPage } from './helpers/page-objects/LoginPage'
import { DashboardPage } from './helpers/page-objects/DashboardPage'
import { CustomerPortalPage } from './helpers/page-objects/CustomerPortalPage'
import { EMPLOYEE_CREDENTIALS, CUSTOMER_CREDENTIALS } from './helpers/auth'

test.describe('Intake to shipment flow', () => {
  test.beforeEach(async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3330'
    const res = await page.request.get(`${baseURL}/api/health/`).catch(() => null)
    if (!res?.ok) {
      test.skip()
    }
  })

  test('employee can log in and see dashboard', async ({ page }) => {
    const login = new LoginPage(page)
    await login.login(EMPLOYEE_CREDENTIALS.username, EMPLOYEE_CREDENTIALS.password)
    await page.goto('/employee-portal')
    await expect(page).toHaveURL(/employee-portal/)
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10_000 })
  })

  test('customer can log in and see tracking', async ({ page }) => {
    const login = new LoginPage(page)
    await login.login(CUSTOMER_CREDENTIALS.username, CUSTOMER_CREDENTIALS.password)
    await page.goto('/customer-portal/tracking')
    await expect(page).toHaveURL(/customer-portal\/tracking/)
    await expect(page.getByRole('heading', { name: /requests|tracking|my assets/i })).toBeVisible({ timeout: 10_000 })
  })

  test('customer portal audit trail page loads', async ({ page }) => {
    const login = new LoginPage(page)
    await login.login(CUSTOMER_CREDENTIALS.username, CUSTOMER_CREDENTIALS.password)
    const portal = new CustomerPortalPage(page)
    await portal.gotoAuditTrail()
    await expect(page.getByRole('main').getByRole('heading', { name: /audit trail/i })).toBeVisible({ timeout: 10_000 })
  })

  test('employee audit trail page loads', async ({ page }) => {
    const login = new LoginPage(page)
    await login.login(EMPLOYEE_CREDENTIALS.username, EMPLOYEE_CREDENTIALS.password)
    await page.goto('/employee-portal/audit')
    await expect(page.getByRole('main').getByRole('heading', { name: /audit trail/i })).toBeVisible({ timeout: 10_000 })
  })
})
