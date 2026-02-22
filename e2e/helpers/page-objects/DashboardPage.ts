import type { Page } from '@playwright/test'

/**
 * Employee dashboard (AppLayout with DashboardView).
 * Path: /employee-portal or /employee-portal/
 */
export class DashboardPage {
  constructor(
    private readonly page: Page,
    private readonly basePath = '/employee-portal'
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(this.basePath)
  }

  /** Section "Intake requests" table or list */
  getIntakeRequestsSection() {
    return this.page.getByRole('heading', { name: /intake requests/i }).locator('..')
  }

  /** First clickable data row in the intake requests DataTable (uses class .data-row-clickable, not attribute) */
  getFirstIntakeRequestRow() {
    const section = this.getIntakeRequestsSection()
    return section.locator('tbody tr.data-row-clickable').first()
  }

  /** Filter intake requests by status (e.g. "PENDING", "SEEN"). Use empty string for "All statuses". */
  async filterIntakeByStatus(status: string): Promise<void> {
    await this.page.getByRole('combobox', { name: /filter by status/i }).selectOption({ value: status })
  }

  /** Wait for at least one intake request row to appear, then open the first one */
  async openFirstIntakeRequest(): Promise<void> {
    await this.getFirstIntakeRequestRow().click({ timeout: 30_000 })
  }

  /** Get intake request rows in the dashboard table */
  getIntakeRequestRows() {
    return this.page.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') })
  }
}
