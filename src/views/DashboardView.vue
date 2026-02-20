<template>
  <div class="dashboard">
    <section v-if="showThroughputMetrics" class="dashboard-section">
      <div class="section-head">
        <h2 class="section-title">Throughput Metrics</h2>
        <router-link v-if="!throughputLoading && !throughputError" to="/employee-portal/workflow-alerts" class="throughput-alerts-inline">
          <span class="alert-label-inline">Open Alerts:</span>
          <span class="alert-count-inline">{{ throughputData.openAlerts || 0 }}</span>
        </router-link>
      </div>
      <p class="section-desc">Assets processed and operational metrics</p>
      <div v-if="throughputLoading" class="loading-state">Loading metrics…</div>
      <div v-else-if="throughputError" class="error-state">{{ throughputError }}</div>
      <div v-else class="throughput-metrics">
        <div class="throughput-grid">
          <div class="throughput-card throughput-card-scrollable">
            <h3>Assets by Stage</h3>
            <div v-if="throughputData.assetsByStage && throughputData.assetsByStage.length > 0" class="stage-list-scrollable">
              <div v-for="stage in throughputData.assetsByStage" :key="stage.location" class="stage-item">
                <span class="stage-label">{{ formatLocation(stage.location) }}</span>
                <span class="stage-count">{{ stage.count }}</span>
              </div>
            </div>
            <p v-else class="modal-muted">No stage data available</p>
          </div>
          <div class="throughput-card throughput-card-scrollable">
            <h3>Employee Metrics</h3>
            <div v-if="throughputData.processedByEmployee && throughputData.processedByEmployee.length > 0" class="employee-list-scrollable">
              <div v-for="(emp, idx) in throughputData.processedByEmployee" :key="emp.intake_employee__username || idx" class="employee-item">
                <span class="employee-name">{{ emp.intake_employee__username || 'Unknown' }}</span>
                <span class="employee-count">{{ emp.count }} assets</span>
              </div>
            </div>
            <p v-else class="modal-muted">No employee data available</p>
          </div>
        </div>
      </div>
    </section>

    <section class="dashboard-section">
      <h2 class="section-title">Performance Summary</h2>
      <p class="section-desc">Your current performance metrics</p>
      <div v-if="myPerformanceLoading" class="loading-state">Loading…</div>
      <div v-else-if="myPerformanceError" class="error-state">{{ myPerformanceError }}</div>
      <div v-else class="performance-summary">
        <div class="performance-grid">
          <div class="performance-card">
            <p class="performance-label">Assets Intaken</p>
            <p class="performance-value">{{ myPerformance.assets_intaken }}</p>
            <p class="performance-desc">Assets you have received</p>
          </div>
          <div class="performance-card">
            <p class="performance-label">Work Orders</p>
            <p class="performance-value">{{ myPerformance.work_orders_completed }} / {{ myPerformance.work_orders_assigned }}</p>
            <p class="performance-desc">Completed / Assigned</p>
          </div>
          <div class="performance-card">
            <p class="performance-label">Sanitizations</p>
            <p class="performance-value">{{ myPerformance.sanitization_total }}</p>
            <p class="performance-desc">{{ myPerformance.sanitization_passed }} passed, {{ myPerformance.sanitization_failed }} failed</p>
          </div>
          <div class="performance-card">
            <p class="performance-label">Intake Requests</p>
            <p class="performance-value">{{ myPerformance.intake_requests_accepted }}</p>
            <p class="performance-desc">Requests you've accepted</p>
          </div>
          <div class="performance-card">
            <p class="performance-label">Shipments</p>
            <p class="performance-value">{{ myPerformance.shipments_completed }}</p>
            <p class="performance-desc">Shipments you've completed</p>
          </div>
          <div class="performance-card">
            <p class="performance-label">Intake Batches</p>
            <p class="performance-value">{{ myPerformance.intake_batches_created }}</p>
            <p class="performance-desc">Batches you've created</p>
          </div>
        </div>
      </div>
    </section>

    <section class="dashboard-section">
      <h2 class="section-title">My open work orders</h2>
      <p class="section-desc">Work orders assigned to you that are in progress.</p>
      <DataTable
        :columns="workOrdersColumns"
        :data="workOrdersPaginated"
        :loading="workOrdersLoading"
        row-key="id"
        :row-click="openWorkOrder"
      />
      <div v-if="!workOrdersLoading && workOrdersTotal > 0" class="pagination-bar">
        <span class="pagination-info">Showing {{ workOrdersStart }}–{{ workOrdersEnd }} of {{ workOrdersTotal }}</span>
        <div class="pagination-controls">
          <button type="button" class="pagination-btn" :disabled="workOrderPage <= 1" aria-label="Previous page" @click="workOrderPage = Math.max(1, workOrderPage - 1)">Previous</button>
          <span class="pagination-page">Page {{ workOrderPage }} of {{ workOrdersTotalPages }}</span>
          <button type="button" class="pagination-btn" :disabled="workOrderPage >= workOrdersTotalPages" aria-label="Next page" @click="workOrderPage = Math.min(workOrdersTotalPages, workOrderPage + 1)">Next</button>
        </div>
      </div>
      <p v-if="!workOrdersLoading && openWorkOrders.length === 0" class="modal-muted">No open work orders.</p>
    </section>

    <section v-if="showEmployees" class="dashboard-section">
      <div class="section-head">
        <h2 class="section-title">Employees</h2>
        <button type="button" class="btn-add-in-header" @click="showAddEmployeeModal = true">
          <span class="add-icon">+</span> Add employee
        </button>
      </div>
      <div class="list-toolbar">
        <div class="search-input-wrap">
          <input
            v-model="employeeSearchQuery"
            type="search"
            class="filter-input"
            placeholder="Search by name or username…"
            aria-label="Search employees"
          />
          <button
            v-if="employeeSearchQuery"
            type="button"
            class="search-clear-btn"
            aria-label="Clear search"
            @click="employeeSearchQuery = ''"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
      <DataTable
        :columns="employeeColumns"
        :data="tableDataPaginated"
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
      <div v-if="!loading && tableData.length > 0" class="pagination-bar">
        <span class="pagination-info">Showing {{ employeeStart }}–{{ employeeEnd }} of {{ tableData.length }}</span>
        <div class="pagination-controls">
          <button type="button" class="pagination-btn" :disabled="employeePage <= 1" aria-label="Previous page" @click="employeePage = Math.max(1, employeePage - 1)">Previous</button>
          <span class="pagination-page">Page {{ employeePage }} of {{ employeeTotalPages }}</span>
          <button type="button" class="pagination-btn" :disabled="employeePage >= employeeTotalPages" aria-label="Next page" @click="employeePage = Math.min(employeeTotalPages, employeePage + 1)">Next</button>
        </div>
      </div>
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
          <option value="PICKING_UP">Picking up</option>
          <option value="RECEIVED">Received</option>
          <option value="REJECTED">Rejected</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <div class="search-input-wrap">
          <input
            v-model="intakeSearchQuery"
            type="search"
            class="filter-input"
            placeholder="Search company or request ID…"
            aria-label="Search requests"
          />
          <button
            v-if="intakeSearchQuery"
            type="button"
            class="search-clear-btn"
            aria-label="Clear search"
            @click="intakeSearchQuery = ''"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <select v-model="intakeOrdering" class="filter-select" aria-label="Sort order">
          <option value="">Oldest first</option>
          <option value="-created_at">Newest first</option>
        </select>
      </div>
      <DataTable
        :columns="intakeColumns"
        :data="intakeTableDataPaginated"
        :loading="intakeLoading"
        row-key="id"
        :row-click="goToIntakeRequestDetail"
      />
      <div v-if="!intakeLoading && intakeTableData.length > 0" class="pagination-bar">
        <span class="pagination-info">Showing {{ intakeStart }}–{{ intakeEnd }} of {{ intakeTableData.length }}</span>
        <div class="pagination-controls">
          <button type="button" class="pagination-btn" :disabled="intakePage <= 1" aria-label="Previous page" @click="intakePage = Math.max(1, intakePage - 1)">Previous</button>
          <span class="pagination-page">Page {{ intakePage }} of {{ intakeTotalPages }}</span>
          <button type="button" class="pagination-btn" :disabled="intakePage >= intakeTotalPages" aria-label="Next page" @click="intakePage = Math.min(intakeTotalPages, intakePage + 1)">Next</button>
        </div>
      </div>
      <p v-if="!intakeLoading && intakeRequests.length === 0" class="modal-muted">No intake requests.</p>
    </section>

    <section v-if="showCustomers" class="dashboard-section">
      <div class="section-head">
        <h2 class="section-title">Customers</h2>
        <button type="button" class="btn-add-in-header" @click="showAddCustomerModal = true">
          <span class="add-icon">+</span> Add customer
        </button>
      </div>
      <p class="section-desc">Click a row to view details and edit internal notes.</p>
      <div class="list-toolbar">
        <div class="search-input-wrap">
          <input
            v-model="customerSearchQuery"
            type="search"
            class="filter-input"
            placeholder="Search by company name…"
            aria-label="Search customers"
          />
          <button
            v-if="customerSearchQuery"
            type="button"
            class="search-clear-btn"
            aria-label="Clear search"
            @click="customerSearchQuery = ''"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
      <DataTable
        :columns="customerColumns"
        :data="customersTableDataPaginated"
        :loading="customersLoading"
        row-key="id"
        :row-click="openCustomerDetail"
      />
      <div v-if="!customersLoading && customersTableData.length > 0" class="pagination-bar">
        <span class="pagination-info">Showing {{ customerStart }}–{{ customerEnd }} of {{ customersTableData.length }}</span>
        <div class="pagination-controls">
          <button type="button" class="pagination-btn" :disabled="customerPage <= 1" aria-label="Previous page" @click="customerPage = Math.max(1, customerPage - 1)">Previous</button>
          <span class="pagination-page">Page {{ customerPage }} of {{ customerTotalPages }}</span>
          <button type="button" class="pagination-btn" :disabled="customerPage >= customerTotalPages" aria-label="Next page" @click="customerPage = Math.min(customerTotalPages, customerPage + 1)">Next</button>
        </div>
      </div>
    </section>

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
import { useRouter } from 'vue-router'
import { createUser, updateUser, deleteUser, createCustomer, canSeeIntakeRequests, getIntakeRequests, searchUsAddresses, getWorkOrders, getKpis, getMyPerformance } from '../api'
import DataTable from '../components/DataTable.vue'
import type { UserSummary, CustomerSummary, IntakeRequestSummary, MeResponse, WorkOrderSummary } from '../api'
import type { DataTableColumn } from '../components/DataTable.vue'

