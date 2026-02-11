// API URL: Use VITE_API_URL from .env if set (e.g., https://pp-api.dcorps.dev/api for Cloudflare tunnels)
// Otherwise, use relative /api path - Vite proxy will forward to backend for local dev
const API_URL = import.meta.env.VITE_API_URL || "/api"

export interface PolicySummary {
  id: string
  name: string
  slug: string
  version: string
  effective_date: string
  owner: string
  status: string
}

export interface PolicyDetail extends PolicySummary {
  document_control_id: string
  body: string
  created_at: string
  updated_at: string
}

export interface MeResponse {
  id: string
  username: string
  email: string
  employee_id: string
  acknowledged_bundle_hash: string | null
  current_bundle_hash: string
  groups_display: string[]
}

export interface CustomerSummary {
  id: string
  name: string
  code: string
  created_at: string
}

export interface PendingRequestSummary {
  id: string
  to_location: string
  intended_action: string
}

export interface AssetSummary {
  id: string
  internal_asset_id: string
  manufacturer_model: string
  serial_number: string
  customer_id: string | null
  customer_name: string
  status: string
  location: string
  intake_timestamp: string | null
  intake_employee_username?: string | null
  intake_batch_id?: string | null
  pending_request?: PendingRequestSummary | null
  pending_request_display?: string | null
  created_at: string
}

export async function getCustomers(): Promise<CustomerSummary[]> {
  const r = await request('/customers/')
  if (!r.ok) throw new Error('Failed to get customers')
  return r.json()
}

export async function createCustomer(data: { name: string; code?: string }): Promise<CustomerSummary> {
  const r = await request('/customers/create/', { method: 'POST', body: JSON.stringify(data) })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

let csrfTokenFromApi: string | null = null

function getCsrfToken(): string | null {
  if (csrfTokenFromApi) return csrfTokenFromApi
  const match = document.cookie.match(/csrftoken=([^;]+)/)
  return match ? match[1].trim() : null
}

export async function ensureCsrfCookie(): Promise<void> {
  const r = await fetch(`${API_URL}/csrf/`, { credentials: 'include' })
  if (!r.ok) return
  try {
    const data = await r.json()
    if (data?.csrfToken) csrfTokenFromApi = data.csrfToken
  } catch {
    // ignore
  }
}

async function request(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_URL}${path.startsWith('/') ? path : '/' + path}`
  const method = (options.method || 'GET').toUpperCase()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (method !== 'GET' && method !== 'HEAD') {
    let token = getCsrfToken()
    if (!token) {
      await ensureCsrfCookie()
      token = getCsrfToken()
    }
    if (token) headers['X-CSRFToken'] = token
  }
  return fetch(url, { ...options, credentials: 'include', headers })
}

export async function getBundleHash(): Promise<{ bundle_hash: string }> {
  const r = await request('/policies/bundle-hash/')
  if (!r.ok) throw new Error('Failed to get bundle hash')
  return r.json()
}

export async function getPolicies(): Promise<PolicySummary[]> {
  const r = await request('/policies/')
  if (!r.ok) throw new Error('Failed to get policies')
  return r.json()
}

/** List draft policies (operations only). */
export async function getDraftPolicies(): Promise<PolicySummary[]> {
  const r = await request('/policies/drafts/')
  if (!r.ok) throw new Error('Failed to get drafts')
  return r.json()
}

export async function getPolicy(slug: string, version?: string): Promise<PolicyDetail> {
  const url = version ? `/policies/${slug}/?v=${encodeURIComponent(version)}` : `/policies/${slug}/`
  const r = await request(url)
  if (!r.ok) throw new Error('Failed to get policy')
  return r.json()
}

export interface PolicyVersion {
  id: string
  slug: string
  version: string
  effective_date: string
  status: string
  created_at: string
}

export async function getPolicyVersions(slug: string): Promise<PolicyVersion[]> {
  const r = await request(`/policies/${slug}/versions/`)
  if (!r.ok) throw new Error('Failed to get policy versions')
  return r.json()
}

export interface PolicyCreateData {
  name: string
  slug: string
  version?: string
  effective_date: string
  owner?: string
  document_control_id?: string
  body: string
  status?: string
}

export async function createPolicy(data: PolicyCreateData): Promise<PolicyDetail> {
  const r = await request('/policies/create/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!r.ok) {
    const text = await r.text()
    throw new Error(text || 'Failed to create policy')
  }
  return r.json()
}

export interface PolicyUpdateData {
  name?: string
  slug?: string
  version?: string
  effective_date?: string
  owner?: string
  document_control_id?: string
  body?: string
  status?: string
}

export async function updatePolicy(id: string, data: PolicyUpdateData): Promise<PolicyDetail> {
  const r = await request(`/policies/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  if (!r.ok) {
    const text = await r.text()
    throw new Error(text || 'Failed to update policy')
  }
  return r.json()
}

