<template>
  <div class="request-quote">
    <header class="request-quote-header">
      <h1 class="request-quote-title">Request a quote</h1>
      <p class="request-quote-desc">
        Submit your ITAD request and contact details. We'll respond shortly.
      </p>
    </header>

    <form class="request-quote-form" @submit.prevent="onSubmit">
      <section class="form-section">
        <h2 class="section-title">Asset types</h2>
        <p class="section-hint">Select each type and enter the number of items.</p>
        <div class="asset-types-grid">
          <div v-for="opt in INTAKE_REQUEST_ASSET_TYPES" :key="opt.value" class="asset-type-row">
            <label class="checkbox-label">
              <input v-model="assetTypes" type="checkbox" :value="opt.value" />
              {{ opt.label }}
            </label>
            <div v-if="assetTypes.includes(opt.value)" class="quantity-wrap">
              <label :for="`qty-${opt.value}`" class="sr-only">Quantity for {{ opt.label }}</label>
              <input
                :id="`qty-${opt.value}`"
                v-model.number="assetQuantities[opt.value]"
                type="number"
                min="1"
                max="99999"
                class="quantity-input"
                placeholder="Qty"
              />
            </div>
          </div>
        </div>
        <p v-if="errors.asset_types" class="error-inline">{{ errors.asset_types }}</p>
      </section>

      <section class="form-section">
        <h2 class="section-title">Company</h2>
        <div class="customer-type">
          <label class="radio-label">
            <input v-model="customerMode" type="radio" value="existing" />
            Existing customer
          </label>
          <label class="radio-label">
            <input v-model="customerMode" type="radio" value="new" />
            New customer
          </label>
        </div>

        <div v-if="customerMode === 'existing'" class="customer-existing">
          <label class="field-label">Search by company name</label>
          <input
            v-model="customerSearchQuery"
            type="text"
            class="search-input"
            placeholder="Type to search…"
            autocomplete="off"
            @focus="showDropdown = true"
            @blur="onSearchBlur"
          />
          <ul v-if="showDropdown && (customerSearchQuery.length > 0 || customerSearchResults.length)" class="dropdown" role="listbox">
            <li
              v-for="c in customerSearchResults"
              :key="c.id"
              class="dropdown-item"
              role="option"
              :aria-selected="selectedCustomer?.id === c.id"
              @mousedown.prevent="selectCustomer(c)"
            >
              {{ c.name }}
            </li>
            <li v-if="customerSearchQuery && customerSearchResults.length === 0 && !searching" class="dropdown-item muted">
              No matches. Use "New customer" and enter the company name below.
            </li>
          </ul>
          <p v-if="selectedCustomer" class="selected-name">Selected: <strong>{{ selectedCustomer.name }}</strong></p>
        </div>
        <div v-else class="customer-new">
          <label class="field-label">Company name</label>
          <input
            v-model="companyName"
            type="text"
            class="text-input"
            placeholder="Your company or organization name"
            maxlength="255"
          />
        </div>
        <p v-if="errors.company" class="error-inline">{{ errors.company }}</p>
      </section>

      <section v-if="customerMode === 'new'" class="form-section">
        <h2 class="section-title">Contact information</h2>
        <p class="section-hint">We'll use this to follow up on your request.</p>
        <div class="contact-fields">
          <div class="field-group">
            <label class="field-label" for="contact-name">Contact name</label>
            <input
              id="contact-name"
              v-model="contactName"
              type="text"
              class="text-input"
              placeholder="Full name"
              maxlength="255"
            />
          </div>
          <div class="field-group">
            <label class="field-label" for="contact-email">Email <span class="required">*</span></label>
            <input
              id="contact-email"
              v-model="contactEmail"
              type="email"
              class="text-input"
              placeholder="email@company.com"
              maxlength="254"
            />
            <p v-if="errors.contact_email" class="error-inline">{{ errors.contact_email }}</p>
          </div>
          <div class="field-group">
            <label class="field-label" for="contact-phone">Phone</label>
            <input
              id="contact-phone"
              v-model="contactPhone"
              type="tel"
              class="text-input"
              placeholder="Optional"
              maxlength="64"
            />
          </div>
        </div>
      </section>

      <section class="form-section">
        <h2 class="section-title">Additional notes</h2>
        <p class="section-hint">Optional. Tell us about volume, timeline, or special requirements.</p>
        <label class="field-label" for="notes">Notes</label>
        <textarea
          id="notes"
          v-model="notes"
          class="textarea-input"
          placeholder="e.g. approximate quantity, preferred pickup window, compliance requirements…"
          rows="4"
          maxlength="2000"
        />
        <p class="char-hint">{{ notes.length }} / 2000</p>
      </section>

      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="submitting">
          {{ submitting ? 'Submitting…' : 'Submit request' }}
        </button>
        <p v-if="submitError" class="error">{{ submitError }}</p>
      </div>
    </form>

    <p class="back-link">
      <router-link to="/employee-portal">Employee portal</router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ensureCsrfCookie, createIntakeRequest, intakeRequestCustomerSearch, INTAKE_REQUEST_ASSET_TYPES } from '../api'