const router = useRouter()

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

const workOrdersColumns: DataTableColumn[] = [
  { key: 'work_order_number', label: 'Work Order', type: 'strong' },
  { key: 'status', label: 'Status', type: 'badge' },
  { key: 'asset_count', label: 'Assets' },
  { key: 'created_at_display', label: 'Created' },
]

const intakeColumns: DataTableColumn[] = [
  { key: 'created_at_display', label: 'Created', type: 'strong' },
  { key: 'customer_name', label: 'Company' },
  { key: 'contact_display', label: 'Contact' },
  { key: 'status', label: 'Status', type: 'badge' },
]

const PAGE_SIZE = 10

const employeeUsers = ref<UserSummary[]>([])
const groups = ref<Awaited<ReturnType<typeof import('../api').getGroups>>>([])
const me = ref<MeResponse | null>(null)
const meId = computed(() => me.value?.id ?? null)
const showIntakeRequests = computed(() => canSeeIntakeRequests(me.value ?? undefined))

const showEmployees = computed(() => {
  if (!me.value) return false
  const groups = (me.value.groups_display || []).map((g) => g.toLowerCase())
  return groups.includes('manager')
})

const showThroughputMetrics = computed(() => {
  if (!me.value) return false
  const groups = (me.value.groups_display || []).map((g) => g.toLowerCase())
  return groups.includes('manager')
})