export async function deletePolicy(id: string): Promise<void> {
  const r = await request(`/policies/${id}/`, {
    method: 'DELETE',
  })
  if (!r.ok) {
    const text = await r.text()
    throw new Error(text || 'Failed to delete policy')
  }
}

/** Set policy status to archived so it no longer appears on the frontend. */
export async function archivePolicy(id: string): Promise<PolicyDetail> {
  return updatePolicy(id, { status: 'archived' })
}

export async function getPolicyPrint(slug?: string, version?: string): Promise<string> {
  let url = slug ? `/policies/${slug}/print/` : '/policies/print/'
  if (slug && version) {
    url += `?v=${encodeURIComponent(version)}`
  }
  const r = await request(url)
  if (!r.ok) throw new Error('Failed to get policy print')
  return r.text()
}

export function canEditPolicies(user?: MeResponse): boolean {
  return user?.groups_display?.some(g => g.toLowerCase() === 'operations') ?? false
}

export async function acknowledgePolicies(bundleHash: string): Promise<{ status: string; bundle_hash: string }> {
  const r = await request('/me/acknowledge-policies/', {
    method: 'POST',
    body: JSON.stringify({ bundle_hash: bundleHash }),
  })
  if (!r.ok) throw new Error('Failed to acknowledge')
  return r.json()
}

export async function getMe(): Promise<MeResponse> {
  const r = await request('/me/')
  if (!r.ok) throw new Error('Not authenticated')
  return r.json()
}

export interface UserSummary {
  id: string
  username: string
  email: string
  employee_id: string
  is_active: boolean
  is_staff: boolean
  groups_display: string[]
}

export interface GroupSummary {
  id: number
  name: string
}

export async function getUsers(): Promise<UserSummary[]> {
  const r = await request('/users/')
  if (!r.ok) throw new Error('Failed to get users')
  return r.json()
}

export async function getGroups(): Promise<GroupSummary[]> {
  const r = await request('/groups/')
  if (!r.ok) throw new Error('Failed to get groups')
  return r.json()
}

export interface OwnerChoice {
  value: string
  label: string
}

export interface OwnerChoicesResponse {
  groups: OwnerChoice[]
  users: OwnerChoice[]
}

export async function getOwnerChoices(): Promise<OwnerChoicesResponse> {
  const r = await request('/owner-choices/')
  if (!r.ok) throw new Error('Failed to get owner choices')
  return r.json()
}

