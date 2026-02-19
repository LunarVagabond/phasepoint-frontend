import type { Page } from '@playwright/test'

export class LoginPage {
  constructor(
    private readonly page: Page,
    private readonly basePath = '/login'
  ) {}

  async goto(): Promise<void> {
    await this.page.goto(this.basePath)
  }

  async fillUsername(username: string): Promise<void> {
    await this.page.getByLabel(/username|email|login/i).fill(username)
  }

  async fillPassword(password: string): Promise<void> {
    await this.page.getByLabel(/password/i).fill(password)
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: /sign in|login|submit/i }).click()
  }

  async login(username: string, password: string): Promise<void> {
    await this.goto()
    await this.fillUsername(username)
    await this.fillPassword(password)
    await this.submit()
    await this.page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 10_000 })
  }

  /** Fill credentials and submit without navigating. Use after clearing session and navigating to login yourself. */
  async loginWithoutGoto(username: string, password: string): Promise<void> {
    await this.page.getByLabel(/username|email|login/i).fill(username)
    await this.page.getByLabel(/password/i).fill(password)
    await this.page.getByRole('button', { name: /sign in|login|submit/i }).click()
    await this.page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 10_000 })
  }
}
