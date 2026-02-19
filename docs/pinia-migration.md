# Pinia Migration Guide

## Overview

We've migrated from a simple in-memory cache to Pinia for better state management. Pinia provides:
- **Reactive state** that components can watch
- **Better TypeScript support**
- **Vue DevTools integration** for debugging
- **Persistent state** across navigation
- **More maintainable** code structure

## Installation

```bash
npm install pinia
```

## Stores Created

### 1. `auth` Store (`src/stores/auth.ts`)
Manages current user state and authentication.

**Usage:**
```typescript
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Access user
const user = authStore.user

// Fetch user (uses cache if fresh)
await authStore.fetchUser()

// Force refresh
await authStore.fetchUser(true)

// Clear on logout
authStore.clearUser()
```

**Reactive properties:**
- `user` - Current user data
- `loading` - Loading state
- `isAuthenticated` - Computed boolean
- `isEmployee` - Computed boolean
- `isCustomer` - Computed boolean
- `needsPolicyAccept` - Computed boolean

### 2. `apiCache` Store (`src/stores/apiCache.ts`)
Caches frequently-used API responses (customers, users, groups).

**Usage:**
```typescript
import { useApiCacheStore } from '@/stores/apiCache'

const cacheStore = useApiCacheStore()

// Check cache
const cachedCustomers = cacheStore.getCustomers()
if (cachedCustomers) {
  // Use cached data
} else {
  // Fetch fresh data
  const customers = await getCustomers()
  cacheStore.setCustomers(customers)
}

// Invalidate cache after mutations
cacheStore.invalidateCustomers()
```

## Composable: `useAuth()`

A convenience composable that auto-fetches user on mount:

```vue
<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { user, isAuthenticated, isEmployee } = useAuth()
// User is automatically fetched if not already loaded
</script>
```

## Component: `AuthProvider`

A wrapper component that ensures user is loaded before rendering children:

```vue
<template>
  <AuthProvider>
    <YourAuthenticatedContent />
  </AuthProvider>
</template>
```

## Migration Steps

### 1. Update API functions to use stores

**Before:**
```typescript
const me = await getMe()
```

**After:**
```typescript
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
await authStore.fetchUser()
const me = authStore.user
```

### 2. Update components using `getMe()`

**Before:**
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMe } from '@/api'

const me = ref(null)
onMounted(async () => {
  me.value = await getMe()
})
</script>
```

**After:**
```vue
<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { user: me } = useAuth()
// Automatically fetched on mount
</script>
```

### 3. Update router guard

The router guard has been updated to use the auth store instead of direct API calls.

### 4. Update mutation functions

After mutations, update the store:

```typescript
// After updating user profile
await updateEmployeeProfile(data)
authStore.fetchUser(true) // Force refresh

// After creating customer
await createCustomer(data)
cacheStore.invalidateCustomers()
```

## Benefits

1. **Single source of truth** - User state is managed in one place
2. **Automatic reactivity** - Components automatically update when user changes
3. **Better performance** - Cache is shared across all components
4. **Easier debugging** - Vue DevTools shows all state
5. **Type safety** - Full TypeScript support

## Next Steps

1. Migrate components to use `useAuth()` composable
2. Update API mutation functions to invalidate store caches
3. Consider adding more stores for other shared state (work orders, assets, etc.)