export async function createUser(data: { username: string; password: string; email?: string; employee_id?: string }): Promise<UserSummary> {
  const r = await request('/users/create/', { method: 'POST', body: JSON.stringify(data) })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function updateUser(id: string, data: { email?: string; employee_id?: string; is_active?: boolean; is_staff?: boolean; groups?: number[] }): Promise<UserSummary> {
  const r = await request(`/users/${id}/`, { method: 'PATCH', body: JSON.stringify(data) })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function deleteUser(id: string): Promise<void> {
  const r = await request(`/users/${id}/`, { method: 'DELETE' })
  if (!r.ok) throw new Error(await r.text())
}

export async function login(username: string, password: string): Promise<{ user: string; id: string } | false> {
  const r = await request('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  if (!r.ok) return false
  return r.json()
}

export async function kioskBadgeLogin(badgeId: string): Promise<{ user: string; id: string }> {
  const r = await request('/auth/kiosk-badge/', {
    method: 'POST',
    body: JSON.stringify({ badge_id: badgeId.trim() }),
  })
  if (!r.ok) {
    const text = await r.text()
    let msg = text
    try {
      const j = JSON.parse(text)
      if (j.detail) msg = j.detail
    } catch {
      // use text as-is
    }
    throw new Error(msg)
  }
  return r.json()
}

export interface AssetIntakeData {
  internal_asset_id?: string
  manufacturer_model?: string
  serial_number?: string
  customer_id?: string | null
}

export async function createAsset(data: AssetIntakeData): Promise<AssetSummary> {
  const r = await request('/assets/', { method: 'POST', body: JSON.stringify(data) })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function getAssets(params?: { intake_batch?: string }): Promise<AssetSummary[]> {
  const q = new URLSearchParams()
  if (params?.intake_batch) q.set('intake_batch', params.intake_batch)
  const suffix = q.toString() ? '?' + q.toString() : ''
  const r = await request(`/assets/${suffix}`)
  if (!r.ok) throw new Error('Failed to get assets')
  return r.json()
}

export interface BulkIntakeItem {
  manufacturer_model: string
  serial_number: string
  customer_id: string | null
}

export interface BulkIntakeResponse {
  batch_id: string
  created_at: string
  created_by_username: string
  assets: AssetSummary[]
}

export async function bulkIntake(items: BulkIntakeItem[]): Promise<BulkIntakeResponse> {
  const r = await request('/assets/bulk-intake/', { method: 'POST', body: JSON.stringify({ items }) })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export interface IntakeBatchSummary {
  id: string
  created_at: string
  created_by_username: string
  asset_count: number
}

export async function getIntakeBatch(id: string): Promise<IntakeBatchSummary> {
  const r = await request(`/intake-batches/${id}/`)
  if (!r.ok) throw new Error('Failed to get intake batch')
  return r.json()
}

export async function getIntakeBatches(): Promise<IntakeBatchSummary[]> {
  const r = await request('/intake-batches/')
  if (!r.ok) throw new Error('Failed to get intake batches')
  return r.json()
}

export interface AssetDetail extends AssetSummary {
  intake_employee: string | null
  intake_employee_username?: string | null
  intake_batch_id?: string | null
  updated_at: string
}

export async function getAsset(id: string): Promise<AssetDetail> {
  const r = await request(`/assets/${id}/`)
  if (!r.ok) throw new Error('Failed to get asset')
  return r.json()
}

export const ASSET_LOCATIONS = [
  { value: 'INTAKE', label: 'Intake' },
  { value: 'DIRTY_CAGE', label: 'Dirty Cage' },
  { value: 'WIPE_STATION', label: 'Wipe Station' },
  { value: 'CLEAN_CAGE', label: 'Clean Cage' },
  { value: 'DESTRUCTION', label: 'Destruction' },
  { value: 'SHIPPED', label: 'Shipped' },
] as const

export interface CustodyRequestSummary {
  id: string
  asset: string
  asset_internal_id: string | null
  from_location: string
  to_location: string
  intended_action: string
  request_timestamp: string
  status: string
  requested_by: string | null
  requested_by_username: string | null
  completed_by: string | null
  completed_at: string | null
}

export async function getCustodyRequests(params?: { asset_id?: string; status?: string; mine?: boolean }): Promise<CustodyRequestSummary[]> {
  const q = new URLSearchParams()
  if (params?.asset_id) q.set('asset_id', params.asset_id)
  if (params?.status) q.set('status', params.status)
  if (params?.mine) q.set('mine', '1')
  const suffix = q.toString() ? '?' + q.toString() : ''
  const r = await request(`/custody-requests/${suffix}`)
  if (!r.ok) throw new Error('Failed to get custody requests')
  return r.json()
}

export async function cancelCustodyRequest(requestId: string): Promise<{ status: string; request_id: string }> {
  const r = await request(`/custody-requests/${requestId}/cancel/`, { method: 'POST' })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function createCustodyRequest(data: { asset_id: string; to_location: string; intended_action: string }): Promise<CustodyRequestSummary> {
  const r = await request('/custody-requests/', { method: 'POST', body: JSON.stringify(data) })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export interface ScanConfirmResponse {
  status: string
  asset_id: string
  new_status: string
  new_location: string
  request_id: string
}

export async function scanConfirm(data: {
  asset_id?: string
  asset_internal_id?: string
  kiosk_id?: string
}): Promise<ScanConfirmResponse> {
  const r = await request('/custody-requests/scan-confirm/', { method: 'POST', body: JSON.stringify(data) })
  if (!r.ok) {
    const text = await r.text()
    let msg = text
    try {
      const j = JSON.parse(text)
      if (j.detail) msg = j.detail
    } catch {
      // use text as-is
    }
    throw new Error(msg)
  }
  return r.json()
}

export interface KioskConfig {
  kiosk_id: string
  name: string
  assigned_location: string
  allowed_transitions: string[]
}

export async function getKioskConfig(kioskId: string): Promise<KioskConfig> {
  const r = await request(`/kiosks/${kioskId}/config/`)
  if (!r.ok) throw new Error('Kiosk not found or inactive')
  return r.json()
}

export async function getReport(path: string, format: 'json' | 'csv' = 'json'): Promise<unknown | Blob> {
  const r = await request(`${path}?format=${format}`)
  if (!r.ok) throw new Error('Failed to get report')
  if (format === 'csv') return r.blob()
  return r.json()
}

export interface AuditEventSummary {
  id: string
  asset_id: string | null
  event_type: string
  old_value: unknown
  new_value: unknown
  user_id: string | null
  user_username: string | null
  timestamp: string
  event_hash: string
}

export async function getAuditEvents(params?: { asset_id?: string; event_type?: string }): Promise<AuditEventSummary[]> {
  const q = new URLSearchParams()
  if (params?.asset_id) q.set('asset_id', params.asset_id)
  if (params?.event_type) q.set('event_type', params.event_type)
  const suffix = q.toString() ? '?' + q.toString() : ''
  const r = await request(`/audit-events/${suffix}`)
  if (!r.ok) throw new Error('Failed to get audit events')
  return r.json()
}

export { request, API_URL }
