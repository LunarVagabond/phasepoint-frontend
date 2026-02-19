<template>
  <section class="customer-audit-trail">
    <header class="page-header">
      <h2>Audit Trail</h2>
      <p class="subtitle">Complete history of all actions on your assets and requests</p>
    </header>

    <div class="filters-bar">
      <div class="filters-row">
        <div class="filter-group">
          <label class="filter-label">Event Type</label>
          <select v-model="filters.event_type" class="filter-select" @change="applyFilters">
            <option value="">All Events</option>
            <option v-for="(label, key) in eventTypeOptions" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Asset ID</label>
          <input
            v-model="filters.asset_id"
            type="text"
            class="filter-input"
            placeholder="Search by asset ID"
            @input="applyFilters"
          />
        </div>
        <div class="filter-group filter-group-date">
          <label class="filter-label">From Date</label>
          <input
            v-model="filters.timestamp_after"
            type="date"
            class="filter-date"
            @change="applyFilters"
          />
        </div>
        <div class="filter-group filter-group-date">
          <label class="filter-label">To Date</label>
          <input
            v-model="filters.timestamp_before"
            type="date"
            class="filter-date"
            @change="applyFilters"
          />
        </div>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="btn-clear-filters"
          @click="clearFilters"
          title="Clear all filters"
          aria-label="Clear all filters"
        >
          ↶
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">Loading audit events…</div>
    <div v-else-if="error" class="error-state">{{ error }}</div>
    <div v-else-if="auditEvents.length === 0" class="empty-state">
      <p>No audit events found.</p>
      <p v-if="hasActiveFilters" class="empty-hint">Try adjusting your filters.</p>
    </div>
    <div v-else class="audit-events-list">
      <div
        v-for="event in auditEvents"
        :key="event.id"
        class="audit-event-item"
      >
        <div class="event-header">
          <span class="event-time">{{ formatDate(event.timestamp) }}</span>
          <span class="event-type">
            <template v-if="eventDisplayParts(event)">
              <template v-for="(p, i) in eventDisplayParts(event)!" :key="p.label">
                <template v-if="i > 0">; </template>
                {{ p.label }}
                <template v-if="p.from"> updated from <span class="audit-value">{{ p.from }}</span> to <span class="audit-value">{{ p.to }}</span></template>
                <template v-else> set to <span class="audit-value">{{ p.to }}</span></template>
              </template>
            </template>
            <template v-else>{{ getAuditEventDisplayText(event) }}</template>
          </span>
          <span v-if="event.user_username" class="event-user">by {{ event.user_username }}</span>
        </div>
        <div v-if="event.asset_id" class="event-asset">
          <router-link :to="`${basePath}/assets/${event.asset_id}`" class="asset-link">
            Asset: {{ event.asset_id }}
          </router-link>
        </div>
        <div v-if="event.work_order_id" class="event-work-order">
          Work Order: {{ event.work_order_id }}
        </div>
        <div v-if="event.shipment_id" class="event-shipment">
          <router-link :to="`${basePath}/shipments/${event.shipment_id}`" class="shipment-link">
            Shipment: {{ event.shipment_id }}
          </router-link>
        </div>
      </div>
    </div>

    <div v-if="!loading && auditTotalCount > 0" class="audit-pagination">
      <span class="pagination-info">
        {{ (auditPage - 1) * AUDIT_PAGE_SIZE + 1 }}–{{ Math.min(auditPage * AUDIT_PAGE_SIZE, auditTotalCount) }} of {{ auditTotalCount }}
      </span>
      <div class="pagination-buttons">
        <button
          type="button"
          class="btn-pagination"
          :disabled="auditPage <= 1"
          @click="goToAuditPage(auditPage - 1)"
        >
          Previous
        </button>
        <button
          type="button"
          class="btn-pagination"
          :disabled="auditPage * AUDIT_PAGE_SIZE >= auditTotalCount"
          @click="goToAuditPage(auditPage + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getCustomerAuditEvents, getAuditEventDisplayText, getAuditEventDisplayParts, AUDIT_EVENT_TYPE_DISPLAY } from '../api'
import type { AuditEventSummary } from '../api'

const route = useRoute()
const AUDIT_PAGE_SIZE = 50
const auditEvents = ref<AuditEventSummary[]>([])
const auditTotalCount = ref(0)
const auditPage = ref(1)
const loading = ref(true)
const error = ref('')

const basePath = computed(() => {
  if (route.path.includes('/employee-portal/customers/')) {
    return `/employee-portal/customers/${String(route.params.customerId || '')}/portal`
  }
  return '/customer-portal'
})

function eventDisplayParts(ev: { event_type: string; old_value?: unknown; new_value?: unknown }) {
  return getAuditEventDisplayParts(ev)
}

const isEmployeePreview = computed(() => route.path.includes('/employee-portal/customers/'))
const customerId = computed(() => isEmployeePreview.value ? String(route.params.customerId || '') : null)

const filters = reactive({
  event_type: '',
  asset_id: '',
  timestamp_after: '',
  timestamp_before: '',
})

const hasActiveFilters = computed(() => {
  return !!(
    filters.event_type ||
    filters.asset_id ||
    filters.timestamp_after ||
    filters.timestamp_before
  )
})

const eventTypeOptions = computed(() => {
  return AUDIT_EVENT_TYPE_DISPLAY
})

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params: Parameters<typeof getCustomerAuditEvents>[0] = {
      page: auditPage.value,
      page_size: AUDIT_PAGE_SIZE,
    }
    if (filters.event_type) params.event_type = filters.event_type
    if (filters.asset_id) params.asset_id = filters.asset_id
    if (filters.timestamp_after) {
      const date = new Date(filters.timestamp_after)
      date.setHours(0, 0, 0, 0)
      params.timestamp_after = date.toISOString()
    }
    if (filters.timestamp_before) {
      const date = new Date(filters.timestamp_before)
      date.setHours(23, 59, 59, 999)
      params.timestamp_before = date.toISOString()
    }
    // For employee preview, pass customer_id
    if (isEmployeePreview.value && customerId.value) {
      params.customer_id = customerId.value
    }

    const res = await getCustomerAuditEvents(params)
    // Filter out CUSTOMER_DATA_ACCESS events for customers (internal system events)
    auditEvents.value = res.results.filter(ev => ev.event_type !== 'CUSTOMER_DATA_ACCESS')
    auditTotalCount.value = res.count
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load audit events'
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  loading.value = true
  auditPage.value = 1
  load()
}

function goToAuditPage(p: number) {
  if (p < 1) return
  if ((p - 1) * AUDIT_PAGE_SIZE >= auditTotalCount.value) return
  auditPage.value = p
  loading.value = true
  load()
}

function clearFilters() {
  filters.event_type = ''
  filters.asset_id = ''
  filters.timestamp_after = ''
  filters.timestamp_before = ''
  auditPage.value = 1
  applyFilters()
}

onMounted(() => {
  load()
})
</script>
