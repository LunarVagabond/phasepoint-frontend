/**
 * Test data factories for common API types.
 */
import type { MeResponse, CustomerSummary, IntakeRequestSummary, AuditEventSummary } from '@/api'

export function createMeResponse(overrides: Partial<MeResponse> = {}): MeResponse {
  return {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    is_staff: false,
    acknowledged_bundle_hash: 'hash-ack',
    current_bundle_hash: 'hash-current',
    groups_display: [],
    user_type: 'EMPLOYEE',
    customer: null,
    customer_profile_complete: true,
    ...overrides,
  }
}

export function createCustomerSummary(overrides: Partial<CustomerSummary> = {}): CustomerSummary {
  return {
    id: 'cust-1',
    name: 'Acme Corp',
    email: 'acme@example.com',
    phone: '555-0100',
    address: '123 Main St',
    notes: '',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createIntakeRequestSummary(
  overrides: Partial<IntakeRequestSummary> = {}
): IntakeRequestSummary {
  return {
    id: 'req-1',
    status: 'PENDING',
    asset_types: ['LAPTOP'],
    asset_quantities: { LAPTOP: 1 },
    asset_quantities_display: '1 LAPTOP',
    asset_types_display: ['LAPTOP'],
    customer: 'cust-1',
    company_name_raw: 'Acme',
    customer_name: 'Acme Corp',
    contact_name: 'Alice',
    contact_email: 'alice@acme.com',
    contact_phone: '',
    notes: '',
    internal_notes: '',
    rejected_reason: '',
    accepted_by: null,
    accepted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    delivery_type: 'PICKUP',
    ...overrides,
  }
}

export function createAuditEventSummary(
  overrides: Partial<AuditEventSummary> = {}
): AuditEventSummary {
  return {
    id: 'evt-1',
    event_type: 'INTAKE_REQUEST_CREATED',
    timestamp: new Date().toISOString(),
    user_username: 'testuser',
    user_id: 'user-1',
    asset_id: null,
    work_order_id: null,
    shipment_id: null,
    old_value: null,
    new_value: null,
    event_hash: 'abc123',
    ...overrides,
  }
}
