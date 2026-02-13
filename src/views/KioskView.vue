<template>
  <div class="kiosk-view">
    <!-- Unlock: scan badge (user UUID) -->
    <template v-if="!unlocked">
      <header class="kiosk-header">
        <h1 class="kiosk-title">Kiosk</h1>
        <p class="kiosk-name">Scan your badge to unlock</p>
      </header>
      <main class="kiosk-main">
        <form class="kiosk-scan-form" @submit.prevent="onBadgeUnlock">
          <input
            v-model="badgeInput"
            type="text"
            class="kiosk-input"
            placeholder="Badge / Employee ID"
            autocomplete="off"
            autofocus
            :disabled="unlockSubmitting"
          />
          <button type="submit" class="kiosk-submit" :disabled="unlockSubmitting || !badgeInput.trim()">
            {{ unlockSubmitting ? 'Unlocking…' : 'Unlock' }}
          </button>
        </form>
        <p v-if="unlockError" class="kiosk-scan-error">{{ unlockError }}</p>
      </main>
    </template>

    <!-- Unlocked: work order scan/load -->
    <template v-else>
      <header class="kiosk-header">
        <h1 class="kiosk-title">Kiosk mode</h1>
        <p v-if="config" class="kiosk-name">{{ config.name }} · {{ config.assigned_location }}</p>
        <p v-else-if="error" class="kiosk-error">{{ error }}</p>
        <p v-else class="kiosk-loading">Loading…</p>
        <p v-if="me" class="kiosk-logged-in">Logged in as {{ me.username }}</p>
      </header>
      <main class="kiosk-main">
        <!-- Step 1: Scan asset or enter work order number -->
        <template v-if="!currentWorkOrder">
          <p v-if="config" class="kiosk-hint">Scan an asset or enter work order number to load work order.</p>
          <form v-if="config" class="kiosk-scan-form" @submit.prevent="onScan">
            <input
              v-model="scanInput"
              type="text"
              class="kiosk-input"
              placeholder="Asset UUID/ID or Work Order number"
              autocomplete="off"
              autofocus
              :disabled="loadingWorkOrder"
            />
            <button type="submit" class="kiosk-submit" :disabled="loadingWorkOrder || !scanInput.trim()">
              {{ loadingWorkOrder ? 'Loading…' : 'Load Work Order' }}
            </button>
          </form>
          <p v-if="scanError" class="kiosk-scan-error">{{ scanError }}</p>
        </template>

        <!-- Step 2: Show work order and assets for confirmation -->
        <template v-else>
          <div class="work-order-info">
            <h2>Work Order: {{ currentWorkOrder.work_order_number }}</h2>
            <p class="work-order-status">Status: {{ currentWorkOrder.status }}</p>
            <p class="work-order-assigned">Assigned to: {{ currentWorkOrder.assigned_to_username }}</p>
            <div v-if="currentWorkOrder.assets.length > 0" class="work-order-stats">
              <p>Total assets: {{ currentWorkOrder.assets.length }}</p>
              <p v-if="currentWorkOrder.sanitization_passed_count > 0">
                Passed sanitization: {{ currentWorkOrder.sanitization_passed_count }}
              </p>
              <p v-if="currentWorkOrder.sanitization_failed_count > 0">
                Failed sanitization: {{ currentWorkOrder.sanitization_failed_count }}
              </p>
            </div>
          </div>

          <div v-if="currentWorkOrder.assets.length > 0" class="assets-confirmation">
            <h3>Select assets to confirm:</h3>
            <div class="assets-list">
              <label
                v-for="asset in currentWorkOrder.assets"
                :key="asset.id"
                class="asset-checkbox-label"
                :class="{ 'asset-checked': confirmedAssetIds.has(asset.id) }"
              >
                <input
                  type="checkbox"
                  :value="asset.id"
                  :checked="confirmedAssetIds.has(asset.id)"
                  @change="toggleAssetConfirmation(asset.id)"
                />
                <div class="asset-info">
                  <strong>{{ asset.internal_asset_id }}</strong>
                  <span class="asset-details">
                    {{ asset.manufacturer_model || '—' }} · {{ asset.status }} @ {{ asset.location }}
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div v-if="showReleaseDestination" class="kiosk-release-row">
            <label for="kiosk-release-dest">Release destination (for ship)</label>
            <select id="kiosk-release-dest" v-model="releaseDestination" class="kiosk-select">
              <option value="">— Select —</option>
              <option value="Re-sale">Re-sale</option>
              <option value="Recycler">Recycler</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div class="kiosk-actions">
            <button type="button" class="kiosk-submit kiosk-submit-secondary" @click="resetWorkOrder">
              Back / Load Another
            </button>
            <button
              type="button"
              class="kiosk-submit"
              :disabled="confirmedAssetIds.size === 0 || confirming"
              @click="confirmWorkOrderBatch"
            >
              {{ confirming ? 'Confirming…' : `Confirm ${confirmedAssetIds.size} Asset(s)` }}
            </button>
          </div>

          <p v-if="confirmError" class="kiosk-scan-error">{{ confirmError }}</p>
          <p v-if="confirmSuccess" class="kiosk-scan-success">{{ confirmSuccess }}</p>
        </template>

        <button v-if="me" type="button" class="kiosk-lock" @click="lock">Lock</button>
      </main>
    </template>

    <footer v-if="!isKioskBuild" class="kiosk-footer">
      <router-link to="/employee-portal">← Dashboard</router-link>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import {
  getKioskConfig,
  scanConfirmWorkOrder,
  confirmWorkOrder as confirmWorkOrderApi,
  kioskBadgeLogin,
  getMe,
  API_URL,
  ensureCsrfCookie,
  type KioskConfig,
  type WorkOrderDetail,
} from '../api'
import type { MeResponse } from '../api'