import type { IntakeRequestCustomerSearchHit } from '../api'

const assetTypes = ref<string[]>([])
const assetQuantities = ref<Record<string, number>>({})
const customerMode = ref<'existing' | 'new'>('new')
const customerSearchQuery = ref('')
const customerSearchResults = ref<IntakeRequestCustomerSearchHit[]>([])
const selectedCustomer = ref<IntakeRequestCustomerSearchHit | null>(null)
const showDropdown = ref(false)
const searching = ref(false)
const companyName = ref('')
const contactName = ref('')
const contactEmail = ref('')
const contactPhone = ref('')
const notes = ref('')
const submitting = ref(false)
const submitError = ref('')
const router = useRouter()
const errors = ref<{
  asset_types?: string
  company?: string
  contact_email?: string
}>({})

let searchTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  ensureCsrfCookie().catch(() => {})
})

watch(assetTypes, (selected) => {
  const qty = assetQuantities.value
  for (const t of selected) {
    if (typeof qty[t] !== 'number' || qty[t] < 1) {
      qty[t] = 1
    }
  }
}, { deep: true })

watch(customerSearchQuery, (q) => {
  if (searchTimer) clearTimeout(searchTimer)
  selectedCustomer.value = null
  if (!q.trim()) {
    customerSearchResults.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      customerSearchResults.value = await intakeRequestCustomerSearch(q.trim())
    } catch {
      customerSearchResults.value = []
    } finally {
      searching.value = false
    }
  }, 300)
})

function selectCustomer(c: IntakeRequestCustomerSearchHit) {
  selectedCustomer.value = c
  customerSearchQuery.value = c.name
  showDropdown.value = false
}

function onSearchBlur() {
  setTimeout(() => { showDropdown.value = false }, 150)
}

function validate(): boolean {
  errors.value = {}
  const selected = assetTypes.value
  if (selected.length === 0) {
    errors.value.asset_types = 'Select at least one asset type and enter a quantity.'
  } else {
    const bad = selected.some((t) => (assetQuantities.value[t] ?? 0) < 1)
    if (bad) {
      errors.value.asset_types = 'Each selected asset type must have a quantity of at least 1.'
    }
  }
  if (customerMode.value === 'existing') {
    if (!selectedCustomer.value) {
      errors.value.company = 'Select a company from the list or switch to New customer.'
    }
  } else {
    if (!companyName.value.trim()) {
      errors.value.company = 'Enter your company name.'
    }
    const email = contactEmail.value.trim()
    if (!email) {
      errors.value.contact_email = 'Email is required for new customers.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.value.contact_email = 'Enter a valid email address.'
    }
  }
  return Object.keys(errors.value).length === 0
}