const showCustomers = computed(() => {
  if (!me.value) return false
  if (me.value.is_staff) return true
  const groups = (me.value.groups_display || []).map((g) => g.toLowerCase())
  return groups.includes('customer_relations') || groups.includes('manager')
})
const loading = ref(true)
const employeeSearchQuery = ref('')
const employeePage = ref(1)
const tableData = computed(() => {
  const q = employeeSearchQuery.value.trim().toLowerCase()
  const list = q
    ? employeeUsers.value.filter((u) => {
        const username = (u.username || '').toLowerCase()
        const email = (u.email || '').toLowerCase()
        const first = (u.first_name || '').toLowerCase()
        const last = (u.last_name || '').toLowerCase()
        const fullName = `${first} ${last}`.trim()
        return username.includes(q) || email.includes(q) || fullName.includes(q) || first.includes(q) || last.includes(q)
      })
    : employeeUsers.value
  return list.map((u) => ({
    ...u,
    phone_display: (u as UserSummary & { phone?: string }).phone || '—',
    active_display: u.is_active ? 'Yes' : 'No',
    staff_display: u.is_staff ? 'Yes' : 'No',
    groups_str: u.groups_display?.length ? u.groups_display.join(', ') : '—',
  }))
})
const employeeTotalPages = computed(() => Math.max(1, Math.ceil(tableData.value.length / PAGE_SIZE)))
const tableDataPaginated = computed(() => {
  const list = tableData.value
  if (list.length === 0) return []
  const page = Math.min(employeePage.value, employeeTotalPages.value)
  const start = (page - 1) * PAGE_SIZE
  return list.slice(start, start + PAGE_SIZE)
})
const employeeStart = computed(() => {
  const len = tableData.value.length
  if (len === 0) return 0
  const page = Math.min(employeePage.value, employeeTotalPages.value)
  return (page - 1) * PAGE_SIZE + 1
})
const employeeEnd = computed(() => Math.min(Math.min(employeePage.value, employeeTotalPages.value) * PAGE_SIZE, tableData.value.length))

