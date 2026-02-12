<template>
  <aside class="policy-sidebar procedure-sidebar" :class="sidebarClass">
    <section v-if="showProcedures" class="section">
      <h2 class="section-title">Procedures</h2>
      <ul class="policy-list">
        <li class="policy-item-all">
          <router-link :to="{ name: 'AllProcedures' }" active-class="active" class="policy-link-all">
            <strong>All Procedures</strong>
          </router-link>
        </li>
        <li v-if="showEditActions" class="policy-item-drafts">
          <router-link :to="{ name: 'ProcedureDrafts' }" active-class="active" class="policy-link-drafts">
            <strong>Drafts</strong>
          </router-link>
        </li>
        <li v-for="procGroup in groupedProcedures" :key="procGroup.slug" class="policy-item">
          <div v-if="procGroup.versions.length > 1" class="policy-group">
            <div class="policy-group-row">
              <router-link
                :to="{ name: 'ProcedureDetail', params: { slug: procGroup.slug } }"
                active-class="active"
                class="policy-link-main"
              >
                {{ procGroup.name }}
              </router-link>
              <button
                type="button"
                @click="toggleVersionDropdown(procGroup.slug)"
                class="version-toggle"
                :aria-expanded="expandedGroups.has(procGroup.slug)"
              >
                {{ expandedGroups.has(procGroup.slug) ? '▼' : '▶' }}
              </button>
            </div>
            <ul v-if="expandedGroups.has(procGroup.slug)" class="version-list">
              <li v-for="v in procGroup.versions.slice(0, 5)" :key="v.version">
                <router-link
                  :to="{ name: 'ProcedureDetail', params: { slug: procGroup.slug }, query: { v: v.version } }"
                  active-class="active"
                  class="version-link"
                  :class="{ 'version-current': v.status === 'active' }"
                >
                  v{{ v.version }}
                </router-link>
              </li>
            </ul>
          </div>
          <router-link
            v-else
            :to="{ name: 'ProcedureDetail', params: { slug: procGroup.slug } }"
            active-class="active"
          >
            {{ procGroup.name }}
          </router-link>
        </li>
        <li v-if="showEditActions && showProcedures" class="policy-item-separator">
          <div class="separator"></div>
          <router-link :to="{ name: 'ProcedureEditor' }" class="policy-create-link">
            + Create New Procedure
          </router-link>
        </li>
      </ul>
    </section>
    <section v-if="showToc" class="section">
      <h2 class="section-title">On this page</h2>
      <ul v-if="toc.length > 0" class="toc-list">
        <li v-for="item in toc" :key="item.id" :style="{ paddingLeft: (item.level - 1) * 12 + 8 + 'px' }">
          <a :href="'#' + item.id" class="toc-link">{{ item.text }}</a>
        </li>
        <li v-if="showEditActions && currentProcedureSlug" class="toc-item-separator">
          <div class="separator"></div>
          <router-link :to="{ name: 'ProcedureEditor', params: { slug: currentProcedureSlug } }" class="toc-edit-link">
            <span class="edit-icon">✏️</span> Edit This Procedure
          </router-link>
        </li>
      </ul>
      <div v-else-if="showEditActions && currentProcedureSlug" class="toc-empty-edit">
        <router-link :to="{ name: 'ProcedureEditor', params: { slug: currentProcedureSlug } }" class="toc-edit-link">
          <span class="edit-icon">✏️</span> Edit This Procedure
        </router-link>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { ProcedureSummary, ProcedureVersion } from '../api'

export interface TocItem {
  id: string
  text: string
  level: number
}

const props = withDefaults(
  defineProps<{
    procedures: ProcedureSummary[]
    toc: TocItem[]
    versions?: ProcedureVersion[]
    showProcedures?: boolean
    showToc?: boolean
    side?: 'left' | 'right'
    canEdit?: boolean
    currentProcedureSlug?: string | null
  }>(),
  { showProcedures: true, showToc: true, side: 'right', versions: () => [], canEdit: false, currentProcedureSlug: null }
)

const route = useRoute()
const expandedGroups = ref<Set<string>>(new Set())

const sidebarClass = computed(() => `policy-sidebar--${props.side}`)
const showEditActions = computed(() => props.canEdit)

interface ProcedureGroup {
  slug: string
  name: string
  versions: ProcedureVersion[]
}

const groupedProcedures = computed<ProcedureGroup[]>(() => {
  const groups = new Map<string, ProcedureGroup>()
  for (const proc of props.procedures) {
    if (!groups.has(proc.slug)) {
      groups.set(proc.slug, {
        slug: proc.slug,
        name: proc.name,
        versions: [],
      })
    }
  }
  if (props.versions && props.versions.length > 0) {
    for (const version of props.versions) {
      const group = groups.get(version.slug)
      if (group) {
        group.versions.push(version)
      }
    }
    for (const group of groups.values()) {
      group.versions.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
    }
  } else {
    for (const proc of props.procedures) {
      const group = groups.get(proc.slug)
      if (group) {
        group.versions.push({
          id: proc.id,
          slug: proc.slug,
          version: proc.version,
          effective_date: proc.effective_date,
          status: proc.status,
          created_at: '',
        })
      }
    }
  }
  return Array.from(groups.values())
})

function toggleVersionDropdown(slug: string) {
  if (expandedGroups.value.has(slug)) {
    expandedGroups.value.delete(slug)
  } else {
    expandedGroups.value.add(slug)
  }
}

const currentSlug = computed(() => route.params.slug as string)
if (currentSlug.value) {
  const group = groupedProcedures.value.find((g) => g.slug === currentSlug.value)
  if (group && group.versions.length > 1) {
    expandedGroups.value.add(currentSlug.value)
  }
}
</script>

<style scoped>
.policy-item-all,
.policy-item-drafts {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.policy-link-all,
.policy-link-drafts {
  font-weight: bold;
}

.policy-item {
  margin-bottom: 4px;
}

.policy-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.policy-group-row {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
}

.policy-link-main {
  flex: 0 1 auto;
  min-width: 0;
}

.version-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  font-size: 0.8em;
  color: #666;
  margin-left: 4px;
}

.version-list {
  list-style: none;
  padding-left: 16px;
  margin-top: 4px;
}

.version-link {
  display: block;
  padding: 2px 0;
  font-size: 0.9em;
  color: #666;
}

.version-link.active,
.version-link.version-current {
  font-weight: bold;
  color: inherit;
}

.policy-item-separator,
.toc-item-separator {
  margin-top: 16px;
  padding-top: 16px;
}

.separator {
  height: 1px;
  background: var(--color-border);
  margin-bottom: 12px;
}

.policy-create-link {
  display: block;
  padding: 8px 0;
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
}

.policy-create-link:hover {
  background: var(--color-border);
  text-decoration: none;
}

.toc-edit-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  color: var(--color-primary);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.15s, color 0.15s;
}

.toc-edit-link:hover {
  background: var(--color-border);
  text-decoration: none;
}

.edit-icon {
  font-size: 1em;
}

.toc-empty-edit {
  margin-top: 16px;
}
</style>
