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
  is_staff?: boolean
  acknowledged_bundle_hash: string | null
  current_bundle_hash: string
  groups_display: string[]
  user_type: 'CUSTOMER' | 'EMPLOYEE'
  customer: string | null
  customer_profile_complete?: boolean
}

export interface CustomerSummary {
  id: string
  name: string
  code: string
  email: string
  phone: string
  address: string
  address_line1?: string
  address_line2?: string
  city?: string
  province?: string
  country?: string
  postal_code?: string
  notes: string
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

export async function updateCustomer(
  id: string,
  data: { name?: string; code?: string; email?: string; phone?: string; address?: string; notes?: string }
): Promise<CustomerSummary> {
  const r = await request(`/customers/${id}/`, { method: 'PATCH', body: JSON.stringify(data) })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

let csrfTokenFromApi: string | null = null

function getCsrfToken(): string | null {
  const match = document.cookie.match(/csrftoken=([^;]+)/)
  if (match?.[1]) {
    const token = match[1].trim()
    csrfTokenFromApi = token
    return token
  }
  if (csrfTokenFromApi) return csrfTokenFromApi
  return null
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
  let response = await fetch(url, { ...options, credentials: 'include', headers })
  if (method !== 'GET' && method !== 'HEAD' && response.status === 403) {
    const text = await response.clone().text()
    if (text.toLowerCase().includes('csrf failed')) {
      csrfTokenFromApi = null
      await ensureCsrfCookie()
      const retryToken = getCsrfToken()
      const retryHeaders: Record<string, string> = {
        ...headers,
      }
      if (retryToken) retryHeaders['X-CSRFToken'] = retryToken
      response = await fetch(url, { ...options, credentials: 'include', headers: retryHeaders })
    }
  }
  return response
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
  first_name: string
  last_name: string
  employee_id: string
  is_active: boolean
  is_staff: boolean
  user_type: 'CUSTOMER' | 'EMPLOYEE'
  customer: string | null
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

export async function getUsersByType(userType: 'EMPLOYEE' | 'CUSTOMER'): Promise<UserSummary[]> {
  const r = await request(`/users/?user_type=${userType}`)
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

export async function registerCustomer(data: {
  username: string
  password: string
  company_name: string
  email?: string
  phone?: string
}): Promise<{ user: string; id: string; user_type: 'CUSTOMER' | 'EMPLOYEE' }> {
  const r = await request('/auth/register-customer/', { method: 'POST', body: JSON.stringify(data) })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export interface CustomerProfile {
  id: string
  name: string
  email: string
  phone: string
  address: string
  address_line1: string
  address_line2: string
  city: string
  province: string
  country: string
  postal_code: string
  notes: string
}

export async function getCustomerProfile(): Promise<CustomerProfile> {
  const r = await request('/customer/profile/')
  if (!r.ok) throw new Error('Failed to get customer profile')
  return r.json()
}

export async function updateCustomerProfile(data: {
  email: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  province: string
  country: string
  postal_code: string
}): Promise<CustomerProfile> {
  const r = await request('/customer/profile/', { method: 'PATCH', body: JSON.stringify(data) })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export interface AddressSuggestion {
  display_name: string
  address_line1: string
  city: string
  province: string
  country: string
  postal_code: string
}

const US_STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO',
  connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID',
  illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA',
  maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS',
  missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
  oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA',
  washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY', 'district of columbia': 'DC',
}

function normalizeUsStateCode(address: Record<string, string | undefined>): string {
  const raw = (address.state_code || address.state || '').trim()
  if (!raw) return ''
  const upper = raw.toUpperCase()
  if (/^[A-Z]{2}$/.test(upper)) return upper
  const isoLvl4 = (address['ISO3166-2-lvl4'] || '').trim().toUpperCase()
  if (isoLvl4.startsWith('US-') && isoLvl4.length >= 5) {
    return isoLvl4.slice(3, 5)
  }
  return US_STATE_NAME_TO_CODE[raw.toLowerCase()] || ''
}

function pickAddressLine1(address: Record<string, string | undefined>): string {
  const number = address.house_number || ''
  const road = address.road || address.residential || address.pedestrian || ''
  return [number, road].filter(Boolean).join(' ').trim()
}

function pickCity(address: Record<string, string | undefined>): string {
  return address.city || address.town || address.village || address.hamlet || ''
}

export async function searchUsAddresses(query: string): Promise<AddressSuggestion[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const buildUrl = (queryText: string, restrictUs: boolean) => {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', queryText)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('limit', '8')
    if (restrictUs) url.searchParams.set('countrycodes', 'us')
    return url.toString()
  }
  const requestOnce = async (queryText: string, restrictUs: boolean) => {
    const r = await fetch(buildUrl(queryText, restrictUs), { headers: { Accept: 'application/json' } })
    if (!r.ok) return [] as Array<{ display_name?: string; address?: Record<string, string | undefined> }>
    return (await r.json()) as Array<{ display_name?: string; address?: Record<string, string | undefined> }>
  }

  const [primary, fallback] = await Promise.all([
    requestOnce(q, true),
    requestOnce(`${q}, USA`, false),
  ])
  const seen = new Set<string>()
  const rows = [...primary, ...fallback].filter((row) => {
    const key = row.display_name || ''
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
  return rows
    .map((row) => {
      const addr = row.address || {}
      const stateCode = normalizeUsStateCode(addr)
      return {
        display_name: row.display_name || '',
        address_line1: pickAddressLine1(addr),
        city: pickCity(addr),
        province: stateCode,
        country: 'United States',
        postal_code: addr.postcode || '',
      }
    })
    .filter((row) => !!row.address_line1 && !!row.city)
}

export async function getCustomerUsers(): Promise<UserSummary[]> {
  const r = await request('/customer/users/')
  if (!r.ok) throw new Error('Failed to get customer users')
  return r.json()
}

export async function createCustomerPortalUser(data: {
  username: string
  password: string
  email?: string
  first_name?: string
  last_name?: string
}): Promise<UserSummary> {
  const r = await request('/customer/users/create/', { method: 'POST', body: JSON.stringify(data) })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export interface CustomerUserProfile {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
}

export async function getCustomerMyProfile(): Promise<CustomerUserProfile> {
  const r = await request('/customer/me-profile/')
  if (!r.ok) throw new Error('Failed to get user profile')
  return r.json()
}

export async function updateCustomerMyProfile(data: {
  email: string
  first_name?: string
  last_name?: string
}): Promise<CustomerUserProfile> {
  const r = await request('/customer/me-profile/', { method: 'PATCH', body: JSON.stringify(data) })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function getCustomerContext(customerId: string): Promise<{
  customer: CustomerProfile
  users: UserSummary[]
  requests: Array<{ id: string; status: string; asset_quantities: Record<string, number>; created_at: string; updated_at: string }>
  sustainability: { total_weight_kg: number; recycled_weight_kg: number; disposed_weight_kg: number; reused_weight_kg: number }
}> {
  const r = await request(`/customers/${customerId}/context/`)
  if (!r.ok) throw new Error('Failed to get customer context')
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

export async function getKpis(format: 'json' | 'csv' | 'pdf' = 'json'): Promise<unknown | Blob> {
  const r = await request(`/reports/kpis/?format=${format}`)
  if (!r.ok) throw new Error('Failed to get KPI report')
  if (format === 'json') return r.json()
  return r.blob()
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

// Intake requests (public submit + portal list/update)
export const INTAKE_REQUEST_ASSET_TYPES = [
  { value: 'PHONE', label: 'Phones' },
  { value: 'LAPTOP', label: 'Laptops' },
  { value: 'TABLET', label: 'Tablets' },
  { value: 'SERVER', label: 'Servers' },
  { value: 'OTHER', label: 'Other' },
] as const

export interface IntakeRequestCustomerSearchHit {
  id: string
  name: string
}

export interface IntakeRequestSummary {
  id: string
  asset_types: string[]
  asset_quantities: Record<string, number>
  asset_types_display: string[]
  asset_quantities_display: string
  customer: string
  customer_name: string
  company_name_raw: string
  contact_name: string
  contact_email: string
  contact_phone: string
  notes: string
  internal_notes: string
  status: string
  rejected_reason: string
  accepted_by: string | null
  accepted_at: string | null
  created_at: string
  updated_at: string
}

export async function intakeRequestCustomerSearch(q: string): Promise<IntakeRequestCustomerSearchHit[]> {
  const r = await request(`/intake-requests/customer-search/?q=${encodeURIComponent(q)}`)
  if (!r.ok) return []
  return r.json()
}

export function canSeeIntakeRequests(me?: MeResponse | null): boolean {
  if (!me) return false
  const g = (me.groups_display || []).map((x) => x.toLowerCase())
  return me.is_staff === true || g.includes('operations') || g.includes('customer_relations')
}

export async function createIntakeRequest(data: {
  asset_types: string[]
  asset_quantities?: Record<string, number>
  customer_id?: string | null
  company_name?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
}): Promise<{ id: string; message: string }> {
  await ensureCsrfCookie()
  const r = await request('/intake-requests/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!r.ok) {
    const text = await r.text()
    let msg = text
    try {
      const j = JSON.parse(text)
      if (j.detail) msg = Array.isArray(j.detail) ? j.detail.join(' ') : j.detail
    } catch {
      // use text
    }
    throw new Error(msg)
  }
  return r.json()
}

export async function getMyIntakeRequests(): Promise<IntakeRequestSummary[]> {
  const r = await request('/customer/intake-requests/')
  if (!r.ok) throw new Error('Failed to get customer request history')
  return r.json()
}

export async function getCustomerSustainabilityImpact(): Promise<{
  total_weight_kg: number
  recycled_weight_kg: number
  disposed_weight_kg: number
  reused_weight_kg: number
  recycled_percent: number
  disposed_percent: number
  reused_percent: number
}> {
  const r = await request('/customer/sustainability-impact/')
  if (!r.ok) throw new Error('Failed to get sustainability impact')
  return r.json()
}

export async function getCustomerTerms(): Promise<{ title: string; content: string }> {
  const r = await request('/customer/terms/')
  if (!r.ok) throw new Error('Failed to get terms')
  return r.json()
}

export async function getIntakeRequests(params?: {
  status?: string
  search?: string
  ordering?: string
}): Promise<IntakeRequestSummary[]> {
  const q = new URLSearchParams()
  if (params?.status) q.set('status', params.status)
  if (params?.search) q.set('search', params.search)
  if (params?.ordering) q.set('ordering', params.ordering)
  const suffix = q.toString() ? '?' + q.toString() : ''
  const r = await request(`/intake-requests/${suffix}`)
  if (!r.ok) throw new Error('Failed to get intake requests')
  return r.json()
}

export async function getIntakeRequest(id: string): Promise<IntakeRequestSummary & { accepted_by_username?: string | null }> {
  const r = await request(`/intake-requests/${id}/`)
  if (!r.ok) throw new Error('Failed to get intake request')
  return r.json()
}

export async function updateIntakeRequest(
  id: string,
  data: { status?: string; rejected_reason?: string; internal_notes?: string }
): Promise<IntakeRequestSummary> {
  const r = await request(`/intake-requests/${id}/patch/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export { request, API_URL }
