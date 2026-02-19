import type { Page } from '@playwright/test'

/**
 * Employee Intake view: select customer, intake request, add assets, submit intake.
 * Path: /employee-portal/intake
 */
export class IntakeViewPage {
  constructor(
    private readonly page: Page,
    private readonly basePath = '/employee-portal'
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(`${this.basePath}/intake`)
  }

  /** Customer dropdown (select element) */
  getCustomerSelect() {
    return this.page.getByRole('combobox', { name: /customer/i }).first()
  }

  /** Select customer by visible text (e.g. "Acme") */
  async selectCustomer(customerName: string): Promise<void> {
    await this.getCustomerSelect().selectOption({ label: new RegExp(customerName, 'i') })
  }

  /** Intake request dropdown (visible after customer selected) */
  getIntakeRequestSelect() {
    return this.page.getByRole('combobox', { name: /intake request/i })
  }

  /** Select first intake request in the list (by index 1 if 0 is placeholder) */
  async selectFirstIntakeRequest(): Promise<void> {
    const select = this.getIntakeRequestSelect()
    await select.waitFor({ state: 'visible', timeout: 10_000 })
    // Option 0 is often "— Select —" or "Loading…"; first real option is usually index 1
    const options = await select.locator('option').allTextContents()
    const firstValue = await select.locator('option').nth(1).getAttribute('value')
    if (firstValue && firstValue !== '' && !firstValue.includes('Skip'))
      await select.selectOption({ value: firstValue })
    else
      await select.selectOption({ index: 1 })
  }

  /** Submit intake button */
  getIntakeButton() {
    return this.page.getByRole('button', { name: /^Intake$/i })
  }

  /** Wait for prepared table to have rows (after selecting an ACCEPTED request) */
  async waitForPreparedRows(): Promise<void> {
    await this.page.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 15_000 })
  }

  async submitIntake(): Promise<void> {
    await this.getIntakeButton().click()
  }
}
