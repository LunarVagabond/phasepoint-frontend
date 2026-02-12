<template>
  <div class="policy-wiki-all">
    <div v-if="loading" class="loading">Loading procedures…</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="procedures.length === 0" class="error">No procedures found.</div>
    <div v-else class="policies-container">
      <p class="intro">
        Complete consolidated view of all active procedures (latest versions only). Use these as guides from customer
        asset pickup/dropoff through to disposal, recycle, and resale.
      </p>
      <div v-for="proc in procedures" :key="proc.id" class="policy-section">
        <div class="policy-header">
          <h2 class="policy-title">{{ proc.name }}</h2>
          <div class="policy-meta">
            Version {{ proc.version }} · Effective {{ proc.effective_date }}
            <span v-if="proc.owner"> · {{ proc.owner }}</span>
            <span v-if="proc.document_control_id"> · {{ proc.document_control_id }}</span>
          </div>
        </div>
        <div class="policy-content">
          <MarkdownContent :content="proc.body" :strip-top-heading="true" />
        </div>
        <div class="policy-footer">
          <router-link :to="{ name: 'ProcedureDetail', params: { slug: proc.slug } }" class="policy-link">
            View individual procedure →
          </router-link>
        </div>
      </div>
    </div>
    <ProcedurePrintFooter :print-all="true" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject, onBeforeUnmount, watch, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { getProcedures, getProcedure } from '../api'
import MarkdownContent from '../components/MarkdownContent.vue'
import ProcedurePrintFooter from '../components/ProcedurePrintFooter.vue'
import type { ProcedureDetail } from '../api'

const pageTitleRef = inject<Ref<string>>('pageTitle')
const clearToc = inject<() => void>('clearToc')

const route = useRoute()
const loading = ref(true)
const error = ref('')
const procedures = ref<ProcedureDetail[]>([])

onMounted(async () => {
  clearToc?.()
  if (pageTitleRef) pageTitleRef.value = 'All Procedures'

  try {
    const list = await getProcedures()
    if (!list || list.length === 0) {
      error.value = 'No procedures found'
      loading.value = false
      return
    }
    const detailPromises = list.map((p) => getProcedure(p.slug))
    procedures.value = await Promise.all(detailPromises)
  } catch (e) {
    console.error('Error loading procedures:', e)
    error.value = e instanceof Error ? e.message : 'Failed to load procedures'
  } finally {
    loading.value = false
  }
})

watch(
  () => route.name,
  (newName) => {
    if (newName === 'AllProcedures') {
      clearToc?.()
      if (pageTitleRef) pageTitleRef.value = 'All Procedures'
    }
  }
)

onBeforeUnmount(() => {
  if (pageTitleRef) pageTitleRef.value = ''
  clearToc?.()
})
</script>

<style scoped>
.policy-wiki-all {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  padding-bottom: 80px;
}

.loading,
.error {
  text-align: center;
  padding: 40px;
}

.error {
  color: #d32f2f;
}

.intro {
  color: #666;
  margin-bottom: 32px;
}

.policies-container {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.policy-section {
  padding-bottom: 40px;
  border-bottom: 2px solid #e0e0e0;
}

.policy-section:last-child {
  border-bottom: none;
}

.policy-header {
  margin-bottom: 20px;
}

.policy-title {
  font-size: 1.8em;
  margin: 0 0 8px 0;
}

.policy-meta {
  color: #666;
  font-size: 0.9em;
}

.policy-content {
  margin: 20px 0;
}

.policy-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.policy-link {
  color: #007bff;
  text-decoration: none;
}

.policy-link:hover {
  text-decoration: underline;
}
</style>
