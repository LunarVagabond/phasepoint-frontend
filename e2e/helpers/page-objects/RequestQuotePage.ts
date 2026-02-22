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

  /** Switch to "Quantity only" inventory mode (number inputs per type, no detailed table). */
  async selectQuantityOnlyMode(): Promise<void> {
    await this.page.getByRole('button', { name: /quantity only/i }).click()
  }

  /** Set quantity for an asset type in "Quantity only" mode (e.g. "Laptop", "Phone", "Tablet"). Accepts "Laptops" etc. */
  async setQuantityForAssetType(assetTypeLabel: string, qty: number): Promise<void> {
    const normalized = assetTypeLabel.replace(/s$/, '')
    const input = this.page.getByRole('spinbutton', {
      name: new RegExp(`quantity of ${normalized}`, 'i'),
    })
    await input.fill(String(qty))
  }

  /** Select delivery: PICKUP ("Pickup") or DROP_OFF ("Drop Off") */
  async setDeliveryPickup(): Promise<void> {
    await this.page.getByRole('radio', { name: /^pickup$/i }).check()
  }

  async setDeliveryDropOff(): Promise<void> {
    await this.page.getByRole('radio', { name: /drop off/i }).check()
  }

  getSubmitButton() {
    return this.page.getByRole('button', { name: /submit|create request/i })
  }

  async submit(): Promise<void> {
    await this.getSubmitButton().click()
  }

  /** Fill minimal form in Quantity only mode: one asset type, quantity, PICKUP, then submit */
  async fillAndSubmitMinimal(assetTypeLabel: string, quantity: number): Promise<void> {
    await this.selectQuantityOnlyMode()
    await this.setQuantityForAssetType(assetTypeLabel, quantity)
    await this.setDeliveryPickup()
    await this.submit()
  }

  /** Fill form in Quantity only mode with multiple types and quantities, PICKUP, then submit */
  async fillAndSubmitWithChoices(choices: { label: string; qty: number }[]): Promise<void> {
    await this.selectQuantityOnlyMode()
    for (const { label, qty } of choices) {
      await this.setQuantityForAssetType(label, qty)
    }
    await this.setDeliveryPickup()
    await this.submit()
  }
}
