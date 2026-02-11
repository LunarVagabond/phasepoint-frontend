<template>
  <div class="wiki-detail">
    <template v-if="loading">Loading…</template>
    <template v-else-if="policy">
      <div class="policy-header">
        <div class="meta-row">
          <p class="meta">Version {{ policy.version }} · Effective {{ policy.effective_date }}{{ (ownerDisplay ?? '') ? ` · ${ownerDisplay}` : '' }}</p>
          <router-link
            v-if="versions.length > 1"
            :to="{ name: 'PolicyDetail', params: { slug: policy.slug }, query: { v: undefined } }"
            class="version-link-inline"
          >
            View other versions
          </router-link>
        </div>
      </div>
      <MarkdownContent :content="policy.body" :strip-top-heading="true" />
      <PolicyPrintFooter v-if="!needsPolicyAccept" :policy-slug="policy.slug" @deleted="handlePolicyDeleted" />
    </template>
    <template v-else>Policy not found.</template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, inject, onBeforeUnmount, computed, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPolicy, getPolicyVersions, getMe, canEditPolicies } from '../api'
import MarkdownContent from '../components/MarkdownContent.vue'
import PolicyPrintFooter from '../components/PolicyPrintFooter.vue'
import { slugify } from '../utils/slugify'
import type { PolicyDetail, PolicyVersion } from '../api'
import type { TocItem } from '../components/PolicySidebar.vue'

const router = useRouter()

function stripFrontmatter(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('---')) return trimmed
  const rest = trimmed.slice(3)
  const end = rest.indexOf('---')
  if (end === -1) return trimmed
  return rest.slice(end + 3).trim()
}

function extractToc(markdown: string): TocItem[] {
  const body = stripFrontmatter(markdown)
  const toc: TocItem[] = []
  const re = /^#{1,3}\s+(.+)$/gm
  let m
  while ((m = re.exec(body)) !== null) {
    const level = (m[0].match(/^#+/) || [''])[0].length
    const text = m[1].trim()
    const id = slugify(text) || `h-${toc.length}`
    toc.push({ id, text, level })
  }
  return toc
}

const setToc = inject<(items: TocItem[]) => void>('setToc')
const clearToc = inject<() => void>('clearToc')
const pageTitleRef = inject<Ref<string>>('pageTitle')
const setVersions = inject<(versions: PolicyVersion[]) => void>('setVersions')

const route = useRoute()
const policy = ref<PolicyDetail | null>(null)
const loading = ref(true)
const versions = ref<PolicyVersion[]>([])
const me = ref<Awaited<ReturnType<typeof getMe>> | null>(null)
const needsPolicyAccept = inject<Ref<boolean>>('needsPolicyAccept', ref(false))

const canEdit = computed(() => me.value ? canEditPolicies(me.value) : false)

function formatOwner(owner: string): string {
  if (!owner) return ''
  if (owner.startsWith('group:')) return `${owner.slice(6)} (group)`
  if (owner.startsWith('user:')) return `${owner.slice(5)} (user)`
  return owner
}

const ownerDisplay = computed(() => (policy.value?.owner ? formatOwner(policy.value.owner) : ''))

async function load() {
  const slug = route.params.slug as string
  if (!slug) return
  clearToc?.()
  loading.value = true
  try {
    const versionParam = route.query.v as string | undefined
    policy.value = await getPolicy(slug, versionParam)
    if (pageTitleRef) pageTitleRef.value = policy.value?.name ?? ''
    if (policy.value?.body && setToc) {
      setToc(extractToc(policy.value.body))
    }
    // Load versions for this policy
    try {
      versions.value = await getPolicyVersions(slug)
      if (setVersions) setVersions(versions.value)
    } catch {
      versions.value = []
    }
    // Load user info for permission check
    try {
      me.value = await getMe()
    } catch {
      me.value = null
    }
  } catch {
    policy.value = null
    if (pageTitleRef) pageTitleRef.value = ''
    setToc?.([])
    versions.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => [route.params.slug, route.query.v], load)
function handlePolicyDeleted() {
  // Redirect to All Policies after deletion
  router.push({ name: 'AllPolicies' })
}

onBeforeUnmount(() => {
  if (pageTitleRef) pageTitleRef.value = ''
  clearToc?.()
  if (setVersions) setVersions([])
})
</script>

<style scoped>
.wiki-detail {
  padding-bottom: 80px; /* Space for sticky footer */
}

.policy-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.meta {
  margin: 0;
}

.version-link-inline {
  flex-shrink: 0;
  color: #666;
  text-decoration: underline;
  font-size: 0.9em;
}

.version-link-inline:hover {
  color: inherit;
}
</style>

