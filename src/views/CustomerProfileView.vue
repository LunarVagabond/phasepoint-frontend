<template>
  <section class="profile-page">
    <header class="profile-header">
      <h2>Profile & Company</h2>
      <p>Keep your company contact details and your personal portal profile up to date.</p>
    </header>

    <article class="profile-card">
      <h3>Company Profile</h3>
      <form class="profile-form" @submit.prevent="saveCompany">
        <label for="company-email">Company Email</label>
        <input id="company-email" v-model="companyEmail" type="email" required :disabled="isReadonlyPortal || savingCompany" />
        <label for="company-phone">Company Phone</label>
        <input id="company-phone" v-model="companyPhone" type="text" required :disabled="isReadonlyPortal || savingCompany" />
        <label for="company-address1">Address</label>
        <input id="company-address1" v-model="companyAddressLine1" type="text" required :disabled="isReadonlyPortal || savingCompany" />
        <label for="company-address2">Address Line 2</label>
        <input id="company-address2" v-model="companyAddressLine2" type="text" :disabled="isReadonlyPortal || savingCompany" />
        <div class="grid">
          <div>
            <label for="company-city">City</label>
            <input id="company-city" v-model="companyCity" type="text" required :disabled="isReadonlyPortal || savingCompany" />
          </div>
          <div>
            <label for="company-state">State</label>
            <input id="company-state" v-model="companyProvince" type="text" required :disabled="isReadonlyPortal || savingCompany" />
          </div>
          <div>
            <label for="company-country">Country</label>
            <input id="company-country" v-model="companyCountry" type="text" required :disabled="isReadonlyPortal || savingCompany" />
          </div>
          <div>
            <label for="company-postal">Postal Code</label>
            <input id="company-postal" v-model="companyPostalCode" type="text" required :disabled="isReadonlyPortal || savingCompany" />
          </div>
        </div>
        <p v-if="companyError" class="error">{{ companyError }}</p>
        <button type="submit" :disabled="isReadonlyPortal || savingCompany">{{ savingCompany ? 'Saving...' : 'Save Company Profile' }}</button>
      </form>
    </article>

    <article class="profile-card">
      <h3>My User Profile</h3>
      <form class="profile-form" @submit.prevent="saveMe">
        <label for="me-username">Username</label>
        <input id="me-username" v-model="myUsername" type="text" disabled />
        <label for="me-first-name">First Name</label>
        <input id="me-first-name" v-model="myFirstName" type="text" :disabled="isReadonlyPortal || savingMe" />
        <label for="me-last-name">Last Name</label>
        <input id="me-last-name" v-model="myLastName" type="text" :disabled="isReadonlyPortal || savingMe" />
        <label for="me-email">Email</label>
        <input id="me-email" v-model="myEmail" type="email" required :disabled="isReadonlyPortal || savingMe" />
        <p v-if="meError" class="error">{{ meError }}</p>
        <button type="submit" :disabled="isReadonlyPortal || savingMe">{{ savingMe ? 'Saving...' : 'Save My Profile' }}</button>
      </form>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getCustomerMyProfile, getCustomerProfile, updateCustomerMyProfile, updateCustomerProfile } from '../api'

const route = useRoute()
const isReadonlyPortal = computed(() => route.path.includes('/employee-portal/customers/') || Boolean(route.meta.customerPortalReadonly))

const companyEmail = ref('')
const companyPhone = ref('')
const companyAddressLine1 = ref('')
const companyAddressLine2 = ref('')
const companyCity = ref('')
const companyProvince = ref('')
const companyCountry = ref('United States')
const companyPostalCode = ref('')
const companyError = ref('')
const savingCompany = ref(false)

const myUsername = ref('')
const myEmail = ref('')
const myFirstName = ref('')
const myLastName = ref('')
const meError = ref('')
const savingMe = ref(false)

async function load() {
  const [company, me] = await Promise.all([getCustomerProfile(), getCustomerMyProfile()])
  companyEmail.value = company.email || ''
  companyPhone.value = company.phone || ''
  companyAddressLine1.value = company.address_line1 || ''
  companyAddressLine2.value = company.address_line2 || ''
  companyCity.value = company.city || ''
  companyProvince.value = company.province || ''
  companyCountry.value = company.country || 'United States'
  companyPostalCode.value = company.postal_code || ''
  myUsername.value = me.username || ''
  myEmail.value = me.email || ''
  myFirstName.value = me.first_name || ''
  myLastName.value = me.last_name || ''
}

async function saveCompany() {
  if (isReadonlyPortal.value) return
  companyError.value = ''
  savingCompany.value = true
  try {
    await updateCustomerProfile({
      email: companyEmail.value.trim(),
      phone: companyPhone.value.trim(),
      address_line1: companyAddressLine1.value.trim(),
      address_line2: companyAddressLine2.value.trim(),
      city: companyCity.value.trim(),
      province: companyProvince.value.trim(),
      country: companyCountry.value.trim(),
      postal_code: companyPostalCode.value.trim(),
    })
  } catch (e) {
    companyError.value = e instanceof Error ? e.message : 'Failed to save company profile.'
  } finally {
    savingCompany.value = false
  }
}

async function saveMe() {
  if (isReadonlyPortal.value) return
  meError.value = ''
  savingMe.value = true
  try {
    await updateCustomerMyProfile({
      email: myEmail.value.trim(),
      first_name: myFirstName.value.trim(),
      last_name: myLastName.value.trim(),
    })
  } catch (e) {
    meError.value = e instanceof Error ? e.message : 'Failed to save user profile.'
  } finally {
    savingMe.value = false
  }
}

onMounted(() => {
  load().catch(() => {})
})
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;
.profile-page { display: grid; gap: $space-5; }
.profile-header h2 { margin: 0 0 $space-2; }
.profile-header p { margin: 0; color: var(--color-text-muted); }
.profile-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: $radius-lg; padding: $space-5; }
.profile-form { display: grid; gap: $space-2; }
input {
  width: 100%;
  padding: $space-2 $space-3;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
}
button {
  width: fit-content;
  margin-top: $space-2;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: $radius-md;
  padding: $space-2 $space-3;
}
.error { color: var(--color-error); margin: 0; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: $space-2; }
@media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
</style>
