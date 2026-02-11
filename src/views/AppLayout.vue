<template>
  <div class="app-layout">
    <SiteHeader :policy-only="false" />
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { provide, ref, type Ref } from 'vue'
import SiteHeader from '../components/SiteHeader.vue'

// Provide pageTitle for SiteHeader (used by PolicyWikiLayout, but needed here for non-policy pages)
const pageTitle = ref('')
provide<Ref<string>>('pageTitle', pageTitle)
</script>

