<template>
  <div class="policy-editor">
    <div class="editor-split">
      <div class="editor-left">
        <label v-if="!readonly" class="editor-label">Markdown Editor</label>
        <textarea
          :value="modelValue"
          @input="handleInput"
          :readonly="readonly"
          class="editor-textarea"
          placeholder="Enter policy content in Markdown..."
        />
      </div>
      <div class="editor-right">
        <label v-if="!readonly" class="editor-label">Live Preview</label>
        <div class="editor-preview">
          <MarkdownContent :content="modelValue || ''" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownContent from './MarkdownContent.vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    readonly?: boolean
  }>(),
  { readonly: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>
