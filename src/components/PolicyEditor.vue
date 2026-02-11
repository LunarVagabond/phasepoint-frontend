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

<style scoped>
.policy-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  height: 100%;
  min-height: 500px;
}

.editor-left,
.editor-right {
  display: flex;
  flex-direction: column;
}

.editor-label {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 0.9em;
  color: #666;
}

.editor-textarea {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
  line-height: 1.6;
}

.editor-textarea:focus {
  outline: none;
  border-color: #007bff;
}

.editor-textarea[readonly] {
  background: #f5f5f5;
  cursor: not-allowed;
}

.editor-preview {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  overflow-y: auto;
  color: #333;
}

.editor-preview :deep(.markdown-body) {
  color: #333;
}

.editor-preview :deep(.markdown-body h1),
.editor-preview :deep(.markdown-body h2),
.editor-preview :deep(.markdown-body h3),
.editor-preview :deep(.markdown-body h4),
.editor-preview :deep(.markdown-body h5),
.editor-preview :deep(.markdown-body h6) {
  color: #222;
  font-weight: 600;
}

.editor-preview :deep(.markdown-body p),
.editor-preview :deep(.markdown-body li),
.editor-preview :deep(.markdown-body td),
.editor-preview :deep(.markdown-body th) {
  color: #333;
}

@media (max-width: 768px) {
  .editor-split {
    grid-template-columns: 1fr;
  }
}
</style>
