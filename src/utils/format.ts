/**
 * Format utilities for displaying IDs and other values.
 */

/**
 * Format a UUID for display - truncate to first 8 characters for tables,
 * full ID available in detail views.
 */
export function formatAssetId(id: string, full = false): string {
  if (!id) return '—'
  if (full) return id
  return id.slice(0, 8)
}
