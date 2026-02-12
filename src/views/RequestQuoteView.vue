<template>
  <div class="request-quote portal-request-page">
    <header class="request-quote-header">
      <h1 class="request-quote-title">Create Disposal Request</h1>
      <p class="request-quote-desc">Submit a new request for intake, data wiping, and disposition processing.</p>
    </header>

    <form class="request-quote-form professional-form" @submit.prevent="onSubmit">
      <section class="form-section">
        <h2 class="section-title">Asset Inventory</h2>
        <p class="section-hint">Select each category and provide estimated quantity.</p>
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
        <h2 class="section-title">Primary Contact</h2>
        <p class="section-hint">Optional updates for this specific request.</p>
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
            <label class="field-label" for="contact-email">Email</label>
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
        <h2 class="section-title">Operational Notes</h2>
        <p class="section-hint">Include scheduling preferences, compliance constraints, or packaging notes.</p>
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
          {{ submitting ? 'Submitting...' : isReadonlyPortal ? 'Read-only Preview' : 'Submit Request' }}
        </button>
        <p v-if="submitError" class="error">{{ submitError }}</p>
      </div>
    </form>

    <p class="back-link">
      <router-link to="/customer-portal">Back to customer portal</router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ensureCsrfCookie, createIntakeRequest, INTAKE_REQUEST_ASSET_TYPES } from '../api'

const assetTypes = ref<string[]>([])
const assetQuantities = ref<Record<string, number>>({})
const contactName = ref('')
const contactEmail = ref('')
const contactPhone = ref('')
const notes = ref('')
const submitting = ref(false)
const submitError = ref('')
const router = useRouter()
const route = useRoute()
const isReadonlyPortal = computed(() => route.path.includes('/employee-portal/customers/') || Boolean(route.meta.customerPortalReadonly))
const errors = ref<{
  asset_types?: string
  contact_email?: string
}>({})

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
  const email = contactEmail.value.trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.value.contact_email = 'Enter a valid email address.'
  }
  return Object.keys(errors.value).length === 0
}

async function onSubmit() {
  if (isReadonlyPortal.value) return
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
      contact_name: contactName.value.trim(),
      contact_email: contactEmail.value.trim(),
      contact_phone: contactPhone.value.trim().slice(0, 64),
    }
    await createIntakeRequest(payload)
    await router.push('/customer-portal')
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
  max-width: 900px;
  margin: 0 auto;
  padding: $space-2 0;
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

.professional-form { display: grid; gap: $space-5; }
.form-section { margin-bottom: 0; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: $radius-lg; padding: $space-5; box-shadow: var(--shadow-sm); }

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
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-3;
}

.asset-type-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-background);
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
.text-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 37, 99, 235), 0.1);
}

.contact-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: $space-4;
}
@media (max-width: 900px) {
  .asset-types-grid { grid-template-columns: 1fr; }
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
  margin-top: $space-2;
  display: flex;
  align-items: center;
  gap: $space-3;
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
