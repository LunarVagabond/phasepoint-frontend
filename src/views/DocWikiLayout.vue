<template>
  <div class="policy-wiki doc-wiki">
    <div class="wiki-body">
      <DocSidebar
        :doc-type="docType"
        :items="items"
        :toc="[]"
        :show-items="true"
        :show-toc="false"
        :versions="versions"
        :can-edit="canEdit"
        :current-slug="currentSlug"
        :needs-policy-accept="needsPolicyAccept"
        side="left"
      />
      <main class="wiki-main">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" :key="route.fullPath" />
          </keep-alive>
        </router-view>
      </main>
      <DocSidebar
        :doc-type="docType"
        :items="[]"
        :toc="toc"
        :show-items="false"
        :can-edit="canEdit"
        :current-slug="currentSlug"
        :needs-policy-accept="needsPolicyAccept"
        side="right"
      />
    </div>
    <WikiAcceptFooter
      v-if="docType === 'policy' && needsPolicyAccept"
      v-model:accepted="accepted"
      :loading="acceptLoading"
      :error="acceptError"
      @submit="submitAccept"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, provide, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  getPolicies,
  getProcedures,
  getBundleHash,
  getMe,
  acknowledgePolicies,
  canEditPolicies,
  canEditProcedures,
} from '../api'
import DocSidebar from '../components/DocSidebar.vue'
import WikiAcceptFooter from '../components/WikiAcceptFooter.vue'
import type { TocItem } from '../components/DocSidebar.vue'
import type { PolicySummary, PolicyVersion } from '../api'
import type { ProcedureSummary, ProcedureVersion } from '../api'

const router = useRouter()
const route = useRoute()

const docType = computed(() => {
  const match = route.matched.find((m) => m.meta?.docType)
  const type = match?.meta?.docType as string | undefined
  if (type === 'policy' || type === 'procedure') return type
  if (route.path.startsWith('/employee-portal/procedures')) return 'procedure'
  return 'policy'
})

const policies = ref<PolicySummary[]>([])
const procedures = ref<ProcedureSummary[]>([])
const items = computed(() => (docType.value === 'policy' ? policies.value : procedures.value))

const toc = ref<TocItem[]>([])
const versions = ref<PolicyVersion[] | ProcedureVersion[]>([])
const currentHash = ref('')
const needsPolicyAccept = ref(true)
const accepted = ref(false)
const acceptLoading = ref(false)
const acceptError = ref('')
const me = ref<Awaited<ReturnType<typeof getMe>> | null>(null)
const loadError = ref('')

const canEdit = computed(() => {
  if (!me.value) return false
  return docType.value === 'policy' ? canEditPolicies(me.value) : canEditProcedures(me.value)
})

const currentSlug = computed(() => {
  const name = route.name as string
  if (name === 'PolicyDetail' || name === 'ProcedureDetail') return route.params.slug as string
  return null
})

const listRouteName = computed(() => (docType.value === 'policy' ? 'Policies' : 'Procedures'))
const detailRouteName = computed(() => (docType.value === 'policy' ? 'PolicyDetail' : 'ProcedureDetail'))

const pageTitle = ref('')
provide('pageTitle', pageTitle)
provide('policies', policies)
provide('procedures', procedures)
provide('setToc', (items: TocItem[]) => {
  toc.value = items
})
provide('clearToc', () => {
  toc.value = []
})
provide('setVersions', (items: PolicyVersion[] | ProcedureVersion[]) => {
  versions.value = items
})
provide('needsPolicyAccept', needsPolicyAccept)

watch(
  () => [route.name, route.params.slug, items.value.length] as const,
  ([name, slug, count]) => {
    if (name === listRouteName.value && !slug && count > 0) {
      const first = items.value[0]
      if (first) router.replace({ name: detailRouteName.value, params: { slug: first.slug } })
    }
  },
  { immediate: true }
)

async function loadDocData() {
  const type = docType.value
  if (type === 'policy') {
    procedures.value = []
    toc.value = []
    versions.value = []
    try {
      const [list, hashData] = await Promise.all([getPolicies(), getBundleHash()])
      policies.value = list
      currentHash.value = hashData.bundle_hash
      if (me.value) {
        const ack = me.value.acknowledged_bundle_hash
        needsPolicyAccept.value = !ack || hashData.bundle_hash !== ack
      }
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : 'Failed to load policies'
      policies.value = []
    }
  } else {
    policies.value = []
    toc.value = []
    versions.value = []
    try {
      const list = await getProcedures()
      procedures.value = list
    } catch (e) {
      loadError.value = e instanceof Error ? e.message : 'Failed to load procedures'
      procedures.value = []
    }
  }
}

onMounted(async () => {
  try {
    const userData = await getMe()
    me.value = userData
    await loadDocData()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Failed to load'
  }
})

watch(docType, () => {
  loadDocData()
})

async function submitAccept() {
  if (!accepted.value || !currentHash.value) return
  acceptError.value = ''
  acceptLoading.value = true
  try {
    await acknowledgePolicies(currentHash.value)
    const raw = (route.query.redirect as string) || '/employee-portal'
    const redirect = typeof raw === 'string' ? raw.split('?')[0].trim() || '/employee-portal' : '/employee-portal'
    await router.push(redirect)
  } catch (e) {
    acceptError.value = e instanceof Error ? e.message : 'Failed to acknowledge'
  } finally {
    acceptLoading.value = false
  }
}
</script>
