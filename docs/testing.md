# Testing

## Overview

- **Unit tests**: Vitest + Vue Test Utils (frontend). Target 75% coverage.
- **E2E tests**: Playwright (frontend). Happy path: intake requests → asset lifecycle → shipment, with audit trail checks.
- **Backend**: Django test framework; target 75% coverage. See backend repo `make test`, `make test-coverage`.

## Running tests

### Frontend (this repo)

**npm scripts:**

```bash
# Unit tests
npm run test:unit

# Unit tests with coverage (75% threshold)
npm run test:unit:coverage

# Watch mode
npm run test:unit:watch

# E2E (requires dev server or set PLAYWRIGHT_BASE_URL)
npm run test:e2e

# E2E with UI
npm run test:e2e:ui

# All
npm run test:all
```

**Make (wraps npm):**

```bash
make test              # same as test-unit
make test-unit         # Vitest
make test-unit-coverage
make test-e2e          # Playwright
make test-e2e-ui
make test-e2e-headed
make test-all          # unit then E2E
```

### Backend

From the backend repo. **Requires PostgreSQL** (e.g. `make start-db` or Docker):

```bash
make test
make test-coverage      # report in terminal
make test-coverage-html # htmlcov/index.html
```

If tests hang, ensure the database is running and reachable (e.g. `PGHOST`, `PGPORT`).

## Test structure

### Unit (frontend)

- **Location**: `src/**/*.{test,spec}.{ts,tsx,vue}`
- **Setup**: `src/test-utils/setup.ts` (Pinia, globals, fetch mock)
- **Helpers**: `src/test-utils/` — `mocks.ts`, `factories.ts`, `helpers.ts`
- **Stores**: `src/stores/__tests__/` — auth, apiCache
- **Composables**: `src/composables/__tests__/` — useAuth, useNotifications, useTheme
- **API utils**: `src/api.spec.ts` — status display, audit event formatting, location labels

### E2E (frontend)

- **Location**: `e2e/*.spec.ts`
- **Config**: `playwright.config.ts` (baseURL, chromium only by default, webServer)
- **Helpers**: `e2e/helpers/db.ts` (setupTestDb, teardownTestDb, resetTestDb), `e2e/helpers/auth.ts` (loginAsEmployee, loginAsCustomer)
- **Page objects**: `e2e/helpers/page-objects/` — LoginPage, DashboardPage, IntakeRequestPage, AssetPage, CustomerPortalPage
- **Fixtures**: credentials align with backend `load_dev_data`

Current E2E coverage: smoke (landing), login + page-load checks for dashboard, tracking, audit, assets, intake-request list. Specs that need the API call `/api/health/` and skip when the backend is not available.

**Full-flow E2E**  
`e2e/full-flow-intake-to-work-order.spec.ts` runs:

1. **Customer**: Create intake request at `/customer-portal/requests/new` (RequestQuotePage: Laptops 1, PICKUP, submit) → assert redirect to portal.
2. **Employee**: Dashboard → sort "Newest first" → open first intake request → Accept → close modal.
3. **Employee**: Intake page → select customer Acme → select first (ACCEPTED) request → submit intake → assert redirect to assets with batch.
4. **Employee**: Assets list → select first asset → Create work order (modal) → submit → assert modal closes (alert accepted).
5. **Customer**: Go to tracking/requests → assert request list visible.

Page objects: `RequestQuotePage`, `IntakeViewPage`, `AssetsListPage` (see `e2e/helpers/page-objects/`). Completing work order and shipment (assets through pipeline to RELEASED/SHIPPED) is not yet covered in this E2E; backend tests cover WO/shipment APIs and transitions.

### Backend

- **Location**: `apps/*/tests.py`
- **Base**: `core/test_utils.RLSTestCase` for RLS variable setup
- **Audit**: Tests assert `AuditEvent` with expected `event_type` after transitions (intake, status requests, work orders, shipments).

## E2E test data

For full E2E (intake → shipment, audit trails):

1. Start backend (DB + API), e.g. `make start` in backend repo.
2. Load seed data: `make load-dev-data` in backend repo (or use `e2e/helpers/db.ts` from a Node script).
3. Start frontend: `npm run dev`.
4. Run E2E: `npm run test:e2e`. Use credentials from `e2e/helpers/auth.ts` (e.g. phasepoint/admin, acme_admin/password123).

After E2E you can run `make unload-dev-data` in the backend to clear test data.

## Coverage summary

- **Frontend unit**: Vitest covers stores (auth, apiCache), composables (useAuth, useNotifications, useTheme), and API helpers (status/audit display). **Views and most of the app are not unit-tested**; coverage is low (~2–3% lines) and below the 75% goal. E2E covers critical user paths instead of view logic.
- **Frontend E2E**: Smoke (landing), login + page loads (dashboard, tracking, audit, assets, intake list), and one **full-flow** spec: customer create request → logout → employee accept → intake one asset → create work order → customer sees requests. **Not covered in E2E**: schedule pickup form, full pipeline (dirty cage → wipe → destroy/ship), work order detail transitions, shipment create/complete from UI.
- **Backend**: Django tests cover intake_requests (create, PATCH accept/schedule, start-intake, receive-asset, status requests), assets (RLS, bulk intake), work_orders (create, PATCH complete), shipments (create, add asset, mark completed), users, policies, kiosk. **Total backend coverage is ~41%** (below 75% target); reports, many views, and edge paths are untested.

## Full pipeline E2E (desired, not yet implemented)

A single E2E that walks the entire lifecycle would:

1. **Customer**: Log in → create request with **random asset types/quantities** (e.g. Laptops + Phones) → submit → **log out**.
2. **Employee**: Log in → dashboard → open newest request → **Accept** → **Schedule pickup** (date/time) → Intake page → select customer + request → **intake assets to dirty cage** (receive-asset) → Assets list → create work order.
3. **Employee**: Work order detail → move assets through **wipe** (or custody transfers: dirty cage → wipe station → clean cage) → then either **destroy** or **ship** (create shipment, add assets, mark completed, complete work order).
4. **Assert**: Request status, asset states/locations, work order and shipment status, and audit trail at each step and at end.

This requires: page objects for WorkOrderDetailView (transitions, complete), ShipmentDetailView (add assets, mark completed), and either Kiosk or custody-transfer UI; stable test data; and a long-running test with many waits. Backend transition rules are tested in Django; the gap is UI-driven E2E for the full pipeline.

## Coverage goals

- **Frontend**: 75% (lines, functions, branches, statements). Configured in `vitest.config.ts`. Currently unmet; views are exercised by E2E only.
- **Backend**: 75%. Configured in `.coveragerc` in the backend repo. Currently ~41%.

## Writing new tests

- **Unit**: Add `*.spec.ts` or `*.test.ts` next to the module or in `__tests__/`. Use `createMeResponse()`, `createCustomerSummary()` from `@/test-utils/factories`. Mock `@/api` with `vi.mock('@/api', ...)`.
- **E2E**: Add a `describe` in `e2e/*.spec.ts`. Use page objects and auth helpers. Rely on health-check skip when API is down.
- **Audit**: For any new state transition in the backend, call `log_event()` and add a test that asserts the corresponding `AuditEvent` exists (e.g. in `intake_requests/tests.py`, `assets/tests.py`).
