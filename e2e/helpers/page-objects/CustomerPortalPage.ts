import type { Page } from '@playwright/test'

/**
 * Customer portal (tracking: requests, assets, shipments, audit).
 * Default base path: /customer-portal/tracking (see router).
 */
export class CustomerPortalPage {
  constructor(
    private readonly page: Page,
    /** Base path for customer tracking (default: /customer-portal/tracking) */
    private readonly basePath = '/customer-portal/tracking'
  ) {}

  async gotoTracking(): Promise<void> {
    await this.page.goto(this.basePath)
  }

  async gotoRequests(): Promise<void> {
    await this.page.goto(`${this.basePath}/requests`)
  }

  async gotoRequestDetail(requestId: string): Promise<void> {
    await this.page.goto(`${this.basePath}/requests/${requestId}`)
  }

  async gotoAssets(): Promise<void> {
    await this.page.goto(`${this.basePath}/assets`)
  }

  async gotoAssetDetail(assetId: string): Promise<void> {
    await this.page.goto(`${this.basePath}/assets/${assetId}`)
  }

  async gotoShipments(): Promise<void> {
    await this.page.goto(`${this.basePath}/shipments`)
  }

  async gotoAuditTrail(): Promise<void> {
    await this.page.goto(`${this.basePath}/audit`)
  }

  /** Request history / audit events on request detail */
  getRequestHistory() {
    return this.page.locator('.request-item, .audit-event-item, [class*="history"]')
  }

  /** Audit trail event list */
  getAuditEvents() {
    return this.page.locator('.audit-event-item')
  }
}