const customers = ref<CustomerSummary[]>([])
const customersLoading = ref(true)
const customerSearchQuery = ref('')
const customerPage = ref(1)
const customersTableData = computed(() => {
  const q = customerSearchQuery.value.trim().toLowerCase()
  const list = q
    ? customers.value.filter((c) => {
        const name = (c.name || '').toLowerCase()
        const email = (c.email || '').toLowerCase()
        return name.includes(q) || email.includes(q)
      })
    : customers.value
  return list.map((c) => ({
    ...c,
    address_display: formatCustomerAddress(c),
    notes_short: truncateStr(c.notes || '', 40),
  }))
})
const customerTotalPages = computed(() => Math.max(1, Math.ceil(customersTableData.value.length / PAGE_SIZE)))
const customersTableDataPaginated = computed(() => {
  const list = customersTableData.value
  if (list.length === 0) return []
  const page = Math.min(customerPage.value, customerTotalPages.value)
  const start = (page - 1) * PAGE_SIZE
  return list.slice(start, start + PAGE_SIZE)
})
const customerStart = computed(() => {
  const len = customersTableData.value.length
  if (len === 0) return 0
  const page = Math.min(customerPage.value, customerTotalPages.value)
  return (page - 1) * PAGE_SIZE + 1
})
const customerEnd = computed(() => Math.min(Math.min(customerPage.value, customerTotalPages.value) * PAGE_SIZE, customersTableData.value.length))

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

const openWorkOrders = ref<WorkOrderSummary[]>([])
const workOrdersLoading = ref(true)
const workOrderPage = ref(1)

