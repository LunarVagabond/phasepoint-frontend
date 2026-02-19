<template>
  <div class="markdown-body" v-html="safeHtml" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { slugify } from '../utils/slugify'

const props = withDefaults(
  defineProps<{
    content: string
    stripTopHeading?: boolean
  }>(),
  { stripTopHeading: false }
)

/** Strip YAML frontmatter (--- ... ---) from the start of content. */
function stripFrontmatter(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('---')) return trimmed
  const rest = trimmed.slice(3)
  const end = rest.indexOf('---')
  if (end === -1) return trimmed
  return rest.slice(end + 3).trim()
}

/** Add id attributes to h1, h2, h3 in HTML string. */
function addHeadingIds(html: string): string {
  return html.replace(
    /<h([123])>([^<]*)<\/h\1>/gi,
    (_, level: string, inner: string) => {
      const id = slugify(inner) || `heading-${Math.random().toString(36).slice(2, 9)}`
      return `<h${level} id="${id}">${inner}</h${level}>`
    }
  )
}

const safeHtml = computed(() => {
  let body = stripFrontmatter(props.content || '')
  
  // Remove top-level heading (h1) if requested
  if (props.stripTopHeading) {
    body = body.replace(/^#\s+.+$/m, '').trim()
  }
  
  const rawHtml = marked(body, { async: false }) as string
  const withIds = addHeadingIds(rawHtml)
  return DOMPurify.sanitize(withIds, { ADD_ATTR: ['id'] })
})
</script>

