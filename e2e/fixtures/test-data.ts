/**
 * E2E test data constants. Align with load_dev_data seed (customers, users, asset types).
 */
export const TEST_CUSTOMER = {
  name: 'Acme',
  email: 'contact@acme.com',
}

export const TEST_USER_EMPLOYEE = {
  username: process.env.E2E_EMPLOYEE_USERNAME || 'phasepoint',
  password: process.env.E2E_EMPLOYEE_PASSWORD || 'admin',
}

export const TEST_USER_CUSTOMER = {
  username: process.env.E2E_CUSTOMER_USERNAME || 'acme_admin',
  password: process.env.E2E_CUSTOMER_PASSWORD || 'password123',
}

export const ASSET_TYPES = ['LAPTOP', 'PHONE', 'TABLET', 'SERVER', 'OTHER'] as const
