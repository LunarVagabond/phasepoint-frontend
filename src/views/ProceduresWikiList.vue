<template>
  <div class="wiki-list">
    <div v-if="canEdit" class="admin-actions">
      <router-link :to="{ name: 'ProcedureEditor' }" class="btn-create">
        Create New Procedure
      </router-link>
    </div>
    <p class="intro">
      Select a procedure below or from the sidebar to read it. These guides walk you through processes from customer
      asset pickup/dropoff through to disposal, recycle, and resale.
    </p>
    <ul class="policy-list">
      <li v-for="p in procedures" :key="p.id" class="policy-item">
        <router-link :to="{ name: 'ProcedureDetail', params: { slug: p.slug } }">
          {{ p.name }} (v{{ p.version }})
        </router-link>
        <router-link
          v-if="canEdit"
          :to="{ name: 'ProcedureEditor', params: { slug: p.slug } }"
          class="edit-link"
          title="Edit procedure"
        >
          ✏️
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref, onMounted, type Ref } from 'vue'
import { getMe, canEditProcedures } from '../api'
import type { ProcedureSummary } from '../api'

const proceduresRef = inject<Ref<ProcedureSummary[]>>('procedures')
const procedures = computed(() => proceduresRef?.value ?? [])
const me = ref<Awaited<ReturnType<typeof getMe>> | null>(null)
const canEdit = computed(() => (me.value ? canEditProcedures(me.value) : false))

onMounted(async () => {
  try {
    const { getMe } = await import('../api')
    me.value = await getMe()
  } catch {
    me.value = null
  }
})
</script>
