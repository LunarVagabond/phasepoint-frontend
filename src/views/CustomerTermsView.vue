<template>
  <section class="terms-page">
    <header class="terms-header">
      <h2>{{ terms?.title || 'Terms & Conditions' }}</h2>
      <p>Review legal, compliance, and operational terms that govern your use of the customer portal.</p>
    </header>
    <article class="terms-card">
      <h3>Portal Usage and Compliance</h3>
      <p>{{ terms?.content }}</p>
      <ul>
        <li>Requests must include accurate asset details and contact information.</li>
        <li>Status updates are provided as processing milestones are completed.</li>
        <li>All submitted records are retained for compliance and audit requirements.</li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getCustomerTerms } from '../api'

const terms = ref<null | Awaited<ReturnType<typeof getCustomerTerms>>>(null)

onMounted(async () => {
  terms.value = await getCustomerTerms()
})
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.terms-page {
  display: grid;
  gap: $space-6;
}

.terms-header h2 {
  margin: 0 0 $space-2;
}

.terms-header p {
  margin: 0;
  color: var(--color-text-muted);
}

.terms-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  padding: $space-6;
  box-shadow: var(--shadow-sm);
}

.terms-card h3 {
  margin-top: 0;
}

.terms-card p {
  color: var(--color-text-muted);
  line-height: 1.7;
}

.terms-card ul {
  margin: $space-4 0 0;
  padding-left: 1.25rem;
}

.terms-card li + li {
  margin-top: $space-2;
}
</style>
