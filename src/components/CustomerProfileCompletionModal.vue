<template>
  <div v-if="open" class="backdrop">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="customer-profile-title">
      <h3 id="customer-profile-title">Complete Company Profile</h3>
      <p class="subtitle">Before using the customer portal, please provide required company contact details.</p>
      <form @submit.prevent="submit">
        <label for="customer-email">Company Email</label>
        <input id="customer-email" v-model="email" type="email" required />
        <label for="customer-phone">Company Phone</label>
        <input id="customer-phone" v-model="phone" type="text" required />
        <label for="customer-address1">Address</label>
        <input id="customer-address1" v-model="addressLine1" type="text" placeholder="Start typing street address..." autocomplete="off" required />
        <ul v-if="suggestions.length" class="suggestions">
          <li v-for="item in suggestions" :key="item.display_name" @mousedown.prevent="applySuggestion(item)">{{ item.display_name }}</li>
        </ul>
        <p v-else-if="searching" class="hint">Searching addresses...</p>
        <p v-else-if="suggestionError" class="hint error">{{ suggestionError }}</p>
        <label for="customer-address2">Apartment, suite, etc.</label>
        <input id="customer-address2" v-model="addressLine2" type="text" />
        <div class="address-grid">
          <div>
            <label for="customer-city">City</label>
            <input id="customer-city" v-model="city" type="text" required />
          </div>
          <div>
            <label for="customer-province">State</label>
            <select id="customer-province" v-model="province" required>
              <option value="" disabled>Select state</option>
              <option v-for="s in US_STATES" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div>
            <label for="customer-country">Country</label>
            <select id="customer-country" v-model="country" required>
              <option value="United States">United States</option>
            </select>
          </div>
          <div>
            <label for="customer-postal">Postal Code</label>
            <input id="customer-postal" v-model="postalCode" type="text" required />
          </div>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button :disabled="saving" type="submit">{{ saving ? 'Saving...' : 'Save and Continue' }}</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { searchUsAddresses } from '../api'

const props = defineProps<{
  open: boolean
  initialEmail: string
  initialPhone: string
  initialAddressLine1: string
  initialAddressLine2: string
  initialCity: string
  initialProvince: string
  initialCountry: string
  initialPostalCode: string
  saving: boolean
  error: string
}>()

const emit = defineEmits<{
  (
    e: 'submit',
    payload: {
      email: string
      phone: string
      address_line1: string
      address_line2: string
      city: string
      province: string
      country: string
      postal_code: string
    }
  ): void
}>()

const email = ref('')
const phone = ref('')
const addressLine1 = ref('')
const addressLine2 = ref('')
const city = ref('')
const province = ref('')
const country = ref('')
const postalCode = ref('')
const suggestions = ref<Array<{
  display_name: string
  address_line1: string
  city: string
  province: string
  country: string
  postal_code: string
}>>([])
const suggestionError = ref('')
const searching = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

watch(
  () => [
    props.open,
    props.initialEmail,
    props.initialPhone,
    props.initialAddressLine1,
    props.initialAddressLine2,
    props.initialCity,
    props.initialProvince,
    props.initialCountry,
    props.initialPostalCode,
  ],
  () => {
    email.value = props.initialEmail || ''
    phone.value = props.initialPhone || ''
    addressLine1.value = props.initialAddressLine1 || ''
    addressLine2.value = props.initialAddressLine2 || ''
    city.value = props.initialCity || ''
    province.value = props.initialProvince || ''
    country.value = props.initialCountry || 'United States'
    postalCode.value = props.initialPostalCode || ''
    suggestions.value = []
    suggestionError.value = ''
  },
  { immediate: true },
)

watch(addressLine1, (q) => {
  suggestionError.value = ''
  if (searchTimer) clearTimeout(searchTimer)
  if (!q.trim() || q.trim().length < 3) {
    suggestions.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      suggestions.value = await searchUsAddresses(q)
    } catch {
      suggestionError.value = 'Address lookup is temporarily unavailable.'
      suggestions.value = []
    } finally {
      searching.value = false
    }
  }, 250)
})

function applySuggestion(item: {
  address_line1: string
  city: string
  province: string
  country: string
  postal_code: string
}) {
  addressLine1.value = item.address_line1 || addressLine1.value
  city.value = item.city || city.value
  province.value = item.province || province.value
  country.value = item.country || 'United States'
  postalCode.value = item.postal_code || postalCode.value
  suggestions.value = []
}

function submit() {
  emit('submit', {
    email: email.value.trim(),
    phone: phone.value.trim(),
    address_line1: addressLine1.value.trim(),
    address_line2: addressLine2.value.trim(),
    city: city.value.trim(),
    province: province.value.trim(),
    country: country.value.trim(),
    postal_code: postalCode.value.trim(),
  })
}
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: $space-4;
}

.modal {
  width: min(560px, 100%);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  box-shadow: var(--shadow-lg);
  padding: $space-6;
}

h3 { margin: 0 0 $space-2; }
.subtitle { margin: 0 0 $space-4; color: var(--color-text-muted); }
form { display: grid; gap: $space-2; }
input, textarea, select {
  width: 100%;
  padding: $space-3 $space-4;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
}
button {
  margin-top: $space-2;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: $radius-md;
  padding: $space-3 $space-4;
  font-weight: 600;
}
.error { color: var(--color-error); margin: 0; }
.hint { margin: 0; color: var(--color-text-muted); font-size: $font-size-sm; }
.suggestions {
  margin: 0;
  padding: $space-1;
  list-style: none;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  max-height: 180px;
  overflow: auto;
}
.suggestions li {
  padding: $space-2 $space-3;
  cursor: pointer;
  border-radius: $radius-sm;
}
.suggestions li:hover {
  background: var(--color-border);
}
.address-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-2;
}
@media (max-width: 700px) {
  .address-grid { grid-template-columns: 1fr; }
}
</style>
