/**
 * E2E authentication helpers.
 * Use for logging in as employee or customer in Playwright tests.
 * Credentials match load_dev_data seed (e.g. phasepoint/admin, acme_admin/password).
 */
import type { Page } from '@playwright/test'

/** Default employee user from load_dev_data */
export const EMPLOYEE_CREDENTIALS = {
  username: process.env.E2E_EMPLOYEE_USERNAME || 'phasepoint',
  password: process.env.E2E_EMPLOYEE_PASSWORD || 'admin',
}

/** Default customer user from load_dev_data (Acme) */
export const CUSTOMER_CREDENTIALS = {
  username: process.env.E2E_CUSTOMER_USERNAME || 'acme_admin',
  password: process.env.E2E_CUSTOMER_PASSWORD || 'password123',
}

/**
 * Login as employee. Navigate to login and submit credentials.
 * Assumes baseURL is set (e.g. frontend dev server). Use /login or /employee-portal/login.
 */
export async function loginAsEmployee(page: Page, basePath = '/login'): Promise<void> {
  await page.goto(basePath)
  await page.getByLabel(/username|email|login/i).fill(EMPLOYEE_CREDENTIALS.username)
  await page.getByLabel(/password/i).fill(EMPLOYEE_CREDENTIALS.password)
  await page.getByRole('button', { name: /sign in|login|submit/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 10_000 })
}

/**
 * Login as customer.
 */
export async function loginAsCustomer(page: Page, basePath = '/login'): Promise<void> {
  await page.goto(basePath)
  await page.getByLabel(/username|email|login/i).fill(CUSTOMER_CREDENTIALS.username)
  await page.getByLabel(/password/i).fill(CUSTOMER_CREDENTIALS.password)
  await page.getByRole('button', { name: /sign in|login|submit/i }).click()
  await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 10_000 })
}
