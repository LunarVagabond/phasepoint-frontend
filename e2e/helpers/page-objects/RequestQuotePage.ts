import type { Page } from '@playwright/test'

/**
 * Customer "Create Disposal Request" form (RequestQuoteView).
 * Path: /customer-portal/requests/new
 */
export class RequestQuotePage {
  constructor(
    private readonly page: Page,
    private readonly basePath = '/customer-portal'
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(`${this.basePath}/requests/new`)
  }

  /** Check an asset type by label (e.g. "Laptops") */
  async checkAssetType(label: string | RegExp): Promise<void> {
    await this.page.getByRole('checkbox', { name: label }).check()
  }

  /** Set quantity for an asset type (input in the same row as the label) */
  async setQuantityForAssetType(assetTypeLabel: string, qty: number): Promise<void> {
    const row = this.page.locator('.asset-type-row').filter({ has: this.page.getByText(assetTypeLabel, { exact: false }) })
    await row.locator('input[type="number"]').fill(String(qty))
  }

  /** Select delivery: "We pick up" (PICKUP) or "I will drop off" (DROP_OFF) */
  async setDeliveryPickup(): Promise<void> {
    await this.page.getByLabel(/we pick up/i).check()
  }

  async setDeliveryDropOff(): Promise<void> {
    await this.page.getByLabel(/i will drop off/i).check()
  }

  getSubmitButton() {
    return this.page.getByRole('button', { name: /submit|create request/i })
  }

  async submit(): Promise<void> {
    await this.getSubmitButton().click()
  }

  /** Fill minimal form: one asset type, quantity, PICKUP, then submit */
  async fillAndSubmitMinimal(assetTypeLabel: string, quantity: number): Promise<void> {
    await this.checkAssetType(assetTypeLabel)
    await this.setQuantityForAssetType(assetTypeLabel, quantity)
    await this.setDeliveryPickup()
    await this.submit()
  }

  /** Fill form with multiple asset types and quantities, PICKUP, then submit */
  async fillAndSubmitWithChoices(choices: { label: string; qty: number }[]): Promise<void> {
    for (const { label, qty } of choices) {
      await this.checkAssetType(label)
      await this.setQuantityForAssetType(label, qty)
    }
    await this.setDeliveryPickup()
    await this.submit()
  }
}
