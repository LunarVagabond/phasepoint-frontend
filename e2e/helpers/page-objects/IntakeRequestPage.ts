import type { Page } from '@playwright/test'

/**
 * Intake request detail / modal (employee view). Used from Dashboard or direct URL.
 */
export class IntakeRequestPage {
  constructor(private readonly page: Page) {}

  /** Intake detail modal container (dashboard modal) */
  getModal() {
    return this.page.locator('.intake-detail-modal').or(this.page.locator('.modal-backdrop').filter({ has: this.page.getByRole('heading', { name: /intake request/i }) }))
  }

  /** Wait for the intake request modal to be visible (after opening a row) */
  async waitForModal(): Promise<void> {
    await this.page.locator('.modal-backdrop .intake-detail-modal').waitFor({ state: 'visible', timeout: 15_000 })
  }

  /** Modal or section showing request status */
  getStatusBadge() {
    return this.page.getByRole('status').or(this.page.locator('.badge')).first()
  }

  /** Reject button (when request is PENDING/SEEN) */
  getRejectButton() {
    return this.page.getByRole('button', { name: /reject/i })
  }

  /** Accept button (scoped to modal to avoid matching filter options or other UI) */
  getAcceptButton() {
    const modal = this.page.locator('.intake-detail-modal')
    return modal.getByRole('button', { name: /^accept$/i })
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
