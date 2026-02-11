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
import { useRouter } from 'vue-router'
import { getDraftPolicies, deletePolicy } from '../api'
import type { PolicySummary } from '../api'

const router = useRouter()
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

<style scoped>
.wiki-drafts {
  padding: 0 0 2rem;
}

.drafts-header {
  margin-bottom: 1.5rem;
}

.drafts-title {
  font-size: 1.5rem;
  margin: 0 0 0.5rem;
}

.drafts-intro {
  margin: 0;
  color: var(--color-text-muted, #666);
  font-size: 0.95rem;
}

.loading,
.error {
  padding: 1rem 0;
}

.error {
  color: var(--color-error);
}

.drafts-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.drafts-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}

.drafts-link {
  font-weight: 500;
  min-width: 0;
}

.drafts-meta {
  color: var(--color-text-muted, #666);
  font-size: 0.9rem;
}

.drafts-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.btn-edit {
  padding: 6px 12px;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.btn-edit:hover {
  opacity: 0.9;
}

.btn-delete {
  padding: 6px 12px;
  background: transparent;
  color: var(--color-error);
  border: 1px solid var(--color-error);
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-delete:hover {
  background: var(--color-error);
  color: white;
}

.drafts-empty {
  color: var(--color-text-muted, #666);
  margin: 2rem 0;
}
</style>
