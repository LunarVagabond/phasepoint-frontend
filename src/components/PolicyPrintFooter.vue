<template>
  <footer class="policy-print-footer">
    <button type="button" class="print-btn" @click="handlePrint" :disabled="printing">
      {{ printing ? 'Printing…' : 'Print Policy Doc' }}
    </button>
    <button
      v-if="canShowArchive"
      type="button"
      class="archive-btn"
      @click="showArchiveConfirm = true"
      :disabled="archiving"
      title="Archive Policy"
    >
      Archive
    </button>
    <button
      v-if="canShowDelete && policyId"
      type="button"
      class="delete-btn"
      @click="showDeleteConfirm = true"
      :disabled="deleting"
      title="Delete Policy"
    >
      🗑️
    </button>
    <p v-if="error" class="error">{{ error }}</p>
    
    <!-- Archive Confirmation Modal -->
    <div v-if="showArchiveConfirm" class="modal-backdrop" @click.self="showArchiveConfirm = false">
      <div class="modal delete-confirm-modal" @click.stop>
        <div class="modal-head">
          <h3 class="modal-title">Archive Policy</h3>
          <button type="button" class="modal-close" aria-label="Close" @click="showArchiveConfirm = false">×</button>
        </div>
        <div class="modal-content">
          <p>Archive this policy? It will be hidden from the policies list and no longer shown to users. You can still see or restore it from Django admin if needed.</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="showArchiveConfirm = false" :disabled="archiving">
            Cancel
          </button>
          <button type="button" class="btn-primary" @click="handleArchive" :disabled="archiving">
            {{ archiving ? 'Archiving…' : 'Archive' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-backdrop" @click.self="showDeleteConfirm = false">
      <div class="modal delete-confirm-modal" @click.stop>
        <div class="modal-head">
          <h3 class="modal-title">Delete Policy</h3>
          <button type="button" class="modal-close" aria-label="Close" @click="showDeleteConfirm = false">×</button>
        </div>
        <div class="modal-content">
          <p>Are you sure you want to delete this policy? This action cannot be undone.</p>
          <p class="modal-warning">Only DRAFT policies can be deleted. Active policies cannot be deleted.</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="showDeleteConfirm = false" :disabled="deleting">
            Cancel
          </button>
          <button type="button" class="btn-danger" @click="handleDelete" :disabled="deleting">
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPolicyPrint, deletePolicy, archivePolicy, getPolicy, canEditPolicies, getMe } from '../api'

const props = defineProps<{
  policySlug?: string | null
  printAll?: boolean
}>()

const emit = defineEmits<{
  print: []
  deleted: []
  archived: []
}>()

const route = useRoute()
const router = useRouter()
const printing = ref(false)
const deleting = ref(false)
const archiving = ref(false)
const error = ref('')
const showDeleteConfirm = ref(false)
const showArchiveConfirm = ref(false)
const me = ref<Awaited<ReturnType<typeof getMe>> | null>(null)
const policyId = ref<string | null>(null)
const policyStatus = ref<string | null>(null)

const canEdit = computed(() => me.value ? canEditPolicies(me.value) : false)
const canShowDelete = computed(() => canEdit.value && policyId.value && policyStatus.value === 'draft')
const canShowArchive = computed(() => canEdit.value && policyId.value && policyStatus.value && policyStatus.value !== 'draft' && policyStatus.value !== 'archived')

// Load user and policy ID if we have a slug
onMounted(async () => {
  if (props.policySlug && !props.printAll) {
    try {
      const [userData, policy] = await Promise.all([getMe(), getPolicy(props.policySlug)])
      me.value = userData
      policyId.value = policy.id
      policyStatus.value = policy.status
    } catch {
      // Ignore errors
    }
  } else {
    // Load user for canDelete check even if no policy slug
    try {
      me.value = await getMe()
    } catch {
      // Ignore errors
    }
  }
})

async function handlePrint() {
  if (printing.value) return
  printing.value = true
  error.value = ''
  
  try {
    const slug = props.printAll ? undefined : (props.policySlug || undefined)
    const version = slug ? (route.query.v as string | undefined) : undefined
    const html = await getPolicyPrint(slug, version)
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Failed to open print window. Please allow popups.')
    }
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printing.value = false
      }, 250)
    }
    emit('print')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to generate print document'
    printing.value = false
  }
}

async function handleArchive() {
  if (!policyId.value || archiving.value) return
  archiving.value = true
  error.value = ''
  try {
    await archivePolicy(policyId.value)
    showArchiveConfirm.value = false
    emit('archived')
    router.push({ name: 'AllPolicies' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to archive policy'
    archiving.value = false
  }
}

async function handleDelete() {
  if (!policyId.value || deleting.value) return
  deleting.value = true
  error.value = ''
  try {
    await deletePolicy(policyId.value)
    showDeleteConfirm.value = false
    emit('deleted')
    router.push({ name: 'AllPolicies' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to delete policy'
    deleting.value = false
  }
}
</script>

