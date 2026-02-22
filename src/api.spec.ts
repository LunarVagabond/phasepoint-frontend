import { describe, it, expect } from 'vitest'
import {
  AUDIT_EVENT_TYPE_DISPLAY,
  getEventTypeDisplay,
  getAuditEventDisplayText,
  getAuditEventDisplayParts,
  INTAKE_REQUEST_STATUS_DISPLAY,
  getIntakeRequestStatusDisplay,
  getLocationLabel,
  canEditPolicies,
  canEditProcedures,
  INCIDENT_REASON,
  ASSET_LOCATIONS,
  SHIPMENT_DESTINATION_TYPES,
  INTAKE_REQUEST_ASSET_TYPES,
  getApiBaseForRedirect,
} from './api'

describe('AUDIT_EVENT_TYPE_DISPLAY', () => {
  it('has expected event type labels', () => {
    expect(AUDIT_EVENT_TYPE_DISPLAY.INTAKE_REQUEST_CREATED).toBe('Request submitted')
    expect(AUDIT_EVENT_TYPE_DISPLAY.CUSTODY_TRANSFER).toBe('Custody transfer')
    expect(AUDIT_EVENT_TYPE_DISPLAY.SHIPMENT_COMPLETED).toBe('Shipment completed (shipped)')
    expect(AUDIT_EVENT_TYPE_DISPLAY.UNKNOWN).toBe('System event')
  })
})

describe('getEventTypeDisplay', () => {
  it('returns mapped label for known event type', () => {
    expect(getEventTypeDisplay('INTAKE_REQUEST_CREATED')).toBe('Request submitted')
    expect(getEventTypeDisplay('WORK_ORDER_COMPLETED')).toBe('Work order completed')
  })

  it('returns formatted string for unknown event type', () => {
    expect(getEventTypeDisplay('SOME_UNKNOWN_EVENT')).toBe('Some Unknown Event')
  })
})

describe('getAuditEventDisplayText', () => {
  it('returns base label for simple event types', () => {
    expect(getAuditEventDisplayText({ event_type: 'ASSET_INTAKE' })).toBe('Asset received')
    expect(getAuditEventDisplayText({ event_type: 'SHIPMENT_CREATED' })).toBe('Shipment created')
  })

  it('returns custody transfer with from/to locations when both present', () => {
    expect(
      getAuditEventDisplayText({
        event_type: 'CUSTODY_TRANSFER',
        old_value: { location: 'DIRTY_CAGE' },
        new_value: { location: 'WIPE_STATION' },
      })
    ).toBe('Custody Transfer (Dirty Cage → Wipe Station)')
  })

  it('returns custody transfer with only to location', () => {
    expect(
      getAuditEventDisplayText({
        event_type: 'CUSTODY_TRANSFER',
        new_value: { location: 'CLEAN_CAGE' },
      })
    ).toBe('Custody Transfer (→ Clean Cage)')
  })

  it('returns serial/model text for ASSET_SERIAL_MODEL_SET', () => {
    expect(
      getAuditEventDisplayText({
        event_type: 'ASSET_SERIAL_MODEL_SET',
        new_value: { serial_number: 'SN123', manufacturer_model: 'Dell XPS' },
      })
    ).toContain('Serial number')
    expect(
      getAuditEventDisplayText({
        event_type: 'ASSET_SERIAL_MODEL_SET',
        new_value: { serial_number: 'SN123', manufacturer_model: 'Dell XPS' },
      })
    ).toContain('SN123')
  })
})

describe('getAuditEventDisplayParts', () => {
  it('returns null for non-serial event types', () => {
    expect(getAuditEventDisplayParts({ event_type: 'ASSET_INTAKE' })).toBeNull()
  })

  it('returns parts for serial/model change', () => {
    const parts = getAuditEventDisplayParts({
      event_type: 'ASSET_SERIAL_MODEL_UPDATED_BY_INCIDENT',
      old_value: { serial_number: 'OLD', manufacturer_model: 'Old Model' },
      new_value: { serial_number: 'NEW', manufacturer_model: 'New Model' },
    })
    expect(parts).not.toBeNull()
    expect(parts!.length).toBeGreaterThanOrEqual(1)
    expect(parts!.some((p) => p.label === 'Serial number' && p.from === 'OLD' && p.to === 'NEW')).toBe(true)
  })
})

describe('INTAKE_REQUEST_STATUS_DISPLAY', () => {
  it('has expected status labels', () => {
    expect(INTAKE_REQUEST_STATUS_DISPLAY.PENDING).toBe('Processing')
    expect(INTAKE_REQUEST_STATUS_DISPLAY.REJECTED).toBe('Rejected')
    expect(INTAKE_REQUEST_STATUS_DISPLAY.COMPLETED).toBe('Completed')
  })
})

