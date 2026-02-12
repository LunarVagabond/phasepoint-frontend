<template>
  <aside class="policy-sidebar doc-sidebar" :class="sidebarClass">
    <section v-if="showItems" class="section">
      <h2 class="section-title">{{ sectionTitle }}</h2>
      <ul class="policy-list">
        <li class="policy-item-all">
          <router-link :to="{ name: allRouteName }" active-class="active" class="policy-link-all">
            <strong>{{ allLabel }}</strong>
          </router-link>
        </li>
        <li v-if="showEditActions" class="policy-item-drafts">
          <router-link :to="{ name: draftsRouteName }" active-class="active" class="policy-link-drafts">
            <strong>Drafts</strong>
          </router-link>
        </li>
        <li v-for="group in groupedItems" :key="group.slug" class="policy-item">
          <div v-if="group.versions.length > 1" class="policy-group">
            <div class="policy-group-row">
              <router-link
                :to="{ name: detailRouteName, params: { slug: group.slug } }"
                active-class="active"
                class="policy-link-main"
              >
                {{ group.name }}
              </router-link>
              <button
                type="button"
                @click="toggleVersionDropdown(group.slug)"
                class="version-toggle"
                :aria-expanded="expandedGroups.has(group.slug)"
              >
                {{ expandedGroups.has(group.slug) ? '▼' : '▶' }}
              </button>
            </div>
            <ul v-if="expandedGroups.has(group.slug)" class="version-list">
              <li v-for="v in group.versions.slice(0, 5)" :key="v.version">
                <router-link
                  :to="{ name: detailRouteName, params: { slug: group.slug }, query: { v: v.version } }"
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
            :to="{ name: detailRouteName, params: { slug: group.slug } }"
            active-class="active"
          >
            {{ group.name }}
          </router-link>
        </li>
        <li v-if="showEditActions && showItems" class="policy-item-separator">
          <div class="separator"></div>
          <router-link :to="{ name: editorRouteName }" class="policy-create-link">
            {{ createLabel }}
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
        <li v-if="showEditActions && currentSlug" class="toc-item-separator">
          <div class="separator"></div>
          <router-link :to="{ name: editorRouteName, params: { slug: currentSlug } }" class="toc-edit-link">
            <span class="edit-icon">✏️</span> {{ editLabel }}
          </router-link>
        </li>
      </ul>
      <div v-else-if="showEditActions && currentSlug" class="toc-empty-edit">
        <router-link :to="{ name: editorRouteName, params: { slug: currentSlug } }" class="toc-edit-link">
          <span class="edit-icon">✏️</span> {{ editLabel }}
        </router-link>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { PolicySummary, PolicyVersion } from '../api'
import type { ProcedureSummary, ProcedureVersion } from '../api'

export interface TocItem {
  id: string
  text: string
  level: number
}

type DocItem = PolicySummary | ProcedureSummary
type DocVersion = PolicyVersion | ProcedureVersion

const props = withDefaults(
  defineProps<{
    docType: 'policy' | 'procedure'
    items: DocItem[]
    toc: TocItem[]
    versions?: DocVersion[]
    showItems?: boolean
    showToc?: boolean
    side?: 'left' | 'right'
    canEdit?: boolean
    currentSlug?: string | null
    needsPolicyAccept?: boolean
  }>(),
  { showItems: true, showToc: true, side: 'right', versions: () => [], canEdit: false, currentSlug: null, needsPolicyAccept: false }
)

const route = useRoute()
const expandedGroups = ref<Set<string>>(new Set())

const sidebarClass = computed(() => `policy-sidebar--${props.side}`)
const showEditActions = computed(() =>
  props.docType === 'policy' ? props.canEdit && !props.needsPolicyAccept : props.canEdit
)

const sectionTitle = computed(() => (props.docType === 'policy' ? 'Policies' : 'Procedures'))
const allLabel = computed(() => (props.docType === 'policy' ? 'All Policies' : 'All Procedures'))
const createLabel = computed(() =>
  props.docType === 'policy' ? '+ Create New Policy' : '+ Create New Procedure'
)
const editLabel = computed(() =>
  props.docType === 'policy' ? 'Edit This Policy' : 'Edit This Procedure'
)

const allRouteName = computed(() => (props.docType === 'policy' ? 'AllPolicies' : 'AllProcedures'))
const draftsRouteName = computed(() => (props.docType === 'policy' ? 'PolicyDrafts' : 'ProcedureDrafts'))
const detailRouteName = computed(() => (props.docType === 'policy' ? 'PolicyDetail' : 'ProcedureDetail'))
const editorRouteName = computed(() => (props.docType === 'policy' ? 'PolicyEditor' : 'ProcedureEditor'))

interface ItemGroup {
  slug: string
  name: string
  versions: DocVersion[]
}

const groupedItems = computed<ItemGroup[]>(() => {
  const groups = new Map<string, ItemGroup>()
  for (const item of props.items) {
    if (!groups.has(item.slug)) {
      groups.set(item.slug, { slug: item.slug, name: item.name, versions: [] })
    }
  }
  if (props.versions && props.versions.length > 0) {
    for (const v of props.versions) {
      const group = groups.get(v.slug)
      if (group) group.versions.push(v)
    }
    for (const group of groups.values()) {
      group.versions.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
    }
  } else {
    for (const item of props.items) {
      const group = groups.get(item.slug)
      if (group) {
        group.versions.push({
          id: item.id,
          slug: item.slug,
          version: item.version,
          effective_date: item.effective_date,
          status: item.status,
          created_at: '',
        } as DocVersion)
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

const currentSlugParam = computed(() => route.params.slug as string)
watch(
  [currentSlugParam, groupedItems],
  ([slug, groups]) => {
    if (slug && Array.isArray(groups)) {
      const group = (groups as ItemGroup[]).find((g) => g.slug === slug)
      if (group && group.versions.length > 1) {
        expandedGroups.value.add(slug)
      }
    }
  },
  { immediate: true }
)
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
