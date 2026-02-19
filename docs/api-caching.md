# API Caching Strategy

## Overview

The frontend implements in-memory caching for frequently-called API endpoints to reduce redundant network requests and improve performance.

## Cached Endpoints

### `/api/me/` - User Info
- **TTL**: 5 minutes
- **Why**: User info (username, email, groups, etc.) rarely changes during a session
- **Called**: On every route navigation (router guard) and in many components
- **Impact**: Eliminates duplicate calls when navigating between pages

### `/api/groups/` - Groups List
- **TTL**: 10 minutes
- **Why**: Groups are administrative data that changes very infrequently
- **Impact**: Reduces redundant calls when loading user management forms

### `/api/users/` and `/api/users/?user_type=*` - Users List
- **TTL**: 2 minutes
- **Why**: Users list changes occasionally but not constantly
- **Impact**: Faster loading of user management pages

### `/api/customers/` - Customers List
- **TTL**: 2 minutes
- **Why**: Customers list changes occasionally but not constantly
- **Impact**: Faster loading of customer management pages

## Cache Invalidation

Cache is automatically invalidated when mutations occur:

- **User updates**: Invalidates `/me/` and `/users/` caches
- **Customer updates**: Invalidates `/customers/` cache
- **Profile updates**: Invalidates `/me/` cache
- **Policy acknowledgment**: Invalidates `/me/` cache

## Bypassing Cache

To force fresh data (bypass cache), pass `useCache=false`:

```typescript
// Force fresh user data
const freshUserData = await getMe(false)

// Force fresh customers list
const freshCustomers = await getCustomers(false)
```

## Not Cached (By Design)

These endpoints are intentionally NOT cached because they change frequently:

- `/api/work-orders/` - Work orders change constantly
- `/api/intake-requests/` - Intake requests change frequently
- `/api/assets/` - Assets change frequently
- `/api/shipments/` - Shipments change frequently
- `/api/audit-events/` - Audit events are historical and should be fresh

## Performance Impact

Before caching:
- `/api/me/` called on every route navigation (router guard)
- `/api/me/` called again in DashboardView on mount
- Multiple redundant calls to `/api/groups/`, `/api/users/`, `/api/customers/`

After caching:
- `/api/me/` cached for 5 minutes - only called once per 5 minutes
- Other endpoints cached according to their TTL
- Estimated reduction: 60-80% fewer API calls for cached endpoints

## Implementation

See `src/utils/apiCache.ts` for the cache implementation and `src/api.ts` for cached function implementations.
