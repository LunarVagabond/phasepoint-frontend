<template>
  <div class="wiki-list">
    <div v-if="canEdit && !needsPolicyAccept" class="admin-actions">
      <router-link :to="{ name: 'PolicyEditor' }" class="btn-create">
        Create New Policy
      </router-link>
    </div>
    <p class="intro">Select a policy below or from the sidebar to read it. When you have read and accepted all policies, check the box below and submit.</p>
    <ul class="policy-list">
      <li v-for="p in policies" :key="p.id" class="policy-item">
        <router-link :to="{ name: 'PolicyDetail', params: { slug: p.slug } }">
          {{ p.name }} (v{{ p.version }})
        </router-link>
        <router-link
          v-if="canEdit && !needsPolicyAccept"
          :to="{ name: 'PolicyEditor', params: { slug: p.slug } }"
          class="edit-link"
          title="Edit policy"
        >
          ✏️
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref, onMounted, type Ref } from 'vue'
import { canEditPolicies } from '../api'
import type { PolicySummary, MeResponse } from '../api'

const policiesRef = inject<Ref<PolicySummary[]>>('policies')
const policies = computed(() => policiesRef?.value ?? [])
const needsPolicyAccept = inject<Ref<boolean>>('needsPolicyAccept', ref(false))
const me = ref<MeResponse | null>(null)
const canEdit = computed(() => me.value ? canEditPolicies(me.value) : false)

onMounted(async () => {
  try {
    const { getMe } = await import('../api')
    me.value = await getMe()
  } catch {
    me.value = null
  }
})
</script>

