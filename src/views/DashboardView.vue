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
      <div class="section-head">
        <h2 class="section-title">Employees</h2>
        <button type="button" class="btn-add-in-header" @click="showAddEmployeeModal = true">
          <span class="add-icon">+</span> Add employee
        </button>
      </div>
      <DataTable
        :columns="employeeColumns"
        :data="tableData"
        :loading="loading"
        row-key="id"
        :row-click="openEmployeeDetail"
      >
        <template #row-actions="{ row }">
          <div @click.stop>
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
          </div>
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
      <div class="section-head">
        <h2 class="section-title">Customers</h2>
        <button type="button" class="btn-add-in-header" @click="showAddCustomerModal = true">
          <span class="add-icon">+</span> Add customer
        </button>
      </div>
      <p class="section-desc">Click a row to view details and edit internal notes.</p>
      <DataTable
        :columns="customerColumns"
        :data="customersTableData"
        :loading="customersLoading"
        row-key="id"
        :row-click="openCustomerModal"
      />
    </section>

    <div v-if="selectedIntakeRequest" class="modal-backdrop" @click.self="closeIntakeModal">
      <div class="modal modal-wide intake-detail-modal" @click.stop>
        <h3>Intake request</h3>
        <template v-if="!showRejectForm">
          <table class="detail-table">
            <tbody>
              <tr>
                <th scope="row">Created</th>
                <td>{{ formatDate(selectedIntakeRequest.created_at) }}</td>
              </tr>
              <tr>
                <th scope="row">Company</th>
                <td>{{ selectedIntakeRequest.customer_name || selectedIntakeRequest.company_name_raw || '—' }}</td>
              </tr>
              <tr>
                <th scope="row">Contact</th>
                <td>{{ [selectedIntakeRequest.contact_name, selectedIntakeRequest.contact_email, selectedIntakeRequest.contact_phone].filter(Boolean).join(' · ') || '—' }}</td>
              </tr>
              <tr>
                <th scope="row">Asset types</th>
                <td>{{ selectedIntakeRequest.asset_quantities_display || selectedIntakeRequest.asset_types_display?.join(', ') || '—' }}</td>
              </tr>
              <tr>
                <th scope="row">Customer notes</th>
                <td class="detail-notes">{{ selectedIntakeRequest.notes || '—' }}</td>
              </tr>
              <tr>
                <th scope="row">Delivery</th>
                <td>{{ logisticsLabel(selectedIntakeRequest) }}</td>
              </tr>
              <tr>
                <th scope="row">Status</th>
                <td><span class="badge">{{ selectedIntakeRequest.status }}</span></td>
              </tr>
              <tr v-if="selectedIntakeRequest.rejected_reason">
                <th scope="row">Rejection reason</th>
                <td class="detail-notes">{{ selectedIntakeRequest.rejected_reason }}</td>
              </tr>
              <tr v-if="selectedIntakeRequest.accepted_at">
                <th scope="row">Accepted</th>
                <td>{{ formatDate(selectedIntakeRequest.accepted_at) }}</td>
              </tr>
            </tbody>
          </table>
          <div
            v-if="selectedIntakeRequest.status === 'ACCEPTED' && (selectedIntakeRequest.delivery_type || 'PICKUP') === 'PICKUP'"
            class="pickup-schedule-card"
          >
            <h4 class="pickup-schedule-title">Schedule pickup</h4>
            <p class="pickup-schedule-hint">Set when the team will pick up this request. Date and time are in your local timezone.</p>
            <div class="pickup-schedule-row">
              <div class="pickup-field">
                <label for="pickup-date">Date</label>
                <input
                  id="pickup-date"
                  v-model="pickupDate"
                  type="date"
                  class="text-input pickup-input"
                  min="2020-01-01"
                />
              </div>
              <div class="pickup-field">
                <label for="pickup-time">Time</label>
                <input
                  id="pickup-time"
                  v-model="pickupTime"
                  type="time"
                  class="text-input pickup-input"
                />
              </div>
              <div class="pickup-actions">
                <button type="button" class="btn-primary" :disabled="savingPickup || !pickupDate || !pickupTime" @click="savePickupFromModal">
                  {{ savingPickup ? 'Saving…' : 'Save pickup time' }}
                </button>
              </div>
            </div>
          </div>

          <div class="form-row">
            <label class="field-label" for="intake-internal-notes">Internal notes</label>
            <textarea
              id="intake-internal-notes"
              v-model="editIntakeNotes"
              class="text-input textarea-input"
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
        <table class="detail-table">
          <tbody>
            <tr>
              <th scope="row">Company</th>
              <td>{{ selectedCustomer.name }}</td>
            </tr>
            <tr>
              <th scope="row">Email</th>
              <td>{{ selectedCustomer.email || '—' }}</td>
            </tr>
            <tr>
              <th scope="row">Phone</th>
              <td>{{ selectedCustomer.phone || '—' }}</td>
            </tr>
            <tr>
              <th scope="row">Address</th>
              <td class="detail-notes">{{ formatCustomerAddress(selectedCustomer) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="modal-form">
          <div class="form-row">
            <label class="field-label" for="customer-notes">Internal notes</label>
            <textarea
              id="customer-notes"
              v-model="editCustomerNotes"
              class="text-input textarea-input"
              placeholder="Internal notes…"
              rows="4"
            />
          </div>
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

    <div v-if="showAddEmployeeModal" class="modal-backdrop" @click.self="closeAddEmployeeModal">
      <div class="modal modal-wide" @click.stop>
        <h3>Add employee</h3>
        <div class="modal-form">
          <div class="form-row">
            <label class="field-label" for="new-user-username">Username</label>
            <input id="new-user-username" v-model="newUser.username" type="text" class="text-input" placeholder="Username" />
          </div>
          <div class="form-row">
            <label class="field-label" for="new-user-password">Password</label>
            <input id="new-user-password" v-model="newUser.password" type="password" class="text-input" placeholder="Password" />
          </div>
          <div class="form-row">
            <label class="field-label" for="new-user-email">Email</label>
            <input id="new-user-email" v-model="newUser.email" type="email" class="text-input" placeholder="Email" />
          </div>
          <div class="form-row">
            <label class="field-label" for="new-user-first-name">First name</label>
            <input id="new-user-first-name" v-model="newUser.first_name" type="text" class="text-input" placeholder="First name" />
          </div>
          <div class="form-row">
            <label class="field-label" for="new-user-last-name">Last name</label>
            <input id="new-user-last-name" v-model="newUser.last_name" type="text" class="text-input" placeholder="Last name" />
          </div>
          <div class="form-row">
            <label class="field-label" for="new-user-phone">Phone</label>
            <input id="new-user-phone" v-model="newUser.phone" type="tel" class="text-input" placeholder="Phone" />
          </div>
          <p v-if="addError" class="modal-error">{{ addError }}</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="closeAddEmployeeModal">Cancel</button>
          <button type="button" class="btn-primary" :disabled="adding || !newUser.username.trim() || !newUser.password" @click="addUser">Add</button>
        </div>
      </div>
    </div>

    <div v-if="showAddCustomerModal" class="modal-backdrop" @click.self="closeAddCustomerModal">
      <div class="modal modal-wide" @click.stop>
        <h3>Add customer</h3>
        <div class="modal-form">
          <div class="form-row">
            <label class="field-label" for="new-customer-name">Company name</label>
            <input id="new-customer-name" v-model="newCustomer.name" class="text-input" placeholder="Company name" />
          </div>
          <div class="form-row">
            <label class="field-label" for="new-customer-email">Email</label>
            <input id="new-customer-email" v-model="newCustomer.email" type="email" class="text-input" placeholder="Email" />
          </div>
          <div class="form-row">
            <label class="field-label" for="new-customer-phone">Phone</label>
            <input id="new-customer-phone" v-model="newCustomer.phone" type="tel" class="text-input" placeholder="Phone" />
          </div>
          <div class="form-row">
            <label class="field-label" for="new-customer-address1">Address</label>
            <input
              id="new-customer-address1"
              v-model="newCustomer.address_line1"
              type="text"
              class="text-input"
              placeholder="Start typing street address…"
              autocomplete="off"
            />
            <ul v-if="customerAddressSuggestions.length" class="address-suggestions">
              <li
                v-for="item in customerAddressSuggestions"
                :key="item.display_name"
                @mousedown.prevent="applyCustomerAddressSuggestion(item)"
              >
                {{ item.display_name }}
              </li>
            </ul>
            <p v-else-if="customerAddressSearching" class="modal-muted">Searching addresses…</p>
          </div>
          <div class="form-row">
            <label class="field-label" for="new-customer-address2">Address line 2</label>
            <input id="new-customer-address2" v-model="newCustomer.address_line2" type="text" class="text-input" placeholder="Apartment, suite, etc." />
          </div>
          <div class="address-grid">
            <div class="form-row">
              <label class="field-label" for="new-customer-city">City</label>
              <input id="new-customer-city" v-model="newCustomer.city" type="text" class="text-input" placeholder="City" />
            </div>
            <div class="form-row">
              <label class="field-label" for="new-customer-province">State</label>
              <select id="new-customer-province" v-model="newCustomer.province" class="text-input">
                <option value="">Select state</option>
                <option v-for="s in US_STATES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="form-row">
              <label class="field-label" for="new-customer-country">Country</label>
              <input id="new-customer-country" v-model="newCustomer.country" type="text" class="text-input" placeholder="Country" />
            </div>
            <div class="form-row">
              <label class="field-label" for="new-customer-postal">Postal code</label>
              <input id="new-customer-postal" v-model="newCustomer.postal_code" type="text" class="text-input" placeholder="Postal code" />
            </div>
          </div>
          <div class="form-row">
            <label class="field-label" for="new-customer-notes">Internal notes</label>
            <textarea id="new-customer-notes" v-model="newCustomer.notes" class="text-input textarea-input" placeholder="Notes (optional)" rows="3" />
          </div>
          <p v-if="customerError" class="modal-error">{{ customerError }}</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="closeAddCustomerModal">Cancel</button>
          <button type="button" class="btn-primary" :disabled="addingCustomer || !newCustomer.name.trim()" @click="addCustomer">Add customer</button>
        </div>
      </div>
    </div>

    <div v-if="selectedEmployee" class="modal-backdrop" @click.self="closeEmployeeDetail">
      <div class="modal modal-wide employee-detail-modal" @click.stop>
        <h3>Employee: {{ selectedEmployee.username }}</h3>
        <table class="detail-table">
          <tbody>
            <tr>
              <th scope="row">Username</th>
              <td>{{ selectedEmployee.username }}</td>
            </tr>
            <tr>
              <th scope="row">Email</th>
              <td>{{ selectedEmployee.email || '—' }}</td>
            </tr>
            <tr>
              <th scope="row">First name</th>
              <td>{{ selectedEmployee.first_name || '—' }}</td>
            </tr>
            <tr>
              <th scope="row">Last name</th>
              <td>{{ selectedEmployee.last_name || '—' }}</td>
            </tr>
            <tr>
              <th scope="row">Phone</th>
              <td>{{ (selectedEmployee as UserSummary & { phone?: string }).phone || '—' }}</td>
            </tr>
            <tr>
              <th scope="row">Active</th>
              <td><span class="badge">{{ selectedEmployee.is_active ? 'Yes' : 'No' }}</span></td>
            </tr>
            <tr>
              <th scope="row">Staff</th>
              <td><span class="badge">{{ selectedEmployee.is_staff ? 'Yes' : 'No' }}</span></td>
            </tr>
            <tr>
              <th scope="row">Groups</th>
              <td>{{ selectedEmployee.groups_display?.length ? selectedEmployee.groups_display.join(', ') : '—' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="modal-actions">
          <router-link v-if="selectedEmployee.id === meId" to="/employee-portal/profile" class="btn-primary" @click="closeEmployeeDetail">Edit my profile</router-link>
          <button type="button" class="btn-secondary" @click="openEdit(selectedEmployee)">Edit (admin)</button>
          <button type="button" class="btn-secondary" @click="closeEmployeeDetail">Close</button>
        </div>
      </div>
    </div>

    <div v-if="editingUser" class="modal-backdrop" @click.self="editingUser = null">
      <div class="modal modal-wide" @click.stop>
        <h3>Edit {{ editingUser.username }}</h3>
        <div class="modal-form">
          <div class="form-row">
            <label class="field-label" for="edit-user-email">Email</label>
            <input id="edit-user-email" v-model="editEmail" type="email" class="text-input" placeholder="Email" />
          </div>
          <div class="form-row">
            <label class="field-label" for="edit-user-first-name">First name</label>
            <input id="edit-user-first-name" v-model="editFirstName" type="text" class="text-input" placeholder="First name" />
          </div>
          <div class="form-row">
            <label class="field-label" for="edit-user-last-name">Last name</label>
            <input id="edit-user-last-name" v-model="editLastName" type="text" class="text-input" placeholder="Last name" />
          </div>
          <div class="form-row">
            <label class="field-label" for="edit-user-phone">Phone</label>
            <input id="edit-user-phone" v-model="editPhone" type="tel" class="text-input" placeholder="Phone" />
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
// TODO: consider extracting AddEmployeeModal, AddCustomerModal, EditEmployeeModal into reusable components
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { getUsersByType, getGroups, createUser, updateUser, deleteUser, getMe, getCustomers, createCustomer, updateCustomer, getCustodyRequests, cancelCustodyRequest, canSeeIntakeRequests, getIntakeRequests, updateIntakeRequest, searchUsAddresses } from '../api'
import DataTable from '../components/DataTable.vue'
import type { UserSummary, CustomerSummary, CustodyRequestSummary, IntakeRequestSummary, MeResponse } from '../api'
import type { DataTableColumn } from '../components/DataTable.vue'

const employeeColumns: DataTableColumn[] = [
  { key: 'username', label: 'Username', type: 'strong' },
  { key: 'email', label: 'Email' },
  { key: 'phone_display', label: 'Phone' },
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
    phone_display: (u as UserSummary & { phone?: string }).phone || '—',
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
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']
const newCustomer = reactive({
  name: '',
  email: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  province: '',
  country: 'United States',
  postal_code: '',
  notes: '',
})
const customerAddressSuggestions = ref<Array<{ display_name: string; address_line1: string; city: string; province: string; country: string; postal_code: string }>>([])
const customerAddressSearching = ref(false)
let customerAddressSearchTimer: ReturnType<typeof setTimeout> | null = null
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
const pickupDate = ref('')
const pickupTime = ref('')
const savingPickup = ref(false)

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

const showAddEmployeeModal = ref(false)
const showAddCustomerModal = ref(false)
const newUser = reactive({ username: '', password: '', email: '', first_name: '', last_name: '', phone: '' })
const adding = ref(false)
const addError = ref('')

const selectedEmployee = ref<UserSummary | null>(null)
const editingUser = ref<UserSummary | null>(null)
const editEmail = ref('')
const editFirstName = ref('')
const editLastName = ref('')
const editPhone = ref('')
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

watch(
  () => newCustomer.address_line1,
  (q) => {
    if (customerAddressSearchTimer) clearTimeout(customerAddressSearchTimer)
    if (!q?.trim() || q.trim().length < 3) {
      customerAddressSuggestions.value = []
      return
    }
    customerAddressSearchTimer = setTimeout(async () => {
      customerAddressSearching.value = true
      try {
        customerAddressSuggestions.value = await searchUsAddresses(q)
      } catch {
        customerAddressSuggestions.value = []
      } finally {
        customerAddressSearching.value = false
      }
    }, 250)
  }
)

function applyCustomerAddressSuggestion(item: {
  address_line1: string
  city: string
  province: string
  country: string
  postal_code: string
}) {
  newCustomer.address_line1 = item.address_line1 || newCustomer.address_line1
  newCustomer.city = item.city || newCustomer.city
  newCustomer.province = item.province || newCustomer.province
  newCustomer.country = item.country || 'United States'
  newCustomer.postal_code = item.postal_code || newCustomer.postal_code
  customerAddressSuggestions.value = []
}

watch([intakeStatusFilter, intakeSearchQuery, intakeOrdering], () => {
  loadIntakeRequests()
})

watch(selectedIntakeRequest, (r) => {
  editIntakeNotes.value = r?.internal_notes ?? ''
  if (r?.pickup_scheduled_at) {
    const d = new Date(r.pickup_scheduled_at)
    pickupDate.value = d.toISOString().slice(0, 10)
    pickupTime.value = d.toTimeString().slice(0, 5)
  } else {
    pickupDate.value = ''
    pickupTime.value = ''
  }
}, { immediate: true })

function openIntakeModal(row: Record<string, unknown>) {
  const id = row.id as string
  if (!id) return
  const full = intakeRequests.value.find((r) => r.id === id) ?? null
  selectedIntakeRequest.value = full
  editIntakeNotes.value = full?.internal_notes ?? ''
  if (full?.pickup_scheduled_at) {
    const d = new Date(full.pickup_scheduled_at)
    pickupDate.value = d.toISOString().slice(0, 10)
    pickupTime.value = d.toTimeString().slice(0, 5)
  } else {
    pickupDate.value = ''
    pickupTime.value = ''
  }
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

function logisticsLabel(r: IntakeRequestSummary): string {
  const type = r.delivery_type || 'PICKUP'
  if (type === 'DROP_OFF') {
    if (r.drop_off_preferred_start || r.drop_off_preferred_end) {
      const start = r.drop_off_preferred_start ? formatDate(r.drop_off_preferred_start) : ''
      const end = r.drop_off_preferred_end ? formatDate(r.drop_off_preferred_end) : ''
      return ['Drop-off', start && `from ${start}`, end && `to ${end}`].filter(Boolean).join(' ')
    }
    return 'Drop-off'
  }
  if (r.pickup_scheduled_at) {
    return `Pickup ${formatDate(r.pickup_scheduled_at)}`
  }
  return 'Pickup'
}

async function savePickupFromModal() {
  if (!selectedIntakeRequest.value || !pickupDate.value || !pickupTime.value) return
  intakeError.value = ''
  savingPickup.value = true
  try {
    const payload: Parameters<typeof updateIntakeRequest>[1] = {
      pickup_scheduled_at: new Date(`${pickupDate.value}T${pickupTime.value}`).toISOString(),
    }
    const updated = await updateIntakeRequest(selectedIntakeRequest.value.id, payload)
    selectedIntakeRequest.value = updated
    await loadIntakeRequests()
  } catch (e) {
    intakeError.value = e instanceof Error ? e.message : 'Failed to save pickup time.'
  } finally {
    savingPickup.value = false
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
      first_name: newUser.first_name.trim() || undefined,
      last_name: newUser.last_name.trim() || undefined,
      phone: newUser.phone.trim() || undefined,
    })
    closeAddEmployeeModal()
    await load()
  } catch (e) {
    addError.value = e instanceof Error ? e.message : 'Failed to add user.'
  } finally {
    adding.value = false
  }
}

function closeAddEmployeeModal() {
  showAddEmployeeModal.value = false
  newUser.username = ''
  newUser.password = ''
  newUser.email = ''
  newUser.first_name = ''
  newUser.last_name = ''
  newUser.phone = ''
  addError.value = ''
}

function openEmployeeDetail(row: Record<string, unknown>) {
  const id = row.id as string
  if (!id) return
  const user = employeeUsers.value.find((u) => u.id === id) ?? null
  selectedEmployee.value = user
}

function closeEmployeeDetail() {
  selectedEmployee.value = null
}

function openEdit(row: UserSummary | Record<string, unknown>) {
  const user = row as UserSummary & { phone?: string }
  editingUser.value = user
  selectedEmployee.value = null
  editEmail.value = user.email ?? ''
  editFirstName.value = user.first_name ?? ''
  editLastName.value = user.last_name ?? ''
  editPhone.value = user.phone ?? ''
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
      first_name: editFirstName.value.trim() || undefined,
      last_name: editLastName.value.trim() || undefined,
      phone: editPhone.value.trim() || undefined,
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
    await createCustomer({
      name: newCustomer.name.trim(),
      email: newCustomer.email.trim() || undefined,
      phone: newCustomer.phone.trim() || undefined,
      address_line1: newCustomer.address_line1.trim() || undefined,
      address_line2: newCustomer.address_line2.trim() || undefined,
      city: newCustomer.city.trim() || undefined,
      province: newCustomer.province.trim() || undefined,
      country: newCustomer.country.trim() || undefined,
      postal_code: newCustomer.postal_code.trim() || undefined,
      notes: newCustomer.notes.trim() || undefined,
    })
    closeAddCustomerModal()
    await loadCustomers()
  } catch (e) {
    customerError.value = e instanceof Error ? e.message : 'Failed to add customer.'
  } finally {
    addingCustomer.value = false
  }
}

function closeAddCustomerModal() {
  showAddCustomerModal.value = false
  newCustomer.name = ''
  newCustomer.email = ''
  newCustomer.phone = ''
  newCustomer.address_line1 = ''
  newCustomer.address_line2 = ''
  newCustomer.city = ''
  newCustomer.province = ''
  newCustomer.country = 'United States'
  newCustomer.postal_code = ''
  newCustomer.notes = ''
  customerAddressSuggestions.value = []
  customerError.value = ''
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