describe('getIntakeRequestStatusDisplay', () => {
  it('returns label for REJECTED, PICKING_UP, RECEIVED, COMPLETED', () => {
    expect(getIntakeRequestStatusDisplay({ status: 'REJECTED' })).toBe('Rejected')
    expect(getIntakeRequestStatusDisplay({ status: 'PICKING_UP' })).toBe('Pickup in progress')
    expect(getIntakeRequestStatusDisplay({ status: 'RECEIVED' })).toBe('Received')
    expect(getIntakeRequestStatusDisplay({ status: 'COMPLETED' })).toBe('Completed')
  })

  it('returns Processing for PENDING and SEEN', () => {
    expect(getIntakeRequestStatusDisplay({ status: 'PENDING' })).toBe('Processing')
    expect(getIntakeRequestStatusDisplay({ status: 'SEEN' })).toBe('Processing')
  })

  it('returns Scheduled for pickup when ACCEPTED + PICKUP + pickup_scheduled_at', () => {
    expect(
      getIntakeRequestStatusDisplay({
        status: 'ACCEPTED',
        delivery_type: 'PICKUP',
        pickup_scheduled_at: '2025-01-15T10:00:00Z',
      })
    ).toBe('Scheduled for pickup')
  })

  it('returns Scheduled for drop-off when ACCEPTED + DROP_OFF + window', () => {
    expect(
      getIntakeRequestStatusDisplay({
        status: 'ACCEPTED',
        delivery_type: 'DROP_OFF',
        drop_off_preferred_start: '2025-01-15T09:00:00Z',
      })
    ).toBe('Scheduled for drop-off')
  })

  it('returns Accepted for ACCEPTED without scheduling', () => {
    expect(getIntakeRequestStatusDisplay({ status: 'ACCEPTED' })).toBe('Accepted')
  })

  it('returns formatted status for unknown status', () => {
    expect(getIntakeRequestStatusDisplay({ status: 'CUSTOM_STATUS' })).toBe('CUSTOM STATUS')
  })
})

describe('getLocationLabel', () => {
  it('returns label for known location code', () => {
    expect(getLocationLabel('WIPE_STATION')).toBe('Wipe Station')
    expect(getLocationLabel('DIRTY_CAGE')).toBe('Dirty Cage')
  })

  it('returns formatted string for unknown code', () => {
    expect(getLocationLabel('SOME_LOCATION')).toBe('SOME LOCATION')
  })
})

describe('canEditPolicies', () => {
  it('returns true when user has operations in groups_display', () => {
    expect(canEditPolicies({ groups_display: ['operations'] } as any)).toBe(true)
    expect(canEditPolicies({ groups_display: ['Operations'] } as any)).toBe(true)
  })

  it('returns false when user has no operations group', () => {
    expect(canEditPolicies({ groups_display: ['customer_relations'] } as any)).toBe(false)
    expect(canEditPolicies(undefined)).toBe(false)
  })
})

describe('canEditProcedures', () => {
  it('returns true when user has operations in groups_display', () => {
    expect(canEditProcedures({ groups_display: ['operations'] } as any)).toBe(true)
  })

  it('returns false when user has no operations group', () => {
    expect(canEditProcedures({ groups_display: [] } as any)).toBe(false)
    expect(canEditProcedures()).toBe(false)
  })
})

describe('INCIDENT_REASON', () => {
  it('has expected reason values', () => {
    expect(INCIDENT_REASON.UPDATE_SERIAL_NUMBER).toBe('UPDATE_SERIAL_NUMBER')
    expect(INCIDENT_REASON.UPDATE_MAKE_MODEL).toBe('UPDATE_MAKE_MODEL')
    expect(INCIDENT_REASON.UPDATE_SERIAL_AND_MODEL).toBe('UPDATE_SERIAL_AND_MODEL')
  })
})

describe('ASSET_LOCATIONS', () => {
  it('includes expected location entries with value and label', () => {
    expect(ASSET_LOCATIONS.some((l) => l.value === 'INTAKE' && l.label === 'Intake')).toBe(true)
    expect(ASSET_LOCATIONS.some((l) => l.value === 'WIPE_STATION' && l.label === 'Wipe Station')).toBe(true)
    expect(ASSET_LOCATIONS.length).toBeGreaterThanOrEqual(5)
  })
})

describe('SHIPMENT_DESTINATION_TYPES', () => {
  it('contains Re-sale, Recycler, Other', () => {
    expect(SHIPMENT_DESTINATION_TYPES).toContain('Re-sale')
    expect(SHIPMENT_DESTINATION_TYPES).toContain('Recycler')
    expect(SHIPMENT_DESTINATION_TYPES).toContain('Other')
    expect(SHIPMENT_DESTINATION_TYPES).toHaveLength(3)
  })
})

describe('INTAKE_REQUEST_ASSET_TYPES', () => {
  it('includes PHONE, LAPTOP, TABLET with labels', () => {
    expect(INTAKE_REQUEST_ASSET_TYPES.some((a) => a.value === 'LAPTOP' && a.label === 'Laptop')).toBe(true)
    expect(INTAKE_REQUEST_ASSET_TYPES.some((a) => a.value === 'PHONE' && a.label === 'Phone')).toBe(true)
    expect(INTAKE_REQUEST_ASSET_TYPES.some((a) => a.value === 'OTHER')).toBe(true)
  })
})

describe('getApiBaseForRedirect', () => {
  it('returns a non-empty string (origin or stripped API URL)', () => {
    const base = getApiBaseForRedirect()
    expect(typeof base).toBe('string')
    expect(base.length).toBeGreaterThan(0)
  })

  it('does not end with /api', () => {
    const base = getApiBaseForRedirect()
    expect(base.endsWith('/api')).toBe(false)
    expect(base.endsWith('/api/')).toBe(false)
  })
})
