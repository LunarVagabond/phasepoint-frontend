<template>
  <div class="customer-auth-page">
    <PublicSiteHeader title="Sign in" />
    <EnvironmentBanner />
    <main class="customer-auth-main">
      <section class="auth-card">
        <h2 class="auth-title">Sign in</h2>
        <p class="auth-subtitle">Sign in to access the Phasepoint portal.</p>
        <form class="auth-form" @submit.prevent="onSubmit">
          <label for="username">Username</label>
          <input id="username" v-model="username" placeholder="Your username" autocomplete="username" required />
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" placeholder="Your password" autocomplete="current-password" required />
          <button class="auth-submit" :disabled="loading">{{ loading ? 'Signing in...' : 'Sign in' }}</button>
          <p v-if="error" class="auth-error">{{ error }}</p>
          <p class="auth-meta">
            Need a customer account?
            <router-link to="/customer/register">Register here</router-link>
          </p>
        </form>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login, getMe } from '../api'
import EnvironmentBanner from '../components/EnvironmentBanner.vue'
import PublicSiteHeader from '../components/PublicSiteHeader.vue'
import { useNotifications } from '../composables/useNotifications'

const router = useRouter()
const route = useRoute()
const { error: showError } = useNotifications()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  loading.value = true
  error.value = ''
  try {
    await login(username.value, password.value)
    const me = await getMe()
    if (me.user_type === 'CUSTOMER') {
      await router.push('/customer-portal')
      return
    }
    if (me.user_type === 'EMPLOYEE') {
      const rawRedirect = (route.query.redirect as string) || '/employee-portal'
      const redirectTo = typeof rawRedirect === 'string' ? rawRedirect.split('?')[0].trim() || '/employee-portal' : '/employee-portal'
      const needsPolicyAccept = !me.acknowledged_bundle_hash || me.current_bundle_hash !== me.acknowledged_bundle_hash
      if (needsPolicyAccept) {
        await router.push({ name: 'Policies', query: { redirect: redirectTo } })
      } else {
        await router.push(redirectTo.startsWith('/') ? redirectTo : '/employee-portal')
      }
      return
    }
    error.value = 'Unknown account type.'
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Login failed.'
    error.value = errorMessage
    showError(errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '../styles/views/customer-login';
</style>
