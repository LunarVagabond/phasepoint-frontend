<template>
  <div class="app-layout">
    <SiteHeader :policy-only="false" />
    <EnvironmentBanner />
    <main class="app-main app-footer-padding">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { provide, ref, type Ref } from 'vue'
import AppFooter from '../components/AppFooter.vue'
import EnvironmentBanner from '../components/EnvironmentBanner.vue'
import SiteHeader from '../components/SiteHeader.vue'

// Provide pageTitle for SiteHeader (used by PolicyWikiLayout, but needed here for non-policy pages)
const pageTitle = ref('')
provide<Ref<string>>('pageTitle', pageTitle)
</script>

