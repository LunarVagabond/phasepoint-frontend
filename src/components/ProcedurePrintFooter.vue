<template>
  <footer class="policy-print-footer">
    <button type="button" class="print-btn" @click="handlePrint" :disabled="printing">
      {{ printing ? 'Printing…' : 'Print Procedure Doc' }}
    </button>
    <button
      v-if="canShowArchive"
      type="button"
      class="archive-btn"
      @click="showArchiveConfirm = true"
      :disabled="archiving"
      title="Archive Procedure"
    >
      Archive
    </button>
    <button
      v-if="canShowDelete && procedureId"
      type="button"
      class="delete-btn"
      @click="showDeleteConfirm = true"
      :disabled="deleting"
      title="Delete Procedure"
    >
      🗑️
    </button>
    <p v-if="error" class="error">{{ error }}</p>

    <div v-if="showArchiveConfirm" class="modal-backdrop" @click.self="showArchiveConfirm = false">
      <div class="modal delete-confirm-modal" @click.stop>
        <div class="modal-head">
          <h3 class="modal-title">Archive Procedure</h3>
          <button type="button" class="modal-close" aria-label="Close" @click="showArchiveConfirm = false">×</button>
        </div>
        <div class="modal-content">
          <p>Archive this procedure? It will be hidden from the list and no longer shown to users.</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="showArchiveConfirm = false" :disabled="archiving">Cancel</button>
          <button type="button" class="btn-primary" @click="handleArchive" :disabled="archiving">
            {{ archiving ? 'Archiving…' : 'Archive' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteConfirm" class="modal-backdrop" @click.self="showDeleteConfirm = false">
      <div class="modal delete-confirm-modal" @click.stop>
        <div class="modal-head">
          <h3 class="modal-title">Delete Procedure</h3>
          <button type="button" class="modal-close" aria-label="Close" @click="showDeleteConfirm = false">×</button>
        </div>
        <div class="modal-content">
          <p>Are you sure you want to delete this procedure? This action cannot be undone.</p>
          <p class="modal-warning">Only DRAFT procedures can be deleted.</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="showDeleteConfirm = false" :disabled="deleting">Cancel</button>
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
import {
  getProcedurePrint,
  deleteProcedure,
  archiveProcedure,
  getProcedure,
  canEditProcedures,
  getMe,
} from '../api'

const props = defineProps<{
  procedureSlug?: string | null
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
const procedureId = ref<string | null>(null)
const procedureStatus = ref<string | null>(null)

const canEdit = computed(() => (me.value ? canEditProcedures(me.value) : false))
const canShowDelete = computed(() => canEdit.value && procedureId.value && procedureStatus.value === 'draft')
const canShowArchive = computed(
  () =>
    canEdit.value &&
    procedureId.value &&
    procedureStatus.value &&
    procedureStatus.value !== 'draft' &&
    procedureStatus.value !== 'archived'
)

onMounted(async () => {
  if (props.procedureSlug && !props.printAll) {
    try {
      const [userData, procedure] = await Promise.all([getMe(), getProcedure(props.procedureSlug)])
      me.value = userData
      procedureId.value = procedure.id
      procedureStatus.value = procedure.status
    } catch {
      // Ignore
    }
  } else {
    try {
      me.value = await getMe()
    } catch {
      // Ignore
    }
  }
})

async function handlePrint() {
  if (printing.value) return
  printing.value = true
  error.value = ''
  try {
    const slug = props.printAll ? undefined : props.procedureSlug || undefined
    const version = slug ? (route.query.v as string | undefined) : undefined
    const html = await getProcedurePrint(slug, version)
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
  if (!procedureId.value || archiving.value) return
  archiving.value = true
  error.value = ''
  try {
    await archiveProcedure(procedureId.value)
    showArchiveConfirm.value = false
    emit('archived')
    router.push({ name: 'AllProcedures' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to archive procedure'
    archiving.value = false
  }
}

async function handleDelete() {
  if (!procedureId.value || deleting.value) return
  deleting.value = true
  error.value = ''
  try {
    await deleteProcedure(procedureId.value)
    showDeleteConfirm.value = false
    emit('deleted')
    router.push({ name: 'AllProcedures' })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to delete procedure'
    deleting.value = false
  }
}
</script>
