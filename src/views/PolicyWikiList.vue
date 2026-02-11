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
import { getMe, canEditPolicies } from '../api'
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

<style scoped>
.admin-actions {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.btn-create {
  display: inline-block;
  padding: 10px 20px;
  background: #28a745;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: bold;
}

.btn-create:hover {
  background: #218838;
}

.policy-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.edit-link {
  color: #666;
  text-decoration: none;
  font-size: 1.2em;
}

.edit-link:hover {
  color: #007bff;
}
</style>