const IDLE_MS = 2 * 60 * 1000 // 2 minutes

const kioskId = import.meta.env.VITE_KIOSK_ID
const isKioskBuild = computed(() => !!kioskId)

const unlocked = ref(false)
const me = ref<MeResponse | null>(null)
const config = ref<KioskConfig | null>(null)
const error = ref('')

const badgeInput = ref('')
const unlockSubmitting = ref(false)
const unlockError = ref('')

const scanInput = ref('')
const loadingWorkOrder = ref(false)
const scanError = ref('')
const currentWorkOrder = ref<WorkOrderDetail | null>(null)
const confirmedAssetIds = ref<Set<string>>(new Set())
const releaseDestination = ref('')
const confirming = ref(false)
const confirmError = ref('')
const confirmSuccess = ref('')

const showReleaseDestination = computed(() => {
  if (!currentWorkOrder.value) return false
  const transitions = config.value?.allowed_transitions ?? []
  return transitions.some((code: string) => code.split('|')[3] === 'SHIPPED')
})

let idleTimer: ReturnType<typeof setTimeout> | null = null
const activityEvents = ['mousedown', 'mousemove', 'keydown', 'click', 'touchstart', 'scroll'] as const

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => lock(), IDLE_MS)
}

function clearIdleTimer() {
  if (idleTimer) {
    clearTimeout(idleTimer)
    idleTimer = null
  }
  activityEvents.forEach((ev) => window.removeEventListener(ev, resetIdleTimer))
}

watch(unlocked, (isUnlocked) => {
  clearIdleTimer()
  if (isUnlocked) {
    resetIdleTimer()
    activityEvents.forEach((ev) => window.addEventListener(ev, resetIdleTimer))
  }
})

onBeforeUnmount(clearIdleTimer)

function isUuid(s: string): boolean {
  const u =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return u.test(s.trim())
}

function isWorkOrderNumber(s: string): boolean {
  return /^WO-\d{8}-\d{3}$/i.test(s.trim())
}

async function onBadgeUnlock() {
  const raw = badgeInput.value.trim()
  if (!raw) return
  unlockError.value = ''
  unlockSubmitting.value = true
  try {
    await kioskBadgeLogin(raw)
    const data = await getMe()
    me.value = data
    unlocked.value = true
    badgeInput.value = ''
  } catch (e) {
    unlockError.value = e instanceof Error ? e.message : 'Unlock failed.'
  } finally {
    unlockSubmitting.value = false
  }
}

function lock() {
  clearIdleTimer()
  const base = (API_URL || "").replace(/\/api\/?$/, "") || "http://localhost:3332"
  const next = encodeURIComponent(window.location.origin + "/kiosk")
  window.location.href = `${base}/api/auth/logout/?next=${next}`
}

