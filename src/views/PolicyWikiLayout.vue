<template>
  <div class="policy-wiki">
    <SiteHeader :policy-only="needsPolicyAccept" />
    <div class="wiki-body">
      <PolicySidebar :policies="policies" :toc="[]" :show-toc="false" :versions="versions" :can-edit="canEdit" :needs-policy-accept="needsPolicyAccept" side="left" />
      <main class="wiki-main">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" :key="route.fullPath" />
          </keep-alive>
        </router-view>
      </main>
      <PolicySidebar :policies="[]" :toc="toc" :show-policies="false" :can-edit="canEdit" :needs-policy-accept="needsPolicyAccept" :current-policy-slug="currentPolicySlug" side="right" />
    </div>
    <WikiAcceptFooter
      v-if="needsPolicyAccept"
      v-model:accepted="accepted"
      :loading="loading"
      :error="error"
      @submit="submitAccept"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, provide, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ensureCsrfCookie, getPolicies, getBundleHash, getMe, acknowledgePolicies, canEditPolicies } from '../api'
import SiteHeader from '../components/SiteHeader.vue'
import PolicySidebar from '../components/PolicySidebar.vue'
import WikiAcceptFooter from '../components/WikiAcceptFooter.vue'
import type { TocItem } from '../components/PolicySidebar.vue'
import type { PolicyVersion } from '../api'

const router = useRouter()
const route = useRoute()
const policies = ref<Awaited<ReturnType<typeof getPolicies>>>([])
const toc = ref<TocItem[]>([])
const versions = ref<PolicyVersion[]>([])
const currentHash = ref('')
const needsPolicyAccept = ref(true)
const accepted = ref(false)
const loading = ref(false)
const error = ref('')
const me = ref<Awaited<ReturnType<typeof getMe>> | null>(null)

const canEdit = computed(() => me.value ? canEditPolicies(me.value) : false)
const currentPolicySlug = computed(() => route.name === 'PolicyDetail' ? (route.params.slug as string) : null)

const pageTitle = ref('')
provide('pageTitle', pageTitle)
provide('policies', policies)
provide('setToc', (items: TocItem[]) => {
  toc.value = items
})
provide('clearToc', () => {
  toc.value = []
})
provide('setVersions', (items: PolicyVersion[]) => {
  versions.value = items
})
provide('needsPolicyAccept', needsPolicyAccept)

watch(
  () => [route.name, route.params.slug, policies.value.length] as const,
  ([name, slug, count]) => {
    if (name === 'Policies' && !slug && count > 0) {
      router.replace({ name: 'PolicyDetail', params: { slug: policies.value[0].slug } })
      return
    }
    if (name === 'Policies' || name === 'AllPolicies') {
      // Don't clear TOC/pageTitle here - let the child component handle it
      // This prevents clearing when navigating between policy views
    }
  },
  { immediate: true }
)

onMounted(async () => {
  try {
    await ensureCsrfCookie()
    const [list, hashData, userData] = await Promise.all([getPolicies(), getBundleHash(), getMe()])
    policies.value = list
    currentHash.value = hashData.bundle_hash
    me.value = userData
    const ack = userData.acknowledged_bundle_hash
    needsPolicyAccept.value = !ack || hashData.bundle_hash !== ack
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load policies'
  }
})

async function submitAccept() {
  if (!accepted.value || !currentHash.value) return
  error.value = ''
  loading.value = true
  try {
    await acknowledgePolicies(currentHash.value)
    const redirect = (route.query.redirect as string) || '/'
    await router.push(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to acknowledge'
  } finally {
    loading.value = false
  }
}
</script>

