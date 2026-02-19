<template>
  <header ref="headerRef" class="site-header public-site-header">
    <router-link to="/" class="brand">
      <img src="/GoITADLogo.svg" alt="Phasepoint" class="brand-logo" />
      <span class="brand-text">Phasepoint</span>
    </router-link>
    <button type="button" class="mobile-menu-toggle" :aria-expanded="isMobileMenuOpen" aria-label="Toggle navigation menu" @click.stop="toggleMobileMenu">
      <svg v-if="!isMobileMenuOpen" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    <nav class="nav nav-right" :class="{ 'mobile-open': isMobileMenuOpen }">
      <div class="mobile-menu-header">
        <h2 class="mobile-menu-title">Menu</h2>
        <button type="button" class="mobile-menu-close" aria-label="Close menu" @click.stop="closeMobileMenu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <router-link to="/about" class="nav-link nav-item" active-class="active">About</router-link>
      <router-link to="/services" class="nav-link nav-item" active-class="active">Services</router-link>
      <router-link to="/compliance" class="nav-link nav-item" active-class="active">Compliance</router-link>
      <router-link to="/resources" class="nav-link nav-item" active-class="active">Resources</router-link>
      <router-link to="/contact" class="nav-link nav-item" active-class="active">Contact</router-link>
      <router-link to="/customer/register" class="nav-link nav-item" active-class="active">Register</router-link>
      <router-link to="/login" class="nav-link nav-item" active-class="active">Login</router-link>
      <button type="button" class="theme-toggle nav-item" :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">
        <svg v-if="theme === 'dark'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '../composables/useTheme'

defineProps<{ title?: string }>()

const { theme, toggleTheme } = useTheme()
const route = useRoute()
const headerRef = ref<HTMLElement | null>(null)
const isMobileMenuOpen = ref(false)

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

function onDocumentClick(e: MouseEvent) {
  const target = e.target as Node
  if (headerRef.value && !headerRef.value.contains(target)) {
    isMobileMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})

// Close menu on route change
watch(
  () => route.path,
  () => {
    isMobileMenuOpen.value = false
  }
)
</script>

<style scoped lang="scss">
@use '../styles/variables' as *;

.public-site-header {
  position: sticky;
  top: 0;
  grid-template-columns: auto 1fr auto;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-logo {
  height: 2rem;
  width: auto;
  display: block;
}

.brand-text {
  font-weight: 600;
  font-size: var(--font-size-xl, 1.25rem);
  color: var(--color-text);
}

.nav-link {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  text-decoration: none;
  color: var(--color-text);
  font-size: var(--font-size-sm, 0.875rem);
}

.nav-link:hover {
  background: var(--color-border);
  text-decoration: none;
}

.nav-link.active {
  color: var(--color-primary);
  font-weight: 500;
  background: rgba(var(--color-primary-rgb, 22, 163, 74), 0.12);
}

// Mobile menu toggle button
.mobile-menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  
  &:hover {
    background: var(--color-border);
  }
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
}

// Mobile menu header with close button
.mobile-menu-header {
  display: none;
}

// Mobile responsive styles
@media (max-width: 1023px) {
  .public-site-header {
    grid-template-columns: auto 1fr auto;
    gap: $space-4;
  }
  
  .mobile-menu-toggle {
    display: flex;
  }
  
  .mobile-menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: $space-6;
    margin-bottom: $space-4;
    border-bottom: 2px solid var(--color-border);
  }
  
  .mobile-menu-title {
    margin: 0;
    font-size: $font-size-xl;
    font-weight: 600;
    color: var(--color-text);
  }
  
  .mobile-menu-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: $radius-md;
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    
    &:hover {
      background: var(--color-border);
    }
    
    svg {
      width: 1.25rem;
      height: 1.25rem;
    }
  }
  
  .nav-right {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--color-surface);
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    padding: $space-6;
    gap: $space-2;
    z-index: 9999;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
    
    &.mobile-open {
      transform: translateX(0);
    }
  }
  
  .nav-right > * {
    width: 100%;
  }
  
  // Mobile nav items - button-like styling
  .nav-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: $space-4;
    margin-bottom: $space-2;
    border: 1px solid var(--color-border);
    border-radius: $radius-md;
    background: var(--color-surface);
    color: var(--color-text);
    font-size: $font-size-base;
    text-decoration: none;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    cursor: pointer;
    
    &:hover {
      background: var(--color-background);
      border-color: var(--color-primary);
      text-decoration: none;
    }
    
    &.active {
      background: rgba(var(--color-primary-rgb, 22, 163, 74), 0.1);
      border-color: var(--color-primary);
      color: var(--color-primary);
      font-weight: 500;
    }
  }
  
  .nav-link {
    width: 100%;
    text-align: left;
  }
  
  .theme-toggle {
    width: 100%;
    height: auto;
    padding: $space-4;
    justify-content: space-between;
    border-radius: $radius-md;
    
    svg {
      width: 1.25rem;
      height: 1.25rem;
    }
  }
}

@media (max-width: 767px) {
  .public-site-header {
    padding: $space-3 $space-4;
  }
  
  .brand-logo {
    height: 1.5rem;
  }
  
  .brand-text {
    font-size: $font-size-lg;
  }
}
</style>
