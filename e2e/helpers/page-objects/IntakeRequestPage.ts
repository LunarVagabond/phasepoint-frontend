import type { Page } from '@playwright/test'

/**
 * Intake request detail / modal (employee view). Used from Dashboard or direct URL.
 */
export class IntakeRequestPage {
  constructor(private readonly page: Page) {}

  /** Intake detail modal container (dashboard modal) or detail page */
  getModal() {
    return this.page.locator('.intake-detail-modal').or(this.page.locator('.modal-backdrop').filter({ has: this.page.getByRole('heading', { name: /intake request/i }) }))
  }

  /** Wait for intake request view: either modal (legacy) or detail page (current – dashboard navigates to /intake-requests/:id) */
  async waitForModal(): Promise<void> {
    const modal = this.page.locator('.modal-backdrop .intake-detail-modal')
    const detailPage = this.page.getByRole('heading', { name: /^intake request$/i })
    await Promise.race([
      modal.waitFor({ state: 'visible', timeout: 15_000 }),
      detailPage.waitFor({ state: 'visible', timeout: 15_000 }),
    ])
    // On detail page, wait for Actions section to be ready (any action: Accept, Start intake, or Add status note for COMPLETED)
    if (await this.page.locator('.intake-request-detail').isVisible().catch(() => false)) {
      const actionsReady = this.page
        .locator('.intake-request-detail')
        .locator('section.actions-card')
        .getByRole('button')
        .first()
      await actionsReady.waitFor({ state: 'visible', timeout: 10_000 })
    }
  }

  /** Modal or section showing request status */
  getStatusBadge() {
    return this.page.getByRole('status').or(this.page.locator('.badge')).first()
  }

  /** Reject button (when request is PENDING/SEEN) */
  getRejectButton() {
    return this.page.getByRole('button', { name: /reject/i })
  }

  /** Accept button (detail page or modal) */
  getAcceptButton() {
    return this.page.getByRole('button', { name: /^accept$/i })
  }

  /** Start intake button (when ACCEPTED) */
  getStartIntakeButton() {
    return this.page.getByRole('button', { name: /start intake|pickup/i })
  }

  /** Rejection reason input/textarea */
  getRejectionReasonInput() {
    return this.page.getByLabel(/reason|rejection/i).or(this.page.locator('textarea').first())
  }

  async rejectWithReason(reason: string): Promise<void> {
    await this.getRejectionReasonInput().fill(reason)
    await this.getRejectButton().click()
  }

  async accept(): Promise<void> {
    await this.getAcceptButton().click()
  }

  async startIntake(): Promise<void> {
    await this.getStartIntakeButton().click()
  }

  /** Schedule pickup (when request is ACCEPTED and delivery is PICKUP). Fill date (YYYY-MM-DD) and time (HH:mm) then save. */
  async fillPickupSchedule(date: string, time: string): Promise<void> {
    await this.page.locator('#pickup-date').fill(date)
    await this.page.locator('#pickup-time').fill(time)
  }

  getSavePickupTimeButton() {
    return this.page.getByRole('button', { name: /save pickup time/i })
  }

  async savePickupTime(): Promise<void> {
    await this.getSavePickupTimeButton().click()
  }
}