async function onSubmit() {
  submitError.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    await ensureCsrfCookie()
    const selected = assetTypes.value
    const quantities: Record<string, number> = {}
    for (const t of selected) {
      const q = assetQuantities.value[t]
      quantities[t] = typeof q === 'number' && q >= 1 ? q : 1
    }
    const payload: Parameters<typeof createIntakeRequest>[0] = {
      asset_types: selected,
      asset_quantities: quantities,
      notes: notes.value.trim().slice(0, 2000),
    }
    if (customerMode.value === 'existing' && selectedCustomer.value) {
      payload.customer_id = selectedCustomer.value.id
    } else {
      payload.company_name = companyName.value.trim()
      payload.contact_name = contactName.value.trim()
      payload.contact_email = contactEmail.value.trim()
      payload.contact_phone = contactPhone.value.trim().slice(0, 64)
    }
    await createIntakeRequest(payload)
    await router.push({ path: '/', query: { submitted: '1' } })
  } catch (e) {
    submitError.value = e instanceof Error ? e.message : 'Submission failed.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.request-quote {
  max-width: 640px;
  margin: 0 auto;
  padding: $space-8 $space-4;
}

.request-quote-header {
  margin-bottom: $space-8;
}

.request-quote-title {
  font-size: $font-size-2xl;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 $space-2;
}

.request-quote-desc {
  font-size: $font-size-base;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

.form-section {
  margin-bottom: $space-8;
}

.section-title {
  font-size: $font-size-lg;
  font-weight: 600;
  margin: 0 0 $space-2;
  color: var(--color-text);
}

.section-hint {
  font-size: $font-size-sm;
  color: var(--color-text-muted);
  margin: 0 0 $space-3;
}

.field-label {
  display: block;
  font-size: $font-size-sm;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: $space-1;
}
.required {
  color: var(--color-error);
}

.asset-types-grid {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.asset-type-row {
  display: flex;
  align-items: center;
  gap: $space-4;
  flex-wrap: wrap;
}

.quantity-wrap {
  flex-shrink: 0;
}

.quantity-input {
  width: 5rem;
  padding: $space-2 $space-3;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: $font-size-base;
  text-align: right;
}
.quantity-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: $space-2;
  cursor: pointer;
  font-size: $font-size-base;
  color: var(--color-text);
}

.radio-label {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  margin-right: $space-6;
  cursor: pointer;
}

.customer-existing {
  position: relative;
  max-width: 400px;
}

.search-input,
.text-input {
  width: 100%;
  padding: $space-3 $space-4;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: $font-size-base;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-input:focus,
.text-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 37, 99, 235), 0.1);
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 220px;
  overflow-y: auto;
  margin: 0;
  padding: $space-1;
  list-style: none;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  box-shadow: var(--shadow-lg);
  z-index: 10;
}

.dropdown-item {
  padding: $space-2 $space-3;
  cursor: pointer;
  border-radius: $radius-sm;
}
.dropdown-item:hover {
  background: var(--color-border);
}
.dropdown-item.muted {
  color: var(--color-text-muted);
  cursor: default;
}

.selected-name {
  margin: $space-2 0 0;
  font-size: $font-size-sm;
  color: var(--color-text-muted);
}

.customer-new .text-input {
  max-width: 400px;
}

.contact-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-4;
}
@media (max-width: 520px) {
  .contact-fields {
    grid-template-columns: 1fr;
  }
}

.field-group {
  min-width: 0;
}

.textarea-input {
  width: 100%;
  padding: $space-3 $space-4;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: $font-size-base;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.textarea-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 37, 99, 235), 0.1);
}

.char-hint {
  font-size: $font-size-sm;
  color: var(--color-text-muted);
  margin: $space-1 0 0;
}

.error-inline,
.error {
  color: var(--color-error);
  font-size: $font-size-sm;
  margin: $space-2 0 0;
}

.form-actions {
  margin-top: $space-8;
}

.btn-primary {
  padding: $space-3 $space-8;
  font-size: $font-size-base;
  font-weight: 600;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: $radius-md;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}
.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.back-link {
  margin-top: $space-8;
}
</style>
