<template>
  <div class="policy-editor-view">
    <SiteHeader />
    <div class="editor-wrapper">
      <div v-if="loading" class="loading">Loading…</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else class="editor-container">
        <div class="editor-header">
          <h1>{{ isEdit ? `Edit Policy: ${policyName}` : 'Create Policy' }}</h1>
        </div>
        <form @submit.prevent="handleSave" class="editor-form">
          <div class="form-grid">
            <div class="form-group">
              <label>Name *</label>
              <input v-model="formData.name" required type="text" placeholder="Policy name" @change="syncFormToBody" />
            </div>
            <div class="form-group">
              <label>Slug *</label>
              <input
                v-model="formData.slug"
                required
                type="text"
                :disabled="isEdit"
                placeholder="policy-slug"
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
                  <option
                    v-for="g in ownerChoices.groups"
                    :key="g.value"
                    :value="g.value"
                  >
                    {{ g.label }}
                  </option>
                </optgroup>
                <optgroup label="Users">
                  <option
                    v-for="u in ownerChoices.users"
                    :key="u.value"
                    :value="u.value"
                  >
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
            <label>Policy Content (Markdown) *</label>
            <PolicyEditor v-model="formData.body" />
          </div>
          <div class="form-actions">
            <button type="button" @click="handleCancel" class="btn-secondary">Cancel</button>
            <button type="submit" :disabled="saving" class="btn-primary">
              {{ saving ? 'Saving…' : isEdit ? 'Update Policy' : 'Create Policy' }}
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
import { getPolicy, createPolicy, updatePolicy, getMe, canEditPolicies, getOwnerChoices, ensureCsrfCookie } from '../api'
import PolicyEditor from '../components/PolicyEditor.vue'
import SiteHeader from '../components/SiteHeader.vue'
import { parseFrontmatter, buildBody, getReservedKeysInFrontmatter, RESERVED_FRONTMATTER_KEYS } from '../utils/frontmatter'
import type { PolicyDetail, PolicyCreateData, OwnerChoicesResponse } from '../api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const policy = ref<PolicyDetail | null>(null)
const me = ref<Awaited<ReturnType<typeof getMe>> | null>(null)
const ownerChoices = ref<OwnerChoicesResponse>({ groups: [], users: [] })

const isEdit = computed(() => !!route.params.slug)
const policyName = computed(() => policy.value?.name || '')

const ownerValueInChoices = computed(() => {
  const v = formData.value.owner
  if (!v) return true
  return (
    ownerChoices.value.groups.some((g) => g.value === v) ||
    ownerChoices.value.users.some((u) => u.value === v)
  )
})

const formData = ref<PolicyCreateData>({
  name: '',
  slug: '',
  effective_date: new Date().toISOString().split('T')[0],
  body: '',
  status: 'draft',
})

