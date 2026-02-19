<template>
  <slot v-if="!loading" />
  <div v-else class="auth-loading">
    <p>Loading...</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const loading = computed(() => authStore.loading)

onMounted(async () => {
  // Fetch user on mount if not already loaded
  if (!authStore.user && !authStore.loading) {
    await authStore.fetchUser()
  }
})
</script>

<style scoped lang="scss">
@use '../styles/components/auth-provider';
</style>
