<template>
  <div class="customer-detail">
    <div v-if="loading" class="loading">Loading…</div>
    <div v-else-if="customer" class="customer-detail-content">
      <header class="customer-header">
        <h1>{{ customer.name }}</h1>
        <div class="header-actions">
          <router-link
            v-if="canViewCustomerContext"
            class="btn-secondary"
            :to="`/employee-portal/customers/${customer.id}/portal`"
          >
            Open Portal
          </router-link>
          <button
            v-if="canEditCustomer"
            type="button"
            class="btn-secondary"
            @click="toggleEditMode"
          >
            {{ isEditMode ? 'Cancel' : 'Edit' }}
          </button>
        </div>
      </header>

      <section class="customer-info-section">
        <h2>Customer Information</h2>
        <table class="detail-table">
          <tbody>
            <tr>
              <th scope="row">Email</th>
              <td>
                <div v-if="isEditMode" class="form-row">
                  <input
                    v-model="editEmail"
                    type="email"
                    class="text-input"
                    placeholder="Email"
                  />
                </div>
                <span v-else>{{ customer.email || '—' }}</span>
              </td>
            </tr>
            <tr>
              <th scope="row">Phone</th>
              <td>
                <div v-if="isEditMode" class="form-row">
                  <input
                    v-model="editPhone"
                    type="tel"
                    class="text-input"
                    placeholder="Phone"
                  />
                </div>
                <span v-else>{{ customer.phone || '—' }}</span>
              </td>
            </tr>
            <tr>
              <th scope="row">Address</th>
              <td>
                <div v-if="isEditMode" class="address-edit">
                  <div class="form-row">
                    <input
                      v-model="editAddressLine1"
                      type="text"
                      class="text-input"
                      placeholder="Address line 1"
                    />
                  </div>
                  <div class="form-row">
                    <input
                      v-model="editAddressLine2"
                      type="text"
                      class="text-input"
                      placeholder="Address line 2"
                    />
                  </div>
                  <div class="address-grid">
                    <div class="form-row">
                      <input
                        v-model="editCity"
                        type="text"
                        class="text-input"
                        placeholder="City"
                      />
                    </div>
                    <div class="form-row">
                      <input
                        v-model="editProvince"
                        type="text"
                        class="text-input"
                        placeholder="State"
                      />
                    </div>
                    <div class="form-row">
                      <input
                        v-model="editCountry"
                        type="text"
                        class="text-input"
                        placeholder="Country"
                      />
                    </div>
                    <div class="form-row">
                      <input
                        v-model="editPostalCode"
                        type="text"
                        class="text-input"
                        placeholder="Postal code"
                      />
                    </div>
                  </div>
                </div>
                <span v-else class="detail-notes">{{ formatCustomerAddress(customer) }}</span>
              </td>
            </tr>
            <tr v-if="isEditMode || customer.representative_username">
              <th scope="row">Representative</th>
              <td>
                <div v-if="isEditMode" class="form-row">
                  <select
                    v-model="editRepresentativeId"
                    class="text-input"
                  >
                    <option :value="null">— None —</option>
                    <option
                      v-for="user in customerUsers"
                      :key="user.id"
                      :value="user.id"
                    >
                      {{ formatUserName(user) }}
                    </option>
                  </select>
                </div>
                <span v-else>
                  {{ formatRepresentativeDisplay(customer) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="isEditMode" class="edit-actions">
          <button
            type="button"
            class="btn-primary"
            :disabled="savingCustomerInfo"
            @click.stop="saveCustomerInfo"
          >
            {{ savingCustomerInfo ? 'Saving…' : 'Save changes' }}
          </button>
        </div>
        <p v-if="customerSaveError" class="modal-error">{{ customerSaveError }}</p>
      </section>

      <section class="customer-notes-section">
        <h2>Internal Notes</h2>
        <div class="form-row">
          <textarea
            id="customer-notes"
            v-model="editCustomerNotes"
            class="text-input textarea-input"
            placeholder="Internal notes…"
            rows="4"
            @blur="saveCustomerNotes"
          />
        </div>
        <div class="notes-status">
          <p v-if="savingCustomerNotes" class="save-hint">Saving…</p>
          <p v-else-if="notesSaveError" class="modal-error">{{ notesSaveError }}</p>
        </div>
      </section>

      <section class="customer-users-section">
        <h2>Customer Users</h2>
        <DataTable
          :columns="customerUserColumns"
          :data="customerUsersTableData"
          :loading="usersLoading"
          row-key="id"
        >
          <template #cell-username_display="{ row }">
            <strong class="username-with-icon">
              <svg
                v-if="row.is_representative"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="poc-icon"
                title="Point of Contact"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              {{ row.username_display }}
            </strong>
          </template>
        </DataTable>
        <p v-if="!usersLoading && customerUsers.length === 0" class="modal-muted">No users found.</p>
      </section>
    </div>
    <div v-else class="error">Customer not found.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getCustomerContext, getCustomers, updateCustomer, getMe } from '../api'
import DataTable from '../components/DataTable.vue'
import { useNotifications } from '../composables/useNotifications'
import type { CustomerSummary, UserSummary, MeResponse } from '../api'
import type { DataTableColumn } from '../components/DataTable.vue'

const route = useRoute()
const customerId = computed(() => String(route.params.customerId || ''))
const { success: showSuccess } = useNotifications()

const loading = ref(true)
const customer = ref<CustomerSummary | null>(null)
const customerUsers = ref<UserSummary[]>([])
const usersLoading = ref(true)
const me = ref<MeResponse | null>(null)

const isEditMode = ref(false)
const editEmail = ref('')
const editPhone = ref('')
const editAddressLine1 = ref('')
const editAddressLine2 = ref('')
const editCity = ref('')
const editProvince = ref('')
const editCountry = ref('')
const editPostalCode = ref('')
const editRepresentativeId = ref<string | null>(null)
const editCustomerNotes = ref('')
const savingCustomerInfo = ref(false)
const savingCustomerNotes = ref(false)
const customerSaveError = ref('')
const notesSaveError = ref('')

const canViewCustomerContext = computed(() => {
  if (!me.value) return false
  if (me.value.is_staff) return true
  const groups = (me.value.groups_display || []).map((g) => g.toLowerCase())
  return groups.includes('customer_relations')
})

const canEditCustomer = computed(() => {
  if (!me.value) return false
  if (me.value.is_staff) return true
  const groups = (me.value.groups_display || []).map((g) => g.toLowerCase())
  return groups.includes('customer_relations') || groups.includes('manager')
})

const customerUserColumns: DataTableColumn[] = [
  { key: 'username_display', label: 'Username', type: 'strong' },
  { key: 'email', label: 'Email' },
  { key: 'first_name', label: 'First name' },
  { key: 'last_name', label: 'Last name' },
]

const customerUsersTableData = computed(() =>
  customerUsers.value.map((u) => ({
    ...u,
    active_display: u.is_active ? 'Yes' : 'No',
    username_display: u.username,
    is_representative: customer.value?.representative_id === u.id,
  }))
)

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

function formatUserName(user: UserSummary): string {
  const firstName = (user.first_name || '').trim()
  const lastName = (user.last_name || '').trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  if (fullName) {
    return `${fullName} (${user.username})`
  }
  return user.username
}

function formatRepresentativeDisplay(customer: CustomerSummary): string {
  if (!customer.representative_username) return '—'
  const firstName = (customer.representative_first_name || '').trim()
  const lastName = (customer.representative_last_name || '').trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  if (fullName) {
    return `${fullName} (${customer.representative_username})`
  }
  return customer.representative_username
}

function resetEditFields() {
  if (!customer.value) return
  editEmail.value = customer.value.email || ''
  editPhone.value = customer.value.phone || ''
  editAddressLine1.value = customer.value.address_line1 || ''
  editAddressLine2.value = customer.value.address_line2 || ''
  editCity.value = customer.value.city || ''
  editProvince.value = customer.value.province || ''
  editCountry.value = customer.value.country || ''
  editPostalCode.value = customer.value.postal_code || ''
  editRepresentativeId.value = customer.value.representative_id || null
  editCustomerNotes.value = customer.value.notes || ''
}

function toggleEditMode() {
  if (isEditMode.value) {
    // Cancel - reset fields
    resetEditFields()
    customerSaveError.value = ''
    notesSaveError.value = ''
  } else {
    // Enter edit mode - populate fields
    resetEditFields()
  }
  isEditMode.value = !isEditMode.value
}

async function loadCustomer() {
  if (!customerId.value) return
  try {
    loading.value = true
    usersLoading.value = true
    customerSaveError.value = ''
    const [customersList, context, meRes] = await Promise.all([
      getCustomers(),
      getCustomerContext(customerId.value),
      getMe(),
    ])
    customer.value = customersList.find((c) => c.id === customerId.value) || null
    customerUsers.value = context.users || []
    me.value = meRes
    if (customer.value) {
      resetEditFields()
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Failed to load customer'
    customerSaveError.value = errorMessage
    customerUsers.value = []
  } finally {
    loading.value = false
    usersLoading.value = false
  }
}

async function saveCustomerInfo() {
  if (!customer.value) return
  customerSaveError.value = ''
  savingCustomerInfo.value = true
  try {
    const updateData: Parameters<typeof updateCustomer>[1] = {
      email: editEmail.value.trim() || undefined,
      phone: editPhone.value.trim() || undefined,
      address_line1: editAddressLine1.value.trim() || undefined,
      address_line2: editAddressLine2.value.trim() || undefined,
      city: editCity.value.trim() || undefined,
      province: editProvince.value.trim() || undefined,
      country: editCountry.value.trim() || undefined,
      postal_code: editPostalCode.value.trim() || undefined,
    }
    // Always include representative field (null to clear, UUID string to set)
    updateData.representative = editRepresentativeId.value
    const updated = await updateCustomer(customer.value.id, updateData)
    customer.value = updated
    isEditMode.value = false
    await loadCustomer()
  } catch (e) {
    customerSaveError.value = e instanceof Error ? e.message : 'Failed to save customer information.'
  } finally {
    savingCustomerInfo.value = false
  }
}

async function saveCustomerNotes() {
  if (!customer.value) return
  // Only save if notes have actually changed
  const currentNotes = customer.value.notes || ''
  const newNotes = editCustomerNotes.value.trim()
  if (currentNotes === newNotes) return
  
  notesSaveError.value = ''
  savingCustomerNotes.value = true
  try {
    const updated = await updateCustomer(customer.value.id, { notes: editCustomerNotes.value })
    customer.value = updated
    showSuccess('Internal notes saved successfully')
  } catch (e) {
    notesSaveError.value = e instanceof Error ? e.message : 'Failed to save notes.'
  } finally {
    savingCustomerNotes.value = false
  }
}

onMounted(() => {
  loadCustomer()
})
</script>

<style scoped lang="scss">
@use '../styles/views/customer-detail';
</style>
