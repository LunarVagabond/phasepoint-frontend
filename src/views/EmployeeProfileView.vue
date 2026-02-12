<template>
  <section class="employee-profile-page">
    <header class="profile-header">
      <h2>My profile</h2>
      <p>Update your contact information (name, email, phone).</p>
    </header>

    <div class="profile-card">
      <form class="modal-form" @submit.prevent="save">
        <div class="form-row">
          <label class="field-label" for="profile-username">Username</label>
          <input id="profile-username" v-model="username" type="text" class="text-input" disabled />
        </div>
        <div class="form-row">
          <label class="field-label" for="profile-email">Email</label>
          <input id="profile-email" v-model="email" type="email" class="text-input" required :disabled="saving" />
        </div>
        <div class="form-row">
          <label class="field-label" for="profile-first-name">First name</label>
          <input id="profile-first-name" v-model="firstName" type="text" class="text-input" :disabled="saving" />
        </div>
        <div class="form-row">
          <label class="field-label" for="profile-last-name">Last name</label>
          <input id="profile-last-name" v-model="lastName" type="text" class="text-input" :disabled="saving" />
        </div>
        <div class="form-row">
          <label class="field-label" for="profile-phone">Phone</label>
          <input id="profile-phone" v-model="phone" type="tel" class="text-input" :disabled="saving" />
        </div>
        <p v-if="error" class="modal-error">{{ error }}</p>
        <div class="modal-actions">
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Saving…' : 'Save profile' }}
          </button>
          <router-link to="/employee-portal" class="btn-secondary">Back to dashboard</router-link>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getEmployeeProfile, updateEmployeeProfile } from '../api'

const username = ref('')
const email = ref('')
const firstName = ref('')
const lastName = ref('')
const phone = ref('')
const error = ref('')
const saving = ref(false)

async function load() {
  try {
    const profile = await getEmployeeProfile()
    username.value = profile.username
    email.value = profile.email || ''
    firstName.value = profile.first_name || ''
    lastName.value = profile.last_name || ''
    phone.value = profile.phone || ''
  } catch {
    error.value = 'Failed to load profile.'
  }
}

async function save() {
  if (!email.value.trim()) {
    error.value = 'Email is required.'
    return
  }
  error.value = ''
  saving.value = true
  try {
    await updateEmployeeProfile({
      email: email.value.trim(),
      first_name: firstName.value.trim() || undefined,
      last_name: lastName.value.trim() || undefined,
      phone: phone.value.trim() || undefined,
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to save profile.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
