<template>
  <div class="policy-wiki-all">
    <div v-if="loading" class="loading">Loading policies…</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="policies.length === 0" class="error">No policies found.</div>
    <div v-else class="policies-container">
      <p class="intro">Complete consolidated view of all active policies (latest versions only).</p>
      <div v-for="policy in policies" :key="policy.id" class="policy-section">
        <div class="policy-header">
          <h2 class="policy-title">{{ policy.name }}</h2>
          <div class="policy-meta">
            Version {{ policy.version }} · Effective {{ policy.effective_date }}
            <span v-if="policy.owner"> · {{ policy.owner }}</span>
            <span v-if="policy.document_control_id"> · {{ policy.document_control_id }}</span>
          </div>
        </div>
        <div class="policy-content">
          <MarkdownContent :content="policy.body" :strip-top-heading="true" />
        </div>
        <div class="policy-footer">
          <router-link :to="{ name: 'PolicyDetail', params: { slug: policy.slug } }" class="policy-link">
            View individual policy →
          </router-link>
        </div>
      </div>
    </div>
    <PolicyPrintFooter :print-all="true" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject, onBeforeUnmount, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { getPolicies, getPolicy } from '../api'
import MarkdownContent from '../components/MarkdownContent.vue'
import PolicyPrintFooter from '../components/PolicyPrintFooter.vue'
import type { PolicyDetail } from '../api'

const pageTitleRef = inject<Ref<string>>('pageTitle')
const clearToc = inject<() => void>('clearToc')

const route = useRoute()
const loading = ref(true)
const error = ref('')
const policies = ref<PolicyDetail[]>([])

onMounted(async () => {
  // Clear TOC and set page title
  clearToc?.()
  if (pageTitleRef) pageTitleRef.value = 'All Policies'
  
  try {
    // Always fetch policies directly to ensure we have the latest data
    const policyList = await getPolicies()
    if (!policyList || policyList.length === 0) {
      error.value = 'No policies found'
      loading.value = false
      return
    }
    // Fetch full details for each policy
    const detailPromises = policyList.map(p => getPolicy(p.slug))
    policies.value = await Promise.all(detailPromises)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load policies'
  } finally {
    loading.value = false
  }
})

// Watch for route changes to ensure TOC is cleared
watch(() => route.name, (newName) => {
  if (newName === 'AllPolicies') {
    clearToc?.()
    if (pageTitleRef) pageTitleRef.value = 'All Policies'
  }
})

onBeforeUnmount(() => {
  if (pageTitleRef) pageTitleRef.value = ''
  clearToc?.()
})
</script>

<style scoped lang="scss">
@use '../styles/views/policy-wiki-all';
</style>