onMounted(async () => {
  await ensureCsrfCookie()
  // Check permissions
  try {
    me.value = await getMe()
    if (!canEditPolicies(me.value)) {
      error.value = 'You do not have permission to edit policies. Membership in the "operations" group is required.'
      loading.value = false
      return
    }
  } catch (e) {
    error.value = 'Failed to load user information'
    loading.value = false
    return
  }

  // Load owner dropdown (groups + users)
  try {
    ownerChoices.value = await getOwnerChoices()
  } catch {
    // non-fatal
  }

  // Load policy if editing
  if (isEdit.value) {
    try {
      const slug = route.params.slug as string
      policy.value = await getPolicy(slug)
      const existingOwner = policy.value.owner || ''
      // Normalize legacy owner: if it's plain "operations" or a group name, use group:name
      const groupMatch = ownerChoices.value.groups.find(g => g.label === existingOwner || g.value === existingOwner)
      const userMatch = ownerChoices.value.users.find(u => u.value === existingOwner || u.label === existingOwner)
      let owner = existingOwner
      if (groupMatch) owner = groupMatch.value
      else if (userMatch) owner = userMatch.value
      else if (existingOwner && !existingOwner.startsWith('group:') && !existingOwner.startsWith('user:')) {
        const byGroup = ownerChoices.value.groups.find(g => g.value === `group:${existingOwner}`)
        if (byGroup) owner = byGroup.value
        else {
          const byUser = ownerChoices.value.users.find(u => u.value === `user:${existingOwner}`)
          if (byUser) owner = byUser.value
        }
      }
      const resolvedOwner = owner || (me.value ? `user:${me.value.username}` : '')
      const { frontmatter } = parseFrontmatter(policy.value.body)
      formData.value = {
        name: frontmatter.name ?? policy.value.name,
        slug: policy.value.slug,
        version: policy.value.version,
        effective_date: frontmatter.effective_date ?? policy.value.effective_date,
        owner: frontmatter.owner ?? resolvedOwner,
        document_control_id: policy.value.document_control_id || '',
        body: policy.value.body,
        status: frontmatter.status ?? policy.value.status,
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load policy'
    }
  } else {
    syncFormToBody()
  }
  loading.value = false
})

// When user edits markdown (body) and changes frontmatter, sync to form so dropdown/fields reflect it. Owner is source of truth in frontmatter.
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

/** Update body's frontmatter from current form (name, owner, effective_date, status). */
function syncFormToBody() {
  const { frontmatter, content } = parseFrontmatter(formData.value.body)
  const merged: Record<string, string> = { ...frontmatter }
  merged.name = formData.value.name
  merged.effective_date = formData.value.effective_date
  merged.status = formData.value.status
  merged.owner = formData.value.owner ?? ''
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
    merged.effective_date = formData.value.effective_date
    merged.status = formData.value.status
    merged.owner = formData.value.owner ?? ''
    RESERVED_FRONTMATTER_KEYS.forEach((k) => delete merged[k])
    const bodyToSave = buildBody(merged, content)

    const dataToSave: any = {
      name,
      slug: formData.value.slug.trim(),
      effective_date: formData.value.effective_date,
      body: bodyToSave,
      status: formData.value.status,
    }
    dataToSave.owner = formData.value.owner ?? ''
    // Backend handles versioning logic:
    // - New slug = version 1.0
    // - Same slug = increment version
    // - Editing ACTIVE policy = create new version
    // - Editing DRAFT policy = update in place (keeps version/doc_id)

    if (isEdit.value && policy.value) {
      // Update existing policy (will create new version if ACTIVE)
      await updatePolicy(policy.value.id, dataToSave)
      router.push({ name: 'PolicyDetail', params: { slug: formData.value.slug } })
    } else {
      // Create new policy
      const newPolicy = await createPolicy(dataToSave)
      router.push({ name: 'PolicyDetail', params: { slug: newPolicy.slug } })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save policy'
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
  if (isEdit.value && policy.value) {
    router.push({ name: 'PolicyDetail', params: { slug: policy.value.slug } })
  } else {
    router.push({ name: 'Policies' })
  }
}
</script>

<style scoped>
.policy-editor-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.editor-wrapper {
  flex: 1;
  width: 100%;
  max-width: 100%;
  padding: 24px;
  overflow-x: hidden;
}

.editor-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}

.loading,
.error {
  text-align: center;
  padding: 40px;
}

.error {
  color: #d32f2f;
}

.editor-header {
  margin-bottom: 24px;
}

.editor-header h1 {
  font-size: 1.8em;
  margin: 0;
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.form-group,
.form-group-full {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group-full {
  grid-column: 1 / -1;
}

.form-group label,
.form-group-full label {
  font-weight: bold;
  font-size: 0.9em;
}

.form-group input,
.form-group select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.form-group small {
  font-size: 0.85em;
  color: #666;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.btn-secondary,
.btn-primary {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 1em;
  cursor: pointer;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
