<template>
  <section class="users-page">
    <header class="users-header">
      <h2>Team Users</h2>
      <p>Manage customer portal access for your company team.</p>
    </header>
    <article class="users-card">
      <h3>Add User</h3>
      <form class="add-form" @submit.prevent="addUser">
        <input v-model="firstName" placeholder="First name (optional)" />
        <input v-model="lastName" placeholder="Last name (optional)" />
        <input v-model="username" placeholder="Username" required />
        <input v-model="password" type="password" placeholder="Password" required />
        <input v-model="email" type="email" placeholder="Email (optional)" />
        <button :disabled="adding || isReadonlyPortal" type="submit">{{ adding ? 'Adding...' : isReadonlyPortal ? 'Read-only Preview' : 'Add User' }}</button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
    </article>
    <article class="users-card">
      <h3>Current Users</h3>
      <div v-if="loading">Loading users...</div>
      <table v-else class="users-table">
        <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Status</th></tr></thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ displayName(u) }}</td>
            <td>{{ u.username }}</td>
            <td>{{ u.email || '—' }}</td>
            <td>{{ u.is_active ? 'Active' : 'Inactive' }}</td>
          </tr>
        </tbody>
      </table>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { createCustomerPortalUser, getCustomerUsers, getCustomerContext } from '../api'
import type { UserSummary } from '../api'

const users = ref<UserSummary[]>([])
const loading = ref(true)
const adding = ref(false)
const error = ref('')
const username = ref('')
const password = ref('')
const email = ref('')
const firstName = ref('')
const lastName = ref('')
const route = useRoute()
const isReadonlyPortal = computed(() => route.path.includes('/employee-portal/customers/') || Boolean(route.meta.customerPortalReadonly))

function displayName(u: UserSummary): string {
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
  return full || '—'
}

async function loadUsers() {
  loading.value = true
  error.value = ''
  try {
    if (isReadonlyPortal.value) {
      // When viewing as employee in read-only mode, get customer ID from route
      const customerId = String(route.params.customerId || '')
      if (customerId) {
        const context = await getCustomerContext(customerId)
        users.value = context.users || []
      } else {
        users.value = []
      }
    } else {
      // When logged in as customer, use the customer users endpoint
      users.value = await getCustomerUsers()
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load users'
    users.value = []
  } finally {
    loading.value = false
  }
}

async function addUser() {
  if (isReadonlyPortal.value) return
  error.value = ''
  adding.value = true
  try {
    await createCustomerPortalUser({
      username: username.value.trim(),
      password: password.value,
      email: email.value.trim() || undefined,
      first_name: firstName.value.trim() || undefined,
      last_name: lastName.value.trim() || undefined,
    })
    firstName.value = ''
    lastName.value = ''
    username.value = ''
    password.value = ''
    email.value = ''
    await loadUsers()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to add user.'
  } finally {
    adding.value = false
  }
}

onMounted(() => {
  loadUsers().catch(() => {})
})
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;
.users-page { display: grid; gap: $space-5; }
.users-header h2 { margin: 0 0 $space-2; }
.users-header p { margin: 0; color: var(--color-text-muted); }
.users-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: $radius-lg; padding: $space-5; }
.add-form { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr auto; gap: $space-2; }
input { padding: $space-2 $space-3; border: 1px solid var(--color-border); border-radius: $radius-md; }
button { background: var(--color-primary); color: #fff; border: none; border-radius: $radius-md; padding: $space-2 $space-3; }
.users-table { width: 100%; border-collapse: collapse; }
.users-table th, .users-table td { text-align: left; padding: $space-2; border-bottom: 1px solid var(--color-border); }
.error { color: var(--color-error); }
@media (max-width: 900px) { .add-form { grid-template-columns: 1fr; } }
</style>
