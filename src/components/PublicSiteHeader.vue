<template>
  <header class="site-header public-site-header">
    <router-link to="/" class="brand">Phasepoint</router-link>
    <nav class="nav nav-right">
      <details class="menu-dropdown">
        <summary>Customer</summary>
        <div class="menu-list">
          <router-link to="/customer/register" active-class="active">Register</router-link>
          <router-link to="/customer/login" active-class="active">Login</router-link>
        </div>
      </details>
      <details class="menu-dropdown">
        <summary>Employee</summary>
        <div class="menu-list">
          <router-link to="/employee-portal/login" active-class="active">Login</router-link>
        </div>
      </details>
    </nav>
  </header>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<style scoped lang="scss">
.public-site-header {
  position: sticky;
  top: 0;
}

.public-site-header {
  grid-template-columns: auto 1fr;
}

.menu-dropdown {
  position: relative;
}

.menu-dropdown summary {
  list-style: none;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  user-select: none;
}

.menu-dropdown summary:hover {
  background: var(--color-border);
}

.menu-dropdown[open] summary {
  background: rgba(var(--color-primary-rgb, 37, 99, 235), 0.1);
  color: var(--color-primary);
}

.menu-list {
  position: absolute;
  right: 0;
  top: calc(100% + 0.25rem);
  min-width: 10rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow: var(--shadow-md);
  padding: 0.25rem;
  display: flex;
  flex-direction: column;
  z-index: 20;
}

.menu-list a {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  text-decoration: none;
  color: var(--color-text);
}

.menu-list a:hover {
  background: var(--color-border);
}

.menu-list a.active {
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb, 37, 99, 235), 0.1);
}
</style>
