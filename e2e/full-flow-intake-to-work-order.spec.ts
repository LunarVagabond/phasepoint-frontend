/**
 * E2E full flow: Customer creates intake request → Employee accepts → Schedules pickup →
 * Intake assets to dirty cage → Create work order. Asserts states along the way.
 * Requires backend + frontend + test DB (load_dev_data). Run with: npm run test:e2e
 */
import { test, expect } from '@playwright/test'
import { LoginPage } from './helpers/page-objects/LoginPage'
import { RequestQuotePage } from './helpers/page-objects/RequestQuotePage'
import { DashboardPage } from './helpers/page-objects/DashboardPage'
import { IntakeRequestPage } from './helpers/page-objects/IntakeRequestPage'
import { IntakeViewPage } from './helpers/page-objects/IntakeViewPage'
import { AssetsListPage } from './helpers/page-objects/AssetsListPage'
import { CustomerPortalPage } from './helpers/page-objects/CustomerPortalPage'
import { EMPLOYEE_CREDENTIALS, CUSTOMER_CREDENTIALS } from './helpers/auth'

test.describe('Full flow: intake request → accept → intake → work order', () => {
  test.beforeEach(async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3330'
    const res = await page.request.get(`${baseURL}/api/health/`).catch(() => null)
    if (!res?.ok) test.skip()
  })

  test('customer creates request, employee accepts, schedules, intakes one asset, creates work order', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const login = new LoginPage(page)
    const requestQuote = new RequestQuotePage(page)
    const dashboard = new DashboardPage(page)
    const intakeRequestModal = new IntakeRequestPage(page)
    const intakeView = new IntakeViewPage(page)
    const assetsList = new AssetsListPage(page)
    const customerPortal = new CustomerPortalPage(page)

    // --- 1. Customer: create intake request (1–2 asset types, qty 1–3 each) ---
    const assetTypes = ['Laptops', 'Phones', 'Tablets']
    const seed = Date.now() % 100
    const numTypes = 1 + (seed % 2)
    const indices = [...new Set([seed % 3, (seed + 1) % 3])].slice(0, numTypes)
    const choices = indices.map((i) => ({
      label: assetTypes[i],
      qty: 1 + (seed % 3),
    }))
    await login.login(CUSTOMER_CREDENTIALS.username, CUSTOMER_CREDENTIALS.password)
    await requestQuote.goto()
    await expect(page.getByRole('heading', { name: /create disposal request/i })).toBeVisible({ timeout: 10_000 })
    await requestQuote.fillAndSubmitWithChoices(choices)
    await expect(page).toHaveURL(/\/customer-portal/, { timeout: 15_000 })

    // Log out: click then clear session so login form is shown (avoid redirect/guard issues)
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3330'
    await page.getByRole('link', { name: /log out/i }).click()
    await page.waitForTimeout(2000)
    await page.context().clearCookies()
    await page.goto(`${baseURL}/login`)
    await page.getByLabel(/username/i).waitFor({ state: 'visible', timeout: 10_000 })
    await login.loginWithoutGoto(EMPLOYEE_CREDENTIALS.username, EMPLOYEE_CREDENTIALS.password)

    // --- 2. Employee: dashboard, filter PENDING, sort newest first, open first request, accept ---
    await dashboard.goto()
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10_000 })
    await dashboard.filterIntakeByStatus('PENDING')
    await page.waitForTimeout(500)
    await page.getByRole('combobox', { name: /sort order/i }).selectOption({ value: '-created_at' })
    await page.waitForTimeout(800)
    await dashboard.openFirstIntakeRequest()
    await intakeRequestModal.waitForModal()
    await expect(intakeRequestModal.getAcceptButton()).toBeVisible({ timeout: 10_000 })
    await intakeRequestModal.accept()
    await expect(
      page.locator('.badge[data-status="ACCEPTED"]').or(page.getByText('ACCEPTED', { exact: true }))
    ).toBeVisible({ timeout: 5_000 })
    // Optional: schedule pickup when the card is visible (PICKUP delivery)
    const savePickup = page.getByRole('button', { name: /save pickup time/i })
    if (await savePickup.isVisible().catch(() => false)) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().slice(0, 10)
      await intakeRequestModal.fillPickupSchedule(dateStr, '10:00')
      await intakeRequestModal.savePickupTime()
      await page.waitForTimeout(1000)
    }
    await page.getByRole('link', { name: /back to dashboard/i }).click()

    // --- 3. Employee: Intake page — select customer, select request (starts intake), submit ---
    await intakeView.goto()
    await intakeView.selectCustomer('Acme')
    await page.waitForTimeout(800)
    await intakeView.selectFirstIntakeRequest()
    await intakeView.waitForPreparedRows()
    await intakeView.submitIntake()
    await expect(page).toHaveURL(/\/employee-portal\/assets/, { timeout: 15_000 })

    // --- 4. Employee: Assets list — select first asset, create work order ---
    await assetsList.waitForAssetsLoaded()
    await assetsList.selectFirstAsset()
    await assetsList.clickCreateWorkOrder()
    await expect(page.locator('.modal-backdrop').getByRole('heading', { name: /create work order/i })).toBeVisible({
      timeout: 5_000,
    })
    page.once('dialog', (d) => d.accept())
    await assetsList.submitCreateWorkOrderModal()
    await expect(page.locator('.modal-backdrop')).not.toBeVisible({ timeout: 10_000 })

    // --- 5. Customer: verify request appears and status (optional) ---
    await page.getByRole('link', { name: /log out/i }).click()
    await page.waitForTimeout(2000)
    await page.context().clearCookies()
    await page.goto(`${baseURL}/login`)
    await page.getByLabel(/username/i).waitFor({ state: 'visible', timeout: 10_000 })
    await login.loginWithoutGoto(CUSTOMER_CREDENTIALS.username, CUSTOMER_CREDENTIALS.password)
    await customerPortal.gotoRequests()
    await expect(page.getByRole('main')).toContainText(/request|tracking|processing|received/i)
  })
})
