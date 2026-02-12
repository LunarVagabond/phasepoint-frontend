<template>
  <div class="customer-auth-page">
    <PublicSiteHeader title="Customer Onboarding" />
    <main class="customer-auth-main">
      <section class="auth-card">
        <h2 class="auth-title">Create Your Account</h2>
        <p class="auth-subtitle">Register your organization to submit ITAD requests from the secure customer portal.</p>
        <form class="auth-form" @submit.prevent="onSubmit">
          <label for="company-name">Company name</label>
          <input id="company-name" v-model="companyName" placeholder="Company or organization" required />
          <label for="username">Username</label>
          <input id="username" v-model="username" placeholder="Choose a username" autocomplete="username" required />
          <label for="email">Email</label>
          <input id="email" v-model="email" placeholder="name@company.com" type="email" autocomplete="email" />
          <label for="phone">Phone</label>
          <input id="phone" v-model="phone" placeholder="Optional" type="tel" />
          <label for="password">Password</label>
          <input id="password" v-model="password" placeholder="Create a password" type="password" autocomplete="new-password" required />
          <button class="auth-submit" :disabled="loading">{{ loading ? 'Creating...' : 'Create account' }}</button>
          <p v-if="error" class="auth-error">{{ error }}</p>
          <p class="auth-meta">
            Already registered?
            <router-link to="/customer/login">Sign in</router-link>
          </p>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerCustomer } from '../api'
import PublicSiteHeader from '../components/PublicSiteHeader.vue'

const router = useRouter()
const companyName = ref('')
const username = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await registerCustomer({
      company_name: companyName.value.trim(),
      username: username.value.trim(),
      password: password.value,
      email: email.value.trim() || undefined,
      phone: phone.value.trim() || undefined,
    })
    await router.push('/customer-portal')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Registration failed.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.customer-auth-page {
  min-height: 100vh;
  background: linear-gradient(180deg, var(--color-background) 0%, var(--color-surface) 100%);
}

.customer-auth-main {
  max-width: 1100px;
  margin: 0 auto;
  padding: $space-12 $space-4;
}

.auth-card {
  max-width: 620px;
  margin: 0 auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  box-shadow: var(--shadow-md);
  padding: $space-8;
}

.auth-title {
  margin: 0 0 $space-2;
  font-size: $font-size-2xl;
}

.auth-subtitle {
  margin: 0 0 $space-6;
  color: var(--color-text-muted);
}

.auth-form {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;
}

.auth-form input {
  width: 100%;
  padding: $space-3 $space-4;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
}

.auth-submit {
  margin-top: $space-2;
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  font-weight: 600;
}

.auth-submit:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.auth-error {
  margin: 0;
  color: var(--color-error);
}

.auth-meta {
  margin: $space-2 0 0;
  color: var(--color-text-muted);
}
</style>
