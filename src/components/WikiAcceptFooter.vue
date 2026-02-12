<template>
  <footer class="wiki-accept-footer">
    <div class="footer-actions">
      <button type="button" class="print-btn" @click="handlePrint">
        Print Policy Doc
      </button>
    </div>
    <label class="accept-check">
      <input :checked="accepted" type="checkbox" @change="$emit('update:accepted', ($event.target as HTMLInputElement).checked)" />
      I have read and accept all policies listed above.
    </label>
    <button type="button" class="accept-btn" :disabled="!accepted || loading" @click="$emit('submit')">
      {{ loading ? 'Submitting…' : 'Submit acknowledgment' }}
    </button>
    <p v-if="error" class="error">{{ error }}</p>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getPolicyPrint } from '../api'

defineProps<{
  accepted: boolean
  loading: boolean
  error: string
}>()

defineEmits<{
  'update:accepted': [value: boolean]
  submit: []
}>()

const printing = ref(false)
const printError = ref('')

async function handlePrint() {
  if (printing.value) return
  printing.value = true
  printError.value = ''
  
  try {
    const html = await getPolicyPrint()
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Failed to open print window. Please allow popups.')
    }
    printWindow.document.write(html)
    printWindow.document.close()
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printing.value = false
      }, 250)
    }
  } catch (e) {
    printError.value = e instanceof Error ? e.message : 'Failed to generate print document'
    printing.value = false
  }
}
</script>

