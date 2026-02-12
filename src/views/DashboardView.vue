<template>
  <div class="dashboard">
    <section class="dashboard-section">
      <h2 class="section-title">My open custody requests</h2>
      <p class="section-desc">Cancel a request if you no longer want to move the asset.</p>
      <DataTable
        :columns="openRequestsColumns"
        :data="openRequestsData"
        :loading="openRequestsLoading"
        row-key="id"
      >
        <template #row-actions="{ row }">
          <button type="button" class="btn-sm btn-cancel" @click="cancelRequest(row)">Cancel request</button>
        </template>
      </DataTable>
      <p v-if="!openRequestsLoading && openRequests.length === 0" class="modal-muted">No open custody requests.</p>
    </section>
    <section class="dashboard-section">
      <h2 class="section-title">Employees</h2>
      <DataTable
        :columns="employeeColumns"
        :data="tableData"
        :loading="loading"
        row-key="id"
      >
        <template #row-actions="{ row }">
          <button type="button" class="btn-sm btn-edit" @click="openEdit(row)" aria-label="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <span class="action-separator">|</span>
          <button type="button" class="btn-sm btn-remove" :disabled="(row as unknown as UserSummary).id === meId" @click="removeUser(row)" aria-label="Remove">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </template>
        <template #add-row="{ colspan }">
          <tr class="add-row">
            <td :colspan="colspan">
              <div class="add-user-form">
                <span class="add-label"><span class="add-icon">+</span> Add employee</span>
                <input v-model="newUser.username" placeholder="Username" />
                <input v-model="newUser.password" type="password" placeholder="Password" />
                <input v-model="newUser.email" type="email" placeholder="Email" />
                <input v-model="newUser.employee_id" placeholder="Employee ID" />
                <button type="button" class="btn-add" :disabled="adding" @click="addUser">Add</button>
                <span v-if="addError" class="error-inline">{{ addError }}</span>
              </div>
            </td>
          </tr>
        </template>
      </DataTable>
    </section>
    <section class="dashboard-section">
      <h2 class="section-title">Customer Users</h2>
      <DataTable
        :columns="customerUserColumns"
        :data="customerUsersTableData"
        :loading="loading"
        row-key="id"
      />
    </section>

    <section v-if="showIntakeRequests" class="dashboard-section">
      <h2 class="section-title">Intake requests</h2>
      <p class="section-desc">Review and process incoming requests. Visible to Operations and Customer Relations.</p>
      <div class="list-toolbar">
        <select v-model="intakeStatusFilter" class="filter-select" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="SEEN">Seen</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <input
          v-model="intakeSearchQuery"
          type="search"
          class="filter-input"
          placeholder="Search company or request ID…"
          aria-label="Search requests"
        />
        <select v-model="intakeOrdering" class="filter-select" aria-label="Sort order">
          <option value="">Oldest first</option>
          <option value="-created_at">Newest first</option>
        </select>
      </div>
      <DataTable
        :columns="intakeColumns"
        :data="intakeTableData"
        :loading="intakeLoading"
        row-key="id"
        :row-click="openIntakeModal"
      />
      <p v-if="!intakeLoading && intakeRequests.length === 0" class="modal-muted">No intake requests.</p>
    </section>

    <section class="dashboard-section">
      <h2 class="section-title">Customers</h2>
      <p class="section-desc">Click a row to view details and edit internal notes.</p>
      <DataTable
        :columns="customerColumns"
        :data="customersTableData"
        :loading="customersLoading"
        row-key="id"
        :row-click="openCustomerModal"
      >
        <template #add-row="{ colspan }">
          <tr class="add-row">
            <td :colspan="colspan">
              <div class="add-user-form">
                <span class="add-label"><span class="add-icon">+</span> Add customer</span>
                <input v-model="newCustomer.name" placeholder="Name" />
                <button type="button" class="btn-add" :disabled="addingCustomer" @click="addCustomer">Add</button>
                <span v-if="customerError" class="error-inline">{{ customerError }}</span>
              </div>
            </td>
          </tr>
        </template>
      </DataTable>
    </section>

    <div v-if="selectedIntakeRequest" class="modal-backdrop" @click.self="closeIntakeModal">
      <div class="modal modal-wide intake-detail-modal" @click.stop>
        <h3>Intake request</h3>
        <template v-if="!showRejectForm">
          <dl class="intake-detail-dl">
            <dt>Created</dt>
            <dd>{{ formatDate(selectedIntakeRequest.created_at) }}</dd>
            <dt>Company</dt>
            <dd>{{ selectedIntakeRequest.customer_name || selectedIntakeRequest.company_name_raw || '—' }}</dd>
            <dt>Contact</dt>
            <dd>{{ [selectedIntakeRequest.contact_name, selectedIntakeRequest.contact_email, selectedIntakeRequest.contact_phone].filter(Boolean).join(' · ') || '—' }}</dd>
            <dt>Asset types</dt>
            <dd>{{ selectedIntakeRequest.asset_quantities_display || selectedIntakeRequest.asset_types_display?.join(', ') || '—' }}</dd>
            <dt>Customer notes</dt>
            <dd class="detail-notes">{{ selectedIntakeRequest.notes || '—' }}</dd>
            <dt>Status</dt>
            <dd><span class="badge">{{ selectedIntakeRequest.status }}</span></dd>
            <template v-if="selectedIntakeRequest.rejected_reason">
              <dt>Rejection reason</dt>
              <dd class="detail-notes">{{ selectedIntakeRequest.rejected_reason }}</dd>
            </template>
            <template v-if="selectedIntakeRequest.accepted_at">
              <dt>Accepted</dt>
              <dd>{{ formatDate(selectedIntakeRequest.accepted_at) }}</dd>
            </template>
          </dl>
          <div class="form-row">
            <label for="intake-internal-notes">Internal notes</label>
            <textarea
              id="intake-internal-notes"
              v-model="editIntakeNotes"
              placeholder="Internal notes (staff only)…"
              rows="3"
            />
            <button type="button" class="btn-primary btn-save-note" :disabled="savingIntakeNote" @click="saveIntakeNoteFromModal">Save note</button>
          </div>
          <p v-if="intakeError" class="modal-error">{{ intakeError }}</p>
          <div class="modal-actions intake-modal-actions">
            <template v-if="selectedIntakeRequest.status === 'PENDING'">
              <button type="button" class="btn-sm btn-seen" @click="setIntakeStatusFromModal('SEEN')">Mark seen</button>
            </template>
            <template v-if="['PENDING', 'SEEN'].includes(selectedIntakeRequest.status)">
              <button type="button" class="btn-sm btn-accept" @click="setIntakeStatusFromModal('ACCEPTED')">Accept</button>
              <button type="button" class="btn-sm btn-reject" @click="showRejectForm = true">Reject</button>
            </template>
            <template v-if="selectedIntakeRequest.status === 'ACCEPTED'">
              <button type="button" class="btn-sm btn-complete" @click="setIntakeStatusFromModal('COMPLETED')">Complete</button>
            </template>
            <button type="button" class="btn-secondary" @click="closeIntakeModal">Close</button>
          </div>
        </template>
        <template v-else>
          <div class="reject-form">
            <h4 class="reject-title">Reject this request</h4>
            <label class="field-label" for="reject-reason">Reason for rejection <span class="required">*</span></label>
            <textarea
              id="reject-reason"
              v-model="rejectReason"
              class="textarea-input"
              placeholder="Enter reason for rejection…"
              rows="4"
            />
            <p v-if="rejectError" class="modal-error">{{ rejectError }}</p>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="cancelRejectForm">Cancel</button>
              <button type="button" class="btn-danger" :disabled="savingReject || !rejectReason.trim()" @click="confirmReject">Confirm reject</button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div v-if="selectedCustomer" class="modal-backdrop" @click.self="closeCustomerModal">
      <div class="modal modal-wide customer-detail-modal" @click.stop>
        <h3>Customer</h3>
        <dl class="intake-detail-dl">
          <dt>Company</dt>
          <dd>{{ selectedCustomer.name }}</dd>
          <dt>Email</dt>
          <dd>{{ selectedCustomer.email || '—' }}</dd>
          <dt>Phone</dt>
          <dd>{{ selectedCustomer.phone || '—' }}</dd>
          <dt>Address</dt>
          <dd class="detail-notes">{{ formatCustomerAddress(selectedCustomer) }}</dd>
        </dl>
        <div class="form-row">
          <label class="field-label" for="customer-notes">Internal notes</label>
          <textarea
            id="customer-notes"
            v-model="editCustomerNotes"
            class="textarea-input"
            placeholder="Internal notes…"
            rows="4"
          />
        </div>
        <p v-if="customerSaveError" class="modal-error">{{ customerSaveError }}</p>
        <div class="modal-actions">
          <router-link
            v-if="selectedCustomer && canViewCustomerContext"
            class="btn-secondary"
            :to="`/employee-portal/customers/${selectedCustomer.id}/portal`"
          >
            Open customer portal (read-only)
          </router-link>
          <button type="button" class="btn-secondary" @click="closeCustomerModal">Close</button>
          <button type="button" class="btn-primary" :disabled="savingCustomer" @click="saveCustomerNotes">Save notes</button>
        </div>
      </div>
    </div>

    <div v-if="confirmDialog.show" class="modal-backdrop" @click.self="closeConfirm">
      <div class="modal modal-wide confirm-modal" @click.stop>
        <h3>{{ confirmDialog.title }}</h3>
        <p class="confirm-message">{{ confirmDialog.message }}</p>
        <p v-if="confirmError" class="modal-error">{{ confirmError }}</p>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="closeConfirm">Cancel</button>
          <button
            type="button"
            :class="confirmDialog.danger ? 'btn-danger' : 'btn-primary'"
            :disabled="confirmPending"
            @click="runConfirm"
          >
            {{ confirmPending ? 'Please wait…' : confirmDialog.confirmLabel }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="editingUser" class="modal-backdrop" @click.self="editingUser = null">
      <div class="modal modal-wide" @click.stop>
        <h3>Edit {{ editingUser.username }}</h3>
        <div class="modal-form">
          <div class="form-row">
            <label>Email</label>
            <input v-model="editEmail" type="email" placeholder="Email" />
          </div>
          <div class="form-row">
            <label>Employee ID</label>
            <input v-model="editEmployeeId" placeholder="Employee ID" />
          </div>
          <div class="form-row form-row-check">
            <label class="group-check">
              <input type="checkbox" v-model="editIsStaff" />
              Staff (can access Django admin)
            </label>
          </div>
          <p class="modal-sub">Assign groups</p>
          <div v-if="groups.length" class="group-list">
            <label v-for="g in groups" :key="g.id" class="group-check">
              <input type="checkbox" :value="g.id" v-model="editGroupIds" />
              {{ g.name }}
            </label>
          </div>
          <p v-else class="modal-muted">No groups defined. Create groups in Django admin to assign them here.</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="editingUser = null">Cancel</button>
          <button type="button" class="btn-primary" :disabled="saving" @click="saveEdit">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { getUsersByType, getGroups, createUser, updateUser, deleteUser, getMe, getCustomers, createCustomer, updateCustomer, getCustodyRequests, cancelCustodyRequest, canSeeIntakeRequests, getIntakeRequests, updateIntakeRequest } from '../api'
import DataTable from '../components/DataTable.vue'
import type { UserSummary, CustomerSummary, CustodyRequestSummary, IntakeRequestSummary, MeResponse } from '../api'
import type { DataTableColumn } from '../components/DataTable.vue'

const employeeColumns: DataTableColumn[] = [
  { key: 'username', label: 'Username', type: 'strong' },
  { key: 'email', label: 'Email' },
  { key: 'employee_id', label: 'Employee ID' },
  { key: 'active_display', label: 'Active', type: 'badge' },
  { key: 'staff_display', label: 'Staff', type: 'badge' },
  { key: 'groups_str', label: 'Groups' },
]

const customerColumns: DataTableColumn[] = [
  { key: 'name', label: 'Company', type: 'strong' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address_display', label: 'Address' },
  { key: 'notes_short', label: 'Internal notes' },
]
const customerUserColumns: DataTableColumn[] = [
  { key: 'username', label: 'Username', type: 'strong' },
  { key: 'email', label: 'Email' },
  { key: 'customer_name', label: 'Company' },
  { key: 'active_display', label: 'Active', type: 'badge' },
]

const openRequestsColumns: DataTableColumn[] = [
  { key: 'asset_internal_id', label: 'Asset', type: 'strong' },
  { key: 'from_location', label: 'From' },
  { key: 'to_location', label: 'To' },
  { key: 'request_timestamp_display', label: 'Requested' },
]

const intakeColumns: DataTableColumn[] = [
  { key: 'created_at_display', label: 'Created', type: 'strong' },
  { key: 'customer_name', label: 'Company' },
  { key: 'contact_display', label: 'Contact' },
  { key: 'status', label: 'Status', type: 'badge' },
]

const employeeUsers = ref<UserSummary[]>([])
const customerUsers = ref<UserSummary[]>([])
const groups = ref<Awaited<ReturnType<typeof getGroups>>>([])
const me = ref<MeResponse | null>(null)
const meId = computed(() => me.value?.id ?? null)
const showIntakeRequests = computed(() => canSeeIntakeRequests(me.value ?? undefined))
const canViewCustomerContext = computed(() => {
  if (!me.value) return false
  if (me.value.is_staff) return true
  const groups = (me.value.groups_display || []).map((g) => g.toLowerCase())
  return groups.includes('customer_relations')
})
const loading = ref(true)
const tableData = computed(() =>
  employeeUsers.value.map((u) => ({
    ...u,
    active_display: u.is_active ? 'Yes' : 'No',
    staff_display: u.is_staff ? 'Yes' : 'No',
    groups_str: u.groups_display.length ? u.groups_display.join(', ') : '—',
  }))
)
const customerUsersTableData = computed(() =>
  customerUsers.value.map((u) => ({
    ...u,
    active_display: u.is_active ? 'Yes' : 'No',
  }))
)

const customers = ref<CustomerSummary[]>([])
const customersLoading = ref(true)
const customersTableData = computed(() =>
  customers.value.map((c) => ({
    ...c,
    address_display: formatCustomerAddress(c),
    notes_short: truncateStr(c.notes || '', 40),
  }))
)
const newCustomer = reactive({ name: '' })
const addingCustomer = ref(false)
const customerError = ref('')
const selectedCustomer = ref<CustomerSummary | null>(null)
const editCustomerNotes = ref('')
const savingCustomer = ref(false)
const customerSaveError = ref('')

const confirmDialog = ref<{
  show: boolean
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void | Promise<void>
}>({
  show: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  onConfirm: () => {},
})
const confirmError = ref('')
const confirmPending = ref(false)

const openRequests = ref<CustodyRequestSummary[]>([])
const openRequestsLoading = ref(true)
const openRequestsData = computed(() =>
  openRequests.value.map((r) => ({
    ...r,
    request_timestamp_display: formatDate(r.request_timestamp),
  }))
)

const intakeRequests = ref<IntakeRequestSummary[]>([])
const intakeLoading = ref(false)
const intakeStatusFilter = ref('')
const intakeSearchQuery = ref('')
const intakeOrdering = ref('')
const selectedIntakeRequest = ref<IntakeRequestSummary | null>(null)
const editIntakeNotes = ref('')
const savingIntakeNote = ref(false)
const intakeError = ref('')
const showRejectForm = ref(false)
const rejectReason = ref('')
const rejectError = ref('')
const savingReject = ref(false)

function truncateStr(s: string, len: number): string {
  if (!s || !s.trim()) return '—'
  const t = s.trim()
  return t.length <= len ? t : t.slice(0, len) + '…'
}

function formatCustomerAddress(c: CustomerSummary): string {
  const line1 = (c.address_line1 || '').trim()
  const line2 = (c.address_line2 || '').trim()
  const city = (c.city || '').trim()
  const state = (c.province || '').trim()
  const postal = (c.postal_code || '').trim()
  const primary = [line1, line2].filter(Boolean).join(', ')
  const locality = [city, state, postal].filter(Boolean).join(' ')
  const structured = [primary, locality].filter(Boolean).join(', ')
  return structured || (c.address || '').trim() || '—'
}

const intakeTableData = computed(() =>
  intakeRequests.value.map((r) => ({
    ...r,
    created_at_display: formatDate(r.created_at),
    asset_types_display_str: r.asset_quantities_display
      || (Array.isArray(r.asset_types_display) ? r.asset_types_display.join(', ') : (r.asset_types || []).join(', ')),
    contact_display: [r.contact_name, r.contact_email].filter(Boolean).join(' — ') || r.contact_email || '—',
    notes_short: truncateStr(r.notes || '', 50),
  }))
)

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

const newUser = reactive({ username: '', password: '', email: '', employee_id: '' })
const adding = ref(false)
const addError = ref('')

const editingUser = ref<UserSummary | null>(null)
const editEmail = ref('')
const editEmployeeId = ref('')
const editIsStaff = ref(false)
const editGroupIds = ref<number[]>([])
const saving = ref(false)

async function load() {
  try {
    const [employeeList, customerList, groupList, meRes] = await Promise.all([
      getUsersByType('EMPLOYEE'),
      getUsersByType('CUSTOMER'),
      getGroups(),
      getMe(),
    ])
    employeeUsers.value = employeeList
    customerUsers.value = customerList
    groups.value = groupList
    me.value = meRes
  } finally {
    loading.value = false
  }
}

function loadIntakeRequests() {
  if (!showIntakeRequests.value) return
  intakeLoading.value = true
  getIntakeRequests({
    status: intakeStatusFilter.value || undefined,
    search: intakeSearchQuery.value.trim() || undefined,
    ordering: intakeOrdering.value || undefined,
  })
    .then((data) => {
      intakeRequests.value = data
    })
    .catch(() => {
      intakeRequests.value = []
    })
    .finally(() => {
      intakeLoading.value = false
    })
}

watch([intakeStatusFilter, intakeSearchQuery, intakeOrdering], () => {
  loadIntakeRequests()
})

watch(selectedIntakeRequest, (r) => {
  editIntakeNotes.value = r?.internal_notes ?? ''
}, { immediate: true })

function openIntakeModal(row: Record<string, unknown>) {
  const id = row.id as string
  if (!id) return
  const full = intakeRequests.value.find((r) => r.id === id) ?? null
  selectedIntakeRequest.value = full
  editIntakeNotes.value = full?.internal_notes ?? ''
  intakeError.value = ''
  showRejectForm.value = false
  rejectReason.value = ''
  rejectError.value = ''
}

function closeIntakeModal() {
  selectedIntakeRequest.value = null
  showRejectForm.value = false
  rejectReason.value = ''
  rejectError.value = ''
  intakeError.value = ''
}

async function setIntakeStatusFromModal(status: string) {
  if (!selectedIntakeRequest.value) return
  const id = selectedIntakeRequest.value.id
  intakeError.value = ''
  try {
    const updated = await updateIntakeRequest(id, { status })
    selectedIntakeRequest.value = updated
    loadIntakeRequests()
  } catch (e) {
    intakeError.value = e instanceof Error ? e.message : 'Update failed.'
  }
}

async function saveIntakeNoteFromModal() {
  if (!selectedIntakeRequest.value) return
  const id = selectedIntakeRequest.value.id
  intakeError.value = ''
  savingIntakeNote.value = true
  try {
    const updated = await updateIntakeRequest(id, { internal_notes: editIntakeNotes.value })
    selectedIntakeRequest.value = updated
    loadIntakeRequests()
  } catch (e) {
    intakeError.value = e instanceof Error ? e.message : 'Failed to save note.'
  } finally {
    savingIntakeNote.value = false
  }
}

function cancelRejectForm() {
  showRejectForm.value = false
  rejectReason.value = ''
  rejectError.value = ''
}

async function confirmReject() {
  if (!selectedIntakeRequest.value || !rejectReason.value.trim()) return
  rejectError.value = ''
  savingReject.value = true
  try {
    await updateIntakeRequest(selectedIntakeRequest.value.id, {
      status: 'REJECTED',
      rejected_reason: rejectReason.value.trim(),
    })
    loadIntakeRequests()
    closeIntakeModal()
  } catch (e) {
    rejectError.value = e instanceof Error ? e.message : 'Reject failed.'
  } finally {
    savingReject.value = false
  }
}


async function loadCustomers() {
  try {
    customers.value = await getCustomers()
  } finally {
    customersLoading.value = false
  }
}

async function addUser() {
  if (!newUser.username.trim() || !newUser.password) return
  addError.value = ''
  adding.value = true
  try {
    await createUser({
      username: newUser.username.trim(),
      password: newUser.password,
      email: newUser.email.trim() || undefined,
      employee_id: newUser.employee_id.trim() || undefined,
    })
    newUser.username = ''
    newUser.password = ''
    newUser.email = ''
    newUser.employee_id = ''
    await load()
  } catch (e) {
    addError.value = e instanceof Error ? e.message : 'Failed to add user.'
  } finally {
    adding.value = false
  }
}

function openEdit(row: UserSummary | Record<string, unknown>) {
  const user = row as UserSummary
  editingUser.value = user
  editEmail.value = user.email ?? ''
  editEmployeeId.value = user.employee_id ?? ''
  editIsStaff.value = user.is_staff ?? false
  const groupIds = groups.value.filter((g) => user.groups_display.includes(g.name)).map((g) => g.id)
  editGroupIds.value = [...groupIds]
}

async function saveEdit() {
  if (!editingUser.value) return
  saving.value = true
  try {
    await updateUser(editingUser.value.id, {
      email: editEmail.value.trim() || undefined,
      employee_id: editEmployeeId.value.trim() || undefined,
      is_staff: editIsStaff.value,
      groups: editGroupIds.value,
    })
    editingUser.value = null
    await load()
  } finally {
    saving.value = false
  }
}

async function addCustomer() {
  if (!newCustomer.name.trim()) return
  customerError.value = ''
  addingCustomer.value = true
  try {
    await createCustomer({ name: newCustomer.name.trim() })
    newCustomer.name = ''
    await loadCustomers()
  } catch (e) {
    customerError.value = e instanceof Error ? e.message : 'Failed to add customer.'
  } finally {
    addingCustomer.value = false
  }
}

function openCustomerModal(row: Record<string, unknown>) {
  const id = row.id as string
  if (!id) return
  const c = customers.value.find((x) => x.id === id) ?? null
  selectedCustomer.value = c
  editCustomerNotes.value = c?.notes ?? ''
  customerSaveError.value = ''
}

function closeCustomerModal() {
  selectedCustomer.value = null
  customerSaveError.value = ''
}

async function saveCustomerNotes() {
  if (!selectedCustomer.value) return
  customerSaveError.value = ''
  savingCustomer.value = true
  try {
    const updated = await updateCustomer(selectedCustomer.value.id, { notes: editCustomerNotes.value })
    selectedCustomer.value = updated
    await loadCustomers()
  } catch (e) {
    customerSaveError.value = e instanceof Error ? e.message : 'Failed to save notes.'
  } finally {
    savingCustomer.value = false
  }
}

function closeConfirm() {
  confirmDialog.value = { ...confirmDialog.value, show: false }
  confirmError.value = ''
}

async function runConfirm() {
  confirmError.value = ''
  confirmPending.value = true
  try {
    await confirmDialog.value.onConfirm()
    closeConfirm()
  } catch (e) {
    confirmError.value = e instanceof Error ? e.message : 'Something went wrong.'
  } finally {
    confirmPending.value = false
  }
}

function removeUser(row: UserSummary | Record<string, unknown>) {
  const user = row as UserSummary
  if (user.id === meId.value) return
  confirmDialog.value = {
    show: true,
    title: 'Remove user',
    message: `Remove ${user.username}? They will no longer be able to log in.`,
    confirmLabel: 'Remove',
    danger: true,
    onConfirm: async () => {
      await deleteUser(user.id)
      await load()
    },
  }
  confirmError.value = ''
}

async function loadOpenRequests() {
  try {
    openRequests.value = await getCustodyRequests({ status: 'pending', mine: true })
  } catch {
    openRequests.value = []
  } finally {
    openRequestsLoading.value = false
  }
}

function cancelRequest(row: CustodyRequestSummary | Record<string, unknown>) {
  const request = row as CustodyRequestSummary
  const assetId = request.asset_internal_id || request.asset
  confirmDialog.value = {
    show: true,
    title: 'Cancel custody request',
    message: `Cancel move request for asset ${assetId}?`,
    confirmLabel: 'Cancel request',
    onConfirm: async () => {
      await cancelCustodyRequest(request.id)
      await loadOpenRequests()
    },
  }
  confirmError.value = ''
}

onMounted(async () => {
  await load()
  loadCustomers()
  loadOpenRequests()
  if (showIntakeRequests.value) loadIntakeRequests()
})

watch(showIntakeRequests, (visible) => {
  if (visible && intakeRequests.value.length === 0 && !intakeLoading.value) loadIntakeRequests()
})
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.list-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  margin-bottom: $space-4;
}

.filter-select,
.filter-input {
  padding: $space-2 $space-3;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: $font-size-base;
}

.filter-input {
  min-width: 200px;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.row-actions .btn-sm {
  padding: $space-1 $space-2;
  font-size: $font-size-sm;
  border-radius: $radius-md;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
}
.row-actions .btn-seen:hover { background: var(--color-border); }
.row-actions .btn-accept { border-color: var(--color-success, green); color: var(--color-success, green); }
.row-actions .btn-accept:hover { background: rgba(34, 197, 94, 0.1); }
.row-actions .btn-reject { border-color: var(--color-error); color: var(--color-error); }
.row-actions .btn-reject:hover { background: rgba(239, 68, 68, 0.1); }
.row-actions .btn-complete:hover { background: var(--color-border); }
.row-actions .btn-note { color: var(--color-text-muted); }
.row-actions .btn-note:hover { background: var(--color-border); }

.table-hint {
  font-size: $font-size-sm;
  color: var(--color-text-muted);
  margin: $space-2 0 0;
}

.intake-detail-modal .intake-detail-dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: $space-2 $space-6;
  margin: 0 0 $space-6;
  font-size: $font-size-base;
}
.intake-detail-modal dt {
  color: var(--color-text-muted);
  font-weight: 500;
}
.intake-detail-modal dd {
  margin: 0;
  min-width: 0;
}
.intake-detail-modal .detail-notes {
  white-space: pre-wrap;
  word-break: break-word;
}
.intake-detail-modal .badge {
  display: inline-block;
  padding: $space-1 $space-2;
  border-radius: $radius-md;
  font-size: $font-size-sm;
  background: var(--color-border);
  color: var(--color-text);
}
.intake-modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
}
.intake-modal-actions .btn-sm {
  padding: $space-1 $space-2;
  font-size: $font-size-sm;
  border-radius: $radius-md;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
}
.intake-modal-actions .btn-seen:hover { background: var(--color-border); }
.intake-modal-actions .btn-accept { border-color: var(--color-success, green); color: var(--color-success, green); }
.intake-modal-actions .btn-accept:hover { background: rgba(34, 197, 94, 0.1); }
.intake-modal-actions .btn-reject { border-color: var(--color-error); color: var(--color-error); }
.intake-modal-actions .btn-reject:hover { background: rgba(239, 68, 68, 0.1); }
.intake-modal-actions .btn-complete:hover { background: var(--color-border); }
.intake-modal-actions .btn-note { color: var(--color-text-muted); }
.intake-modal-actions .btn-note:hover { background: var(--color-border); }

.modal-error {
  color: var(--color-error);
  font-size: $font-size-sm;
  margin: $space-2 0 0;
}

.intake-detail-modal .form-row .btn-save-note {
  margin-top: $space-2;
}

.required { color: var(--color-error); }

.reject-form .reject-title {
  font-size: $font-size-base;
  font-weight: 600;
  margin: 0 0 $space-4;
  color: var(--color-text);
}
.reject-form .field-label {
  display: block;
  font-size: $font-size-sm;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: $space-1;
}
.reject-form .textarea-input {
  width: 100%;
  margin-bottom: $space-4;
  padding: $space-3 $space-4;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: $font-size-base;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
}
.reject-form .textarea-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.confirm-modal .confirm-message {
  margin: 0 0 $space-4;
  color: var(--color-text);
  line-height: 1.5;
}

.customer-detail-modal .form-row {
  margin-top: $space-4;
}
.customer-detail-modal .form-row .field-label {
  display: block;
  font-size: $font-size-sm;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: $space-1;
}
.customer-detail-modal .textarea-input {
  width: 100%;
  padding: $space-3 $space-4;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: $font-size-base;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
}
.customer-detail-modal .textarea-input:focus {
  outline: none;
  border-color: var(--color-primary);
}
</style>