async function onScan() {
  const raw = scanInput.value.trim()
  if (!raw || !kioskId) return
  scanError.value = ''
  loadingWorkOrder.value = true
  try {
    let payload: { asset_id?: string; asset_internal_id?: string; work_order_id?: string; work_order_number?: string; kiosk_id?: string } = {
      kiosk_id: kioskId,
    }

    if (isWorkOrderNumber(raw)) {
      // Work order number format: WO-YYYYMMDD-XXX
      payload.work_order_number = raw.toUpperCase()
    } else if (isUuid(raw)) {
      // Could be asset ID or work order ID - try work order first
      payload.work_order_id = raw
    } else {
      // Assume asset internal ID
      payload.asset_internal_id = raw
    }

    const result = await scanConfirmWorkOrder(payload)
    currentWorkOrder.value = result.work_order
    confirmedAssetIds.value = new Set()
    scanInput.value = ''
  } catch (e) {
    scanError.value = e instanceof Error ? e.message : 'Failed to load work order.'
  } finally {
    loadingWorkOrder.value = false
  }
}

function toggleAssetConfirmation(assetId: string) {
  if (confirmedAssetIds.value.has(assetId)) {
    confirmedAssetIds.value.delete(assetId)
  } else {
    confirmedAssetIds.value.add(assetId)
  }
}

function resetWorkOrder() {
  currentWorkOrder.value = null
  confirmedAssetIds.value = new Set()
  releaseDestination.value = ''
  confirmError.value = ''
  confirmSuccess.value = ''
  scanInput.value = ''
}

async function confirmWorkOrderBatch() {
  if (!currentWorkOrder.value || confirmedAssetIds.value.size === 0 || !kioskId) return
  confirmError.value = ''
  confirmSuccess.value = ''
  confirming.value = true
  try {
    const result = await confirmWorkOrderApi({
      work_order_id: currentWorkOrder.value.id,
      confirmed_asset_ids: Array.from(confirmedAssetIds.value),
      kiosk_id: kioskId,
      release_destination: releaseDestination.value || undefined,
    })
    
    if (result.errors && result.errors.length > 0) {
      confirmError.value = `Some assets failed: ${result.errors.join(', ')}`
    } else {
      confirmSuccess.value = `Confirmed ${result.processed.length} asset(s). Work order status: ${result.work_order_status}.`
    }
    
    // Reload work order to get updated state
    if (currentWorkOrder.value) {
      try {
        const updated = await scanConfirmWorkOrder({
          work_order_id: currentWorkOrder.value.id,
          kiosk_id: kioskId,
        })
        currentWorkOrder.value = updated.work_order
        confirmedAssetIds.value = new Set()
        releaseDestination.value = ''
      } catch {
        // If reload fails, reset
        resetWorkOrder()
      }
    }
  } catch (e) {
    confirmError.value = e instanceof Error ? e.message : 'Failed to confirm work order.'
  } finally {
    confirming.value = false
  }
}

onMounted(async () => {
  await ensureCsrfCookie().catch(() => {})
  if (!kioskId) {
    error.value = 'No kiosk ID configured.'
    return
  }
  try {
    config.value = await getKioskConfig(kioskId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load kiosk.'
  }
  try {
    const data = await getMe()
    me.value = data
    unlocked.value = true
  } catch {
    unlocked.value = false
  }
})
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.work-order-info {
  text-align: left;
  margin-bottom: $space-6;
  padding: $space-4;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;

  h2 {
    margin: 0 0 $space-2;
    font-size: $font-size-xl;
  }

  .work-order-status,
  .work-order-assigned {
    margin: $space-1 0;
    font-size: $font-size-sm;
    color: var(--color-text-muted);
  }

  .work-order-stats {
    margin-top: $space-3;
    padding-top: $space-3;
    border-top: 1px solid var(--color-border);
    font-size: $font-size-sm;

    p {
      margin: $space-1 0;
    }
  }
}

.assets-confirmation {
  text-align: left;
  margin-bottom: $space-6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;

  h3 {
    margin: 0 0 $space-3;
    font-size: $font-size-lg;
  }
}

.assets-list {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  max-height: 400px;
  overflow-y: auto;
  padding: $space-2;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
}

.asset-checkbox-label {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  border: 2px solid transparent;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-background);
  }

  &.asset-checked {
    border-color: var(--color-primary);
    background: rgba(var(--color-primary-rgb, 37, 99, 235), 0.05);
  }

  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .asset-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $space-1;

    strong {
      font-size: $font-size-base;
    }

    .asset-details {
      font-size: $font-size-sm;
      color: var(--color-text-muted);
    }
  }
}

.kiosk-actions {
  display: flex;
  gap: $space-3;
  justify-content: center;
  margin-top: $space-6;
}

.kiosk-submit-secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);

  &:hover:not(:disabled) {
    background: var(--color-background);
    border-color: var(--color-text-muted);
  }
}
</style>