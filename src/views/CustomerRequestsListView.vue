<template>
  <section class="customer-requests-list">
    <header class="page-header">
      <h2>Requests</h2>
      <p class="subtitle">View and open your intake requests</p>
    </header>

    <div v-if="loading" class="loading-state">Loading requests…</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>
    <div v-else-if="requests.length === 0" class="empty-state">
      No requests yet. Start by creating your first disposal request.
    </div>
    <div v-else class="request-table-wrap">
      <div class="table-head">
        <span class="col-date">Date</span>
        <span class="col-status">Status</span>
        <span class="col-items">Items</span>
        <span class="col-logistics">Logistics</span>
      </div>
      <div
        v-for="r in requests"
        :key="r.id"
        class="table-row request-row"
        @click="openRequest(r.id)"
      >
        <span class="col-date">{{ formatDate(r.created_at) }}</span>
        <span class="col-status">
          <span class="badge" :data-status="r.status">{{ prettyStatus(r.status) }}</span>
        </span>
        <span class="col-items">{{ r.asset_quantities_display || (r.asset_types_display && r.asset_types_display.join(', ')) || '—' }}</span>
        <span class="col-logistics">{{ logisticsLabel(r) }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCustomerContext, getMyIntakeRequests } from '../api'
import type { IntakeRequestSummary } from '../api'

const route = useRoute()
const router = useRouter()
const requests = ref<IntakeRequestSummary[]>([])
const loading = ref(true)
const error = ref('')
const isReadonlyPortal = computed(() => route.path.includes('/employee-portal/customers/'))

const basePath = computed(() => {
  if (isReadonlyPortal.value) {
    return `/employee-portal/customers/${String(route.params.customerId || '')}/portal`
  }
  return '/customer-portal'
})

onMounted(async () => {
  try {
    loading.value = true
    error.value = ''
    if (isReadonlyPortal.value) {
      const customerIdParam = String(route.params.customerId || '')
      if (!customerIdParam) {
        requests.value = []
        return
      }
      const context = await getCustomerContext(customerIdParam)
      requests.value = context.requests.map((r) => ({
        id: r.id,
        asset_types: [],
        asset_quantities: r.asset_quantities || {},
        asset_types_display: [],
        asset_quantities_display: Object.entries(r.asset_quantities || {}).map(([k, v]) => `${k}: ${v}`).join(', '),
        customer: context.customer.id,
        customer_name: context.customer.name,
        company_name_raw: context.customer.name,
        contact_name: '',
        contact_email: context.customer.email || '',
        contact_phone: context.customer.phone || '',
        notes: '',
        internal_notes: '',
        status: r.status,
        rejected_reason: '',
        accepted_by: null,
        accepted_at: null,
        received_at: r.received_at ?? null,
        delivery_type: (r.delivery_type as 'PICKUP' | 'DROP_OFF' | undefined) || undefined,
        pickup_scheduled_at: r.pickup_scheduled_at ?? null,
        drop_off_preferred_start: r.drop_off_preferred_start ?? null,
        drop_off_preferred_end: r.drop_off_preferred_end ?? null,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }))
    } else {
      requests.value = await getMyIntakeRequests()
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load requests'
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function prettyStatus(status: string) {
  return status.replace(/_/g, ' ')
}

function logisticsLabel(r: IntakeRequestSummary): string {
  const type = r.delivery_type || 'PICKUP'
  if (type === 'DROP_OFF') {
    if (r.drop_off_preferred_start) {
      return `Drop-off preferred: ${formatDate(r.drop_off_preferred_start)}`
    }
    return 'Drop-off'
  }
  if (r.pickup_scheduled_at) {
    return `Pickup scheduled for ${formatDate(r.pickup_scheduled_at)}`
  }
  return 'Pickup'
}

function openRequest(id: string) {
  router.push(`${basePath.value}/requests/${id}`)
}
</script>

<style scoped lang="scss">
@use '../styles/views/customer-requests-list';
</style>
