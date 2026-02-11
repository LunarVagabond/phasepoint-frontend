<template>
  <div class="login">
    <h1>Phasepoint</h1>
    <form @submit.prevent="onSubmit">
      <input v-model="username" type="text" placeholder="Username" required />
      <input v-model="password" type="password" placeholder="Password" required />
      <button type="submit" :disabled="loading">Log in</button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ensureCsrfCookie, login, getMe } from '../api'

const router = useRouter()
const route = useRoute()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

onMounted(() => {
  ensureCsrfCookie().catch(() => {})
})

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await ensureCsrfCookie()
    const result = await login(username.value, password.value)
    if (!result) {
      error.value = 'Invalid credentials.'
      return
    }
    const me = await getMe()
    const needsPolicyAccept = !me.acknowledged_bundle_hash || me.current_bundle_hash !== me.acknowledged_bundle_hash
    const redirectTo = (route.query.redirect as string) || '/employee-portal'
    if (needsPolicyAccept) {
      router.push({ name: 'Policies', query: { redirect: redirectTo } })
    } else {
      router.push(redirectTo)
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed.'
  } finally {
    loading.value = false
  }
}
</script>

