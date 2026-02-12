<template>
  <div class="customer-auth-page">
    <PublicSiteHeader title="Customer Access" />
    <main class="customer-auth-main">
      <section class="auth-card">
        <h2 class="auth-title">Customer Login</h2>
        <p class="auth-subtitle">Sign in to create requests, track processing status, and view sustainability impact.</p>
        <form class="auth-form" @submit.prevent="onSubmit">
          <label for="username">Username</label>
          <input id="username" v-model="username" placeholder="Your username" autocomplete="username" required />
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" placeholder="Your password" autocomplete="current-password" required />
          <button class="auth-submit" :disabled="loading">{{ loading ? 'Signing in...' : 'Sign in' }}</button>
          <p v-if="error" class="auth-error">{{ error }}</p>
          <p class="auth-meta">
            Need an account?
            <router-link to="/customer/register">Register here</router-link>
          </p>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login, getMe } from '../api'
import PublicSiteHeader from '../components/PublicSiteHeader.vue'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    const ok = await login(username.value.trim(), password.value)
    if (!ok) throw new Error('Invalid credentials.')
    const me = await getMe()
    if (me.user_type !== 'CUSTOMER') throw new Error('This account is not a customer account.')
    await router.push('/customer-portal')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed.'
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
  max-width: 520px;
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
  display: flex;
  flex-direction: column;
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
