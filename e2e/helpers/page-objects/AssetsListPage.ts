import type { Page } from '@playwright/test'

/**
 * Employee Assets list (AssetListView). Select assets, create work order.
 * Path: /employee-portal/assets (optional query: ?intake_batch=...)
 */
export class AssetsListPage {
  constructor(
    private readonly page: Page,
    private readonly basePath = '/employee-portal'
  ) {}

  async goto(query?: Record<string, string>): Promise<void> {
    const qs = query ? '?' + new URLSearchParams(query).toString() : ''
    await this.page.goto(`${this.basePath}/assets${qs}`)
  }

  /** First data row's checkbox (select first asset) */
  getFirstRowCheckbox() {
    return this.page.locator('tbody tr[data-row-clickable]').first().getByRole('checkbox')
  }

  /** Select the first asset in the table */
  async selectFirstAsset(): Promise<void> {
    await this.getFirstRowCheckbox().check()
  }

  /** Button "Create Work Order (N)" in toolbar */
  getCreateWorkOrderButton() {
    return this.page.getByRole('button', { name: /create work order \(\d+\)/i })
  }

  async clickCreateWorkOrder(): Promise<void> {
    await this.getCreateWorkOrderButton().click()
  }

  /** In the Create Work Order modal: submit button */
  getModalCreateWorkOrderButton() {
    return this.page.locator('.modal-backdrop').getByRole('button', { name: /create work order \(\d+ assets?\)/i })
  }

  async submitCreateWorkOrderModal(): Promise<void> {
    await this.getModalCreateWorkOrderButton().click()
  }

  /** Wait for assets table to have at least one row */
  async waitForAssetsLoaded(): Promise<void> {
    await this.page.locator('tbody tr[data-row-clickable]').first().waitFor({ state: 'visible', timeout: 15_000 })
  }
}
