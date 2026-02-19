<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <span class="app-footer__copyright">© {{ year }} Phasepoint, a product of ITAD IT LLC. All rights reserved.</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>
