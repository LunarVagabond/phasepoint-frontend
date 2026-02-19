import type { Page } from '@playwright/test'

/**
 * Asset detail view (employee AssetListView detail or customer asset detail).
 */
export class AssetPage {
  constructor(
    private readonly page: Page,
    private readonly basePath = '/employee-portal/assets'
  ) {}

  async gotoAsset(assetId: string): Promise<void> {
    await this.page.goto(`${this.basePath}?id=${assetId}`)
  }

  getStatusBadge() {
    return this.page.locator('.badge').first()
  }

  getLocationText() {
    return this.page.getByText(/location|Location/).locator('..')
  }

  /** Audit / history section */
  getAuditSection() {
    return this.page.getByRole('heading', { name: /history|audit/i }).locator('..')
  }
}
