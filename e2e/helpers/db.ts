/**
 * E2E test database helpers.
 * Run make load_dev_data / unload_dev_data in the backend repo to seed or clear test data.
 * Set PHASEPOINT_BACKEND_DIR to the backend project root (default: ../phasepoint-backend from frontend root).
 */
import { execSync } from 'child_process'
import path from 'path'

const defaultBackendDir = path.resolve(process.cwd(), '..', 'phasepoint-backend')
const backendDir = process.env.PHASEPOINT_BACKEND_DIR || defaultBackendDir

function runMake(target: string): void {
  execSync(`make ${target}`, {
    cwd: backendDir,
    stdio: 'inherit',
    encoding: 'utf-8',
  })
}

/**
 * Load dev/test data. Unloads existing data first, then runs migrations and loads seed data.
 * Call before E2E tests that need a known dataset.
 */
export function setupTestDb(): void {
  runMake('load-dev-data')
}

/**
 * Unload all dev/test data; preserves schema.
 * Call after E2E tests to leave DB clean.
 */
export function teardownTestDb(): void {
  runMake('unload-dev-data')
}

/**
 * Unload then load for a clean state.
 */
export function resetTestDb(): void {
  runMake('unload-dev-data')
  runMake('load-dev-data')
}
