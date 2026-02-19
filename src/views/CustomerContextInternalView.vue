<template>
  <section class="context-page">
    <header>
      <h2>Customer Context</h2>
      <p>Read-only internal view for customer relations and operations.</p>
    </header>
    <article v-if="context" class="card">
      <h3>{{ context.customer.name }}</h3>
      <p>{{ context.customer.email || '—' }} · {{ context.customer.phone || '—' }}</p>
      <p>{{ context.customer.address || 'No address on file' }}</p>
    </article>
    <article v-if="context" class="card">
      <h3>Customer Users</h3>
      <ul>
        <li v-for="u in context.users" :key="u.id">{{ u.username }} ({{ u.email || 'no email' }})</li>
      </ul>
    </article>
    <article v-if="context" class="card">
      <h3>Recent Requests</h3>
      <ul>
        <li v-for="r in context.requests" :key="r.id">{{ new Date(r.created_at).toLocaleString() }} — {{ r.status }}</li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getCustomerContext } from '../api'

const route = useRoute()
const context = ref<null | Awaited<ReturnType<typeof getCustomerContext>>>(null)

onMounted(async () => {
  const customerId = String(route.params.customerId || '')
  if (!customerId) return
  context.value = await getCustomerContext(customerId)
})
</script>

<style scoped lang="scss">
@use '../styles/views/customer-context-internal';
</style>
