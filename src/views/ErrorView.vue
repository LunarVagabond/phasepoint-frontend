<template>
  <div class="error-page">
    <div class="error-page__inner">
      <div class="error-page__graphic" aria-hidden="true">
        <span class="error-page__code">{{ code }}</span>
      </div>
      <h1 class="error-page__title">{{ title }}</h1>
      <p class="error-page__message">{{ message }}</p>
      <div class="error-page__actions">
        <router-link to="/" class="btn btn-primary">Go to home</router-link>
        <button type="button" class="btn btn-secondary" @click="goBack">Go back</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
    code?: number
    title?: string
    message?: string
  }>(),
  {
    code: 404,
    title: 'Page not found',
    message: 'The page you’re looking for doesn’t exist or has been moved.',
  }
)

const router = useRouter()

const title = computed(() => props.title)
const message = computed(() => props.message)
const code = computed(() => props.code)

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-8 $space-4;
  background: var(--color-background);
}

.error-page__inner {
  text-align: center;
  max-width: 420px;
}

.error-page__graphic {
  margin-bottom: $space-6;
}

.error-page__code {
  display: inline-block;
  font-size: clamp(4rem, 15vw, 7rem);
  font-weight: 700;
  line-height: 1;
  color: var(--color-primary);
  opacity: 0.9;
  letter-spacing: -0.04em;
}

.error-page__title {
  font-size: $font-size-2xl;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 $space-3;
  line-height: $line-height-tight;
}

.error-page__message {
  font-size: $font-size-base;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0 0 $space-8;
}

.error-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  justify-content: center;
}

.btn {
  display: inline-block;
  padding: $space-3 $space-6;
  border-radius: $radius-md;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s, color 0.2s, transform 0.15s;
  cursor: pointer;
  border: none;
  font-family: inherit;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  color: white;
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-border);
}
</style>
