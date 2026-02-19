<template>
  <div class="policy-editor-view procedure-editor-view">
    <div class="editor-wrapper">
      <div v-if="loading" class="loading">Loading…</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else class="editor-container">
        <div class="editor-header">
          <h1>{{ isEdit ? `Edit Procedure: ${procedureName}` : 'Create Procedure' }}</h1>
        </div>
        <form @submit.prevent="handleSave" class="editor-form">
          <div class="form-grid">
            <div class="form-group">
              <label>Name *</label>
              <input v-model="formData.name" required type="text" placeholder="Procedure name" @change="syncFormToBody" />
            </div>
            <div class="form-group">
              <label>Slug *</label>
              <input
                v-model="formData.slug"
                required
                type="text"
                :disabled="isEdit"
                placeholder="procedure-slug"
                pattern="[-a-z0-9]+"
              />
              <small v-if="isEdit">Slug cannot be changed after creation</small>
            </div>
            <div class="form-group" v-if="isEdit">
              <label>Version</label>
              <input v-model="formData.version" type="text" disabled />
              <small>Version is auto-generated</small>
            </div>
            <div class="form-group">
              <label>Effective Date *</label>
              <input v-model="formData.effective_date" required type="date" @change="syncFormToBody" />
            </div>
            <div class="form-group">
              <label>Owner</label>
              <select v-model="formData.owner" class="owner-select" @change="syncFormToBody">
                <option value="">Select owner…</option>
                <option v-if="formData.owner && !ownerValueInChoices" :value="formData.owner">
                  (from frontmatter) {{ formData.owner }}
                </option>
                <optgroup label="Groups">
                  <option v-for="g in ownerChoices.groups" :key="g.value" :value="g.value">
                    {{ g.label }}
                  </option>
                </optgroup>
                <optgroup label="Users">
                  <option v-for="u in ownerChoices.users" :key="u.value" :value="u.value">
                    {{ u.label }}
                  </option>
                </optgroup>
              </select>
            </div>
            <div class="form-group" v-if="isEdit">
              <label>Document Control ID</label>
              <input v-model="formData.document_control_id" type="text" disabled />
              <small>Document Control ID is auto-generated</small>
            </div>
            <div class="form-group">
              <label>Status *</label>
              <select v-model="formData.status" required @change="syncFormToBody">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>
          <div class="form-group-full">
            <label>Procedure Content (Markdown) *</label>
            <PolicyEditor v-model="formData.body" />
          </div>
          <div class="form-actions">
            <button type="button" @click="handleCancel" class="btn-secondary">Cancel</button>
            <button type="submit" :disabled="saving" class="btn-primary">
              {{ saving ? 'Saving…' : isEdit ? 'Update Procedure' : 'Create Procedure' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getProcedure,
  createProcedure,
  updateProcedure,
  getMe,
  canEditProcedures,
  getOwnerChoices,
} from '../api'
import PolicyEditor from '../components/PolicyEditor.vue'
import { parseFrontmatter, buildBody, getReservedKeysInFrontmatter, RESERVED_FRONTMATTER_KEYS } from '../utils/frontmatter'
import type { ProcedureDetail, ProcedureCreateData } from '../api'
import type { OwnerChoicesResponse } from '../api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const procedure = ref<ProcedureDetail | null>(null)
const me = ref<Awaited<ReturnType<typeof getMe>> | null>(null)
const ownerChoices = ref<OwnerChoicesResponse>({ groups: [], users: [] })

const isEdit = computed(() => !!route.params.slug)
const procedureName = computed(() => procedure.value?.name || '')

const ownerValueInChoices = computed(() => {
  const v = formData.value.owner
  if (!v) return true
  return (
    ownerChoices.value.groups.some((g) => g.value === v) ||
    ownerChoices.value.users.some((u) => u.value === v)
  )
})

const formData = ref<ProcedureCreateData>({
  name: '',
  slug: '',
  effective_date: new Date().toISOString().split('T')[0],
  body: '',
  status: 'draft',
})

onMounted(async () => {
  try {
    me.value = await getMe()
    if (!canEditProcedures(me.value)) {
      error.value =
        'You do not have permission to edit procedures. Membership in the "operations" group is required.'
      loading.value = false
      return
    }
  } catch (e) {
    error.value = 'Failed to load user information'
    loading.value = false
    return
  }

  try {
    ownerChoices.value = await getOwnerChoices()
  } catch {
    // non-fatal
  }

  if (isEdit.value) {
    try {
      const slug = route.params.slug as string
      procedure.value = await getProcedure(slug)
      const existingOwner = procedure.value.owner || ''
      const groupMatch = ownerChoices.value.groups.find(
        (g) => g.label === existingOwner || g.value === existingOwner
      )
      const userMatch = ownerChoices.value.users.find(
        (u) => u.value === existingOwner || u.label === existingOwner
      )
      let owner = existingOwner
      if (groupMatch) owner = groupMatch.value
      else if (userMatch) owner = userMatch.value
      else if (
        existingOwner &&
        !existingOwner.startsWith('group:') &&
        !existingOwner.startsWith('user:')
      ) {
        const byGroup = ownerChoices.value.groups.find((g) => g.value === `group:${existingOwner}`)
        if (byGroup) owner = byGroup.value
        else {
          const byUser = ownerChoices.value.users.find((u) => u.value === `user:${existingOwner}`)
          if (byUser) owner = byUser.value
        }
      }
      const resolvedOwner = owner || (me.value ? `user:${me.value.username}` : '')
      const { frontmatter } = parseFrontmatter(procedure.value.body)
      formData.value = {
        name: frontmatter.name ?? procedure.value.name,
        slug: procedure.value.slug,
        version: procedure.value.version,
        effective_date: frontmatter.effective_date ?? procedure.value.effective_date,
        owner: frontmatter.owner ?? resolvedOwner,
        document_control_id: procedure.value.document_control_id || '',
        body: procedure.value.body,
        status: frontmatter.status ?? procedure.value.status,
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load procedure'
    }
  } else {
    syncFormToBody()
  }
  loading.value = false
})

watch(
  () => formData.value.body,
  (body) => {
    const { frontmatter } = parseFrontmatter(body)
    if (frontmatter.owner !== undefined) formData.value.owner = frontmatter.owner
    if (frontmatter.name !== undefined) formData.value.name = frontmatter.name
    if (frontmatter.effective_date !== undefined) formData.value.effective_date = frontmatter.effective_date
    if (frontmatter.status !== undefined) formData.value.status = frontmatter.status
  },
  { flush: 'sync' }
)

function syncFormToBody() {
  const { frontmatter, content } = parseFrontmatter(formData.value.body)
    const merged: Record<string, string> = { ...frontmatter }
    if (formData.value.name) merged.name = formData.value.name
    if (formData.value.effective_date) merged.effective_date = formData.value.effective_date
    if (formData.value.status) merged.status = formData.value.status
    if (formData.value.owner) merged.owner = formData.value.owner
  RESERVED_FRONTMATTER_KEYS.forEach((k) => delete merged[k])
  formData.value.body = buildBody(merged, content)
}

async function handleSave() {
  if (saving.value) return

  const name = formData.value.name?.trim()
  if (!name) {
    error.value = 'Name is required.'
    return
  }
  if (!formData.value.slug?.trim()) {
    error.value = 'Slug is required.'
    return
  }

  const { frontmatter, content } = parseFrontmatter(formData.value.body)
  const reserved = getReservedKeysInFrontmatter(frontmatter)
  if (reserved.length > 0) {
    error.value = `Remove ${reserved.join(', ')} from the document frontmatter—they are set by the system.`
    return
  }

  saving.value = true
  error.value = ''

  try {
    const merged: Record<string, string> = { ...frontmatter }
    merged.name = name
    if (formData.value.effective_date) merged.effective_date = formData.value.effective_date
    if (formData.value.status) merged.status = formData.value.status
    if (formData.value.owner) merged.owner = formData.value.owner
    RESERVED_FRONTMATTER_KEYS.forEach((k) => delete merged[k])
    const bodyToSave = buildBody(merged, content)

    if (isEdit.value && procedure.value) {
      const dataToSave: Parameters<typeof updateProcedure>[1] = {
        name,
        slug: formData.value.slug.trim(),
        effective_date: formData.value.effective_date,
        body: bodyToSave,
        status: formData.value.status,
        owner: formData.value.owner ?? '',
      }
      await updateProcedure(procedure.value.id, dataToSave)
      router.push({ name: 'ProcedureDetail', params: { slug: formData.value.slug } })
    } else {
      const dataToSave: Parameters<typeof createProcedure>[0] = {
        name,
        slug: formData.value.slug.trim(),
        effective_date: formData.value.effective_date,
        body: bodyToSave,
        status: formData.value.status,
        owner: formData.value.owner ?? '',
      }
      const newProcedure = await createProcedure(dataToSave)
      router.push({ name: 'ProcedureDetail', params: { slug: newProcedure.slug } })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save procedure'
    try {
      const parsed = JSON.parse(msg) as Record<string, string[] | string>
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const parts = Object.entries(parsed).map(([field, messages]) => {
          const m = Array.isArray(messages) ? messages[0] : messages
          return typeof m === 'string' ? `${field}: ${m}` : `${field}: invalid`
        })
        error.value = parts.length > 0 ? parts.join(' ') : msg
      } else {
        error.value = msg
      }
    } catch {
      error.value = msg
    }
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  if (isEdit.value && procedure.value) {
    router.push({ name: 'ProcedureDetail', params: { slug: procedure.value.slug } })
  } else {
    router.push({ name: 'Procedures' })
  }
}
</script>

<style scoped lang="scss">
@use '../styles/views/editor';
</style>
