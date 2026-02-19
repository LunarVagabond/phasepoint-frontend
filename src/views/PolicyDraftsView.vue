<template>
  <div class="wiki-drafts">
    <div class="drafts-header">
      <h1 class="drafts-title">Drafts</h1>
      <p class="drafts-intro">Draft policies are not visible to other users until you set status to Active. Edit to continue, or delete to remove.</p>
    </div>
    <div v-if="loading" class="loading">Loading…</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <ul v-else-if="drafts.length" class="drafts-list">
      <li v-for="p in drafts" :key="p.id" class="drafts-item">
        <router-link :to="{ name: 'PolicyEditor', params: { slug: p.slug } }" class="drafts-link">
          {{ p.name }} (v{{ p.version }})
        </router-link>
        <span class="drafts-meta">Effective {{ p.effective_date }}</span>
        <div class="drafts-actions">
          <router-link :to="{ name: 'PolicyEditor', params: { slug: p.slug } }" class="btn-edit" title="Edit draft">
            Edit
          </router-link>
          <button type="button" class="btn-delete" title="Delete draft" @click="confirmDelete(p)">
            Delete
          </button>
        </div>
      </li>
    </ul>
    <p v-else class="drafts-empty">No draft policies. Create one from the sidebar or when editing a policy.</p>
    <!-- Delete confirm modal -->
    <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget = null">
      <div class="modal delete-confirm-modal" @click.stop>
        <div class="modal-head">
          <h3 class="modal-title">Delete draft</h3>
          <button type="button" class="modal-close" aria-label="Close" @click="deleteTarget = null">×</button>
        </div>
        <div class="modal-content">
          <p>Are you sure you want to delete the draft "{{ deleteTarget.name }}"? This cannot be undone.</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="deleteTarget = null" :disabled="deleting">Cancel</button>
          <button type="button" class="btn-danger" @click="handleDelete" :disabled="deleting">
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject, onBeforeUnmount, type Ref } from 'vue'
import { getDraftPolicies, deletePolicy } from '../api'
import type { PolicySummary } from '../api'
const pageTitleRef = inject<Ref<string>>('pageTitle', ref(''))
const clearToc = inject<() => void>('clearToc', () => {})

const drafts = ref<PolicySummary[]>([])
const loading = ref(true)
const error = ref('')
const deleting = ref(false)
const deleteTarget = ref<PolicySummary | null>(null)

onMounted(async () => {
  clearToc()
  if (pageTitleRef) pageTitleRef.value = 'Drafts'
  loading.value = true
  error.value = ''
  try {
    drafts.value = await getDraftPolicies()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load drafts'
    drafts.value = []
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  if (pageTitleRef) pageTitleRef.value = ''
})

function confirmDelete(p: PolicySummary) {
  deleteTarget.value = p
}

async function handleDelete() {
  if (!deleteTarget.value || deleting.value) return
  deleting.value = true
  try {
    await deletePolicy(deleteTarget.value.id)
    drafts.value = drafts.value.filter((d) => d.id !== deleteTarget.value!.id)
    deleteTarget.value = null
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to delete draft'
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped lang="scss">
@use '../styles/views/policy-drafts';
</style>
