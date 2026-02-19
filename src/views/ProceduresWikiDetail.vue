<template>
  <div class="wiki-detail">
    <template v-if="loading">Loading…</template>
    <template v-else-if="procedure">
      <div class="policy-header">
        <div class="meta-row">
          <p class="meta">
            Version {{ procedure.version }} · Effective {{ procedure.effective_date
            }}{{ ownerDisplay ? ` · ${ownerDisplay}` : '' }}
          </p>
          <router-link
            v-if="versions.length > 1"
            :to="{ name: 'ProcedureDetail', params: { slug: procedure.slug }, query: { v: undefined } }"
            class="version-link-inline"
          >
            View other versions
          </router-link>
        </div>
      </div>
      <MarkdownContent :content="procedure.body" :strip-top-heading="true" />
      <ProcedurePrintFooter v-if="canEdit" :procedure-slug="procedure.slug" @deleted="handleProcedureDeleted" />
    </template>
    <template v-else>Procedure not found.</template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, inject, onBeforeUnmount, computed, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProcedure, getProcedureVersions, getMe, canEditProcedures } from '../api'
import MarkdownContent from '../components/MarkdownContent.vue'
import ProcedurePrintFooter from '../components/ProcedurePrintFooter.vue'
import { slugify } from '../utils/slugify'
import type { ProcedureDetail, ProcedureVersion } from '../api'
import type { TocItem } from '../components/DocSidebar.vue'

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
const setVersions = inject<(versions: ProcedureVersion[]) => void>('setVersions')

const route = useRoute()
const procedure = ref<ProcedureDetail | null>(null)
const loading = ref(true)
const versions = ref<ProcedureVersion[]>([])
const me = ref<Awaited<ReturnType<typeof getMe>> | null>(null)

const canEdit = computed(() => (me.value ? canEditProcedures(me.value) : false))

function formatOwner(owner: string): string {
  if (!owner) return ''
  if (owner.startsWith('group:')) return `${owner.slice(6)} (group)`
  if (owner.startsWith('user:')) return `${owner.slice(5)} (user)`
  return owner
}

const ownerDisplay = computed(() => (procedure.value?.owner ? formatOwner(procedure.value.owner) : ''))

async function load() {
  const slug = route.params.slug as string
  if (!slug) return
  clearToc?.()
  loading.value = true
  try {
    const versionParam = route.query.v as string | undefined
    procedure.value = await getProcedure(slug, versionParam)
    if (pageTitleRef) pageTitleRef.value = procedure.value?.name ?? ''
    if (procedure.value?.body && setToc) {
      setToc(extractToc(procedure.value.body))
    }
    try {
      versions.value = await getProcedureVersions(slug)
      if (setVersions) setVersions(versions.value)
    } catch {
      versions.value = []
    }
    try {
      me.value = await getMe()
    } catch {
      me.value = null
    }
  } catch {
    procedure.value = null
    if (pageTitleRef) pageTitleRef.value = ''
    setToc?.([])
    versions.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(
  () => [route.params.slug, route.query.v],
  load
)
function handleProcedureDeleted() {
  router.push({ name: 'AllProcedures' })
}

onBeforeUnmount(() => {
  if (pageTitleRef) pageTitleRef.value = ''
  clearToc?.()
  if (setVersions) setVersions([])
})
</script>

<style scoped lang="scss">
@use '../styles/views/wiki-detail';
</style>
