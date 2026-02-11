<template>
  <div class="kiosk-view">
    <!-- Unlock: scan badge (user UUID or employee_id) -->
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
            placeholder="Badge / user UUID or employee ID"
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

    <!-- Unlocked: asset scan + "Logged in as" -->
    <template v-else>
      <header class="kiosk-header">
        <h1 class="kiosk-title">Kiosk mode</h1>
        <p v-if="config" class="kiosk-name">{{ config.name }} · {{ config.assigned_location }}</p>
        <p v-else-if="error" class="kiosk-error">{{ error }}</p>
        <p v-else class="kiosk-loading">Loading…</p>
        <p v-if="me" class="kiosk-logged-in">Logged in as {{ me.username }}</p>
      </header>
      <main class="kiosk-main">
        <p v-if="config" class="kiosk-hint">Scan or enter asset UUID / internal asset ID to confirm a custody move.</p>
        <form v-if="config" class="kiosk-scan-form" @submit.prevent="onScan">
          <input
            v-model="assetInput"
            type="text"
            class="kiosk-input"
            placeholder="Asset UUID or internal ID"
            autocomplete="off"
            autofocus
            :disabled="submitting"
          />
          <button type="submit" class="kiosk-submit" :disabled="submitting || !assetInput.trim()">
            {{ submitting ? 'Confirming…' : 'Confirm' }}
          </button>
        </form>
        <p v-if="scanError" class="kiosk-scan-error">{{ scanError }}</p>
        <p v-if="scanSuccess" class="kiosk-scan-success">{{ scanSuccess }}</p>
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
import { getKioskConfig, scanConfirm, kioskBadgeLogin, getMe, API_URL, ensureCsrfCookie, type KioskConfig } from '../api'
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

const assetInput = ref('')
const submitting = ref(false)
const scanError = ref('')
const scanSuccess = ref('')

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
  // API base port must match backend API_PORT in .env (default: 3332)
  const base = (API_URL || "").replace(/\/api\/?$/, "") || "http://localhost:3332"
  const next = encodeURIComponent(window.location.origin + "/kiosk")
  window.location.href = `${base}/api/auth/logout/?next=${next}`
}

async function onScan() {
  const raw = assetInput.value.trim()
  if (!raw || !kioskId) return
  scanError.value = ''
  scanSuccess.value = ''
  submitting.value = true
  try {
    const payload: { asset_id?: string; asset_internal_id?: string; kiosk_id?: string } = {
      kiosk_id: kioskId,
    }
    if (isUuid(raw)) {
      payload.asset_id = raw
    } else {
      payload.asset_internal_id = raw
    }
    const result = await scanConfirm(payload)
    scanSuccess.value = `Confirmed: asset moved to ${result.new_status} @ ${result.new_location}.`
    assetInput.value = ''
  } catch (e) {
    scanError.value = e instanceof Error ? e.message : 'Confirm failed.'
  } finally {
    submitting.value = false
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