const myPerformance = ref<{
  assets_intaken: number
  work_orders_assigned: number
  work_orders_completed: number
  sanitization_total: number
  sanitization_passed: number
  sanitization_failed: number
  intake_requests_accepted: number
  shipments_completed: number
  intake_batches_created: number
}>({
  assets_intaken: 0,
  work_orders_assigned: 0,
  work_orders_completed: 0,
  sanitization_total: 0,
  sanitization_passed: 0,
  sanitization_failed: 0,
  intake_requests_accepted: 0,
  shipments_completed: 0,
  intake_batches_created: 0,
})
const myPerformanceLoading = ref(false)
const myPerformanceError = ref('')

const throughputLoading = ref(false)
const throughputError = ref('')
const throughputData = ref<{
  processedByEmployee: Array<{ intake_employee__username: string | null; count: number }>
  assetsByStage: Array<{ location: string; count: number }>
  openAlerts: number
}>({
  processedByEmployee: [],
  assetsByStage: [],
  openAlerts: 0,
})
const openWorkOrdersData = computed(() =>
  openWorkOrders.value.map((wo) => ({
    ...wo,
    created_at_display: formatDate(wo.created_at),
  }))
)
const workOrdersTotal = computed(() => openWorkOrdersData.value.length)
const workOrdersTotalPages = computed(() => Math.max(1, Math.ceil(workOrdersTotal.value / PAGE_SIZE)))
const workOrdersPaginated = computed(() => {
  const total = workOrdersTotal.value
  if (total === 0) return []
  const page = Math.min(workOrderPage.value, workOrdersTotalPages.value)
  const start = (page - 1) * PAGE_SIZE
  return openWorkOrdersData.value.slice(start, start + PAGE_SIZE)
})
const workOrdersStart = computed(() => {
  const total = workOrdersTotal.value
  if (total === 0) return 0
  const page = Math.min(workOrderPage.value, workOrdersTotalPages.value)
  return (page - 1) * PAGE_SIZE + 1
})
const workOrdersEnd = computed(() => Math.min(Math.min(workOrderPage.value, workOrdersTotalPages.value) * PAGE_SIZE, workOrdersTotal.value))

const intakeRequests = ref<IntakeRequestSummary[]>([])
const intakeLoading = ref(false)
const intakeStatusFilter = ref('')
const intakeSearchQuery = ref('')
const intakeOrdering = ref('')
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

const intakePage = ref(1)
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
const intakeTotalPages = computed(() => Math.max(1, Math.ceil(intakeTableData.value.length / PAGE_SIZE)))
const intakeTableDataPaginated = computed(() => {
  const list = intakeTableData.value
  if (list.length === 0) return []
  const page = Math.min(intakePage.value, intakeTotalPages.value)
  const start = (page - 1) * PAGE_SIZE
  return list.slice(start, start + PAGE_SIZE)
})
const intakeStart = computed(() => {
  const len = intakeTableData.value.length
  if (len === 0) return 0
  const page = Math.min(intakePage.value, intakeTotalPages.value)
  return (page - 1) * PAGE_SIZE + 1
})
const intakeEnd = computed(() => Math.min(Math.min(intakePage.value, intakeTotalPages.value) * PAGE_SIZE, intakeTableData.value.length))

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
const editGroupIds = ref<number[]>([])
const saving = ref(false)

async function load() {
  try {
    const { useAuthStore } = await import('../stores/auth')
    const { useApiCacheStore } = await import('../stores/apiCache')
    const authStore = useAuthStore()
    const cacheStore = useApiCacheStore()
    
    // Load user info first to check permissions
    me.value = await authStore.fetchUser()
    
    // Only fetch employee list if user can see employees (manager group)
    // Customer relations employees don't need to see the employee list
    if (showEmployees.value) {
      try {
        const employeeList = await cacheStore.fetchUsersByType('EMPLOYEE')
        employeeUsers.value = employeeList
      } catch (error) {
        // If employee list fetch fails, set empty array
        console.warn('Failed to load employees:', error)
        employeeUsers.value = []
      }
      
      // Also fetch groups for the edit employee modal
      try {
        const groupList = await cacheStore.fetchGroups()
        groups.value = groupList
      } catch (error) {
        // If groups fetch fails (e.g., user doesn't have permission), 
        // set empty array - edit modal will show a message
        console.warn('Failed to load groups:', error)
        groups.value = []
      }
    } else {
      // User can't see employees, so don't fetch employee list or groups
      employeeUsers.value = []
      groups.value = []
    }
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

watch(employeeSearchQuery, () => { employeePage.value = 1 })
watch(customerSearchQuery, () => { customerPage.value = 1 })
watch([intakeStatusFilter, intakeSearchQuery, intakeOrdering], () => {
  intakePage.value = 1
  loadIntakeRequests()
})

function goToIntakeRequestDetail(row: Record<string, unknown>) {
  const id = row.id as string
  if (!id) return
  router.push({ name: 'IntakeRequestDetail', params: { id } })
}

async function loadCustomers() {
  try {
    const { useApiCacheStore } = await import('../stores/apiCache')
    customers.value = await useApiCacheStore().fetchCustomers()
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
  const groupIds = groups.value.filter((g: { name: string; id: number }) => user.groups_display.includes(g.name)).map((g: { name: string; id: number }) => g.id)
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

function openCustomerDetail(row: Record<string, unknown>) {
  const id = row.id as string
  if (!id) return
  router.push(`/employee-portal/customers/${id}`)
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

async function loadOpenWorkOrders() {
  try {
    const workOrders = await getWorkOrders({ assigned_to: 'me', status: 'CREATED' })
    const inProgress = await getWorkOrders({ assigned_to: 'me', status: 'IN_PROGRESS' })
    openWorkOrders.value = [...workOrders, ...inProgress]
  } catch {
    openWorkOrders.value = []
  } finally {
    workOrdersLoading.value = false
  }
}

function openWorkOrder(row: Record<string, unknown>) {
  const id = row.id as string
  if (!id) return
  // Navigate to dedicated work order detail page
  router.push(`/employee-portal/work-orders/${id}`)
}

function formatLocation(location: string): string {
  return location.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

async function loadMyPerformance() {
  myPerformanceLoading.value = true
  myPerformanceError.value = ''
  try {
    myPerformance.value = await getMyPerformance()
  } catch (e) {
    myPerformanceError.value = e instanceof Error ? e.message : 'Failed to load performance'
  } finally {
    myPerformanceLoading.value = false
  }
}

async function loadThroughputMetrics() {
  throughputLoading.value = true
  throughputError.value = ''
  try {
    const kpiData = await getKpis('json') as {
      processed_by_employee: Array<{ intake_employee__username: string | null; count: number }>
      assets_by_stage: Array<{ location: string; count: number }>
      open_alerts: number
    }
    throughputData.value = {
      processedByEmployee: (kpiData as { data?: typeof kpiData }).data?.processed_by_employee ?? kpiData.processed_by_employee ?? [],
      assetsByStage: (kpiData as { data?: { assets_by_stage: typeof throughputData.value.assetsByStage } }).data?.assets_by_stage ?? kpiData.assets_by_stage ?? [],
      openAlerts: (kpiData as { data?: { open_alerts: number } }).data?.open_alerts ?? kpiData.open_alerts ?? 0,
    }
  } catch (e) {
    throughputError.value = e instanceof Error ? e.message : 'Failed to load throughput metrics'
  } finally {
    throughputLoading.value = false
  }
}

onMounted(async () => {
  await load()
  loadCustomers()
  loadOpenWorkOrders()
  loadMyPerformance()
  if (showThroughputMetrics.value) loadThroughputMetrics()
  if (showIntakeRequests.value) loadIntakeRequests()
})

watch(showIntakeRequests, (visible) => {
  if (visible && intakeRequests.value.length === 0 && !intakeLoading.value) loadIntakeRequests()
})
</script>
