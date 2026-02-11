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
      <h2 class="section-title">Customers</h2>
      <DataTable
        :columns="customerColumns"
        :data="customers"
        :loading="customersLoading"
        row-key="id"
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

    <div v-if="editingUser" class="modal-backdrop" @click.self="editingUser = null">
      <div class="modal" @click.stop>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { getUsers, getGroups, createUser, updateUser, deleteUser, getMe, getCustomers, createCustomer, getCustodyRequests, cancelCustodyRequest } from '../api'
import DataTable from '../components/DataTable.vue'
import type { UserSummary, CustomerSummary, CustodyRequestSummary } from '../api'
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
  { key: 'name', label: 'Name', type: 'strong' },
]

const openRequestsColumns: DataTableColumn[] = [
  { key: 'asset_internal_id', label: 'Asset', type: 'strong' },
  { key: 'from_location', label: 'From' },
  { key: 'to_location', label: 'To' },
  { key: 'request_timestamp_display', label: 'Requested' },
]

const users = ref<UserSummary[]>([])
const groups = ref<Awaited<ReturnType<typeof getGroups>>>([])
const meId = ref<string | null>(null)
const loading = ref(true)
const tableData = computed(() =>
  users.value.map((u) => ({
    ...u,
    active_display: u.is_active ? 'Yes' : 'No',
    staff_display: u.is_staff ? 'Yes' : 'No',
    groups_str: u.groups_display.length ? u.groups_display.join(', ') : '—',
  }))
)

const customers = ref<CustomerSummary[]>([])
const customersLoading = ref(true)
const newCustomer = reactive({ name: '' })
const addingCustomer = ref(false)
const customerError = ref('')

const openRequests = ref<CustodyRequestSummary[]>([])
const openRequestsLoading = ref(true)
const openRequestsData = computed(() =>
  openRequests.value.map((r) => ({
    ...r,
    request_timestamp_display: formatDate(r.request_timestamp),
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
    const [userList, groupList, me] = await Promise.all([getUsers(), getGroups(), getMe()])
    users.value = userList
    groups.value = groupList
    meId.value = me.id
  } finally {
    loading.value = false
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

async function removeUser(row: UserSummary | Record<string, unknown>) {
  const user = row as UserSummary
  if (user.id === meId.value) return
  if (!confirm(`Remove ${user.username}? They will no longer be able to log in.`)) return
  try {
    await deleteUser(user.id)
    await load()
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Failed to remove user.')
  }
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

async function cancelRequest(row: CustodyRequestSummary | Record<string, unknown>) {
  const request = row as CustodyRequestSummary
  if (!confirm(`Cancel move request for asset ${request.asset_internal_id || request.asset}?`)) return
  try {
    await cancelCustodyRequest(request.id)
    await loadOpenRequests()
  } catch (e) {
    alert(e instanceof Error ? e.message : 'Failed to cancel request.')
  }
}

onMounted(() => {
  load()
  loadCustomers()
  loadOpenRequests()
})
</script>

