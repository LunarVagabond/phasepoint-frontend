/**
 * API and fetch mocks for unit tests.
 */
import { vi } from 'vitest'
import type { MeResponse } from '@/api'

export function mockFetch() {
  return vi.mocked(fetch)
}

/** Reset and mock getMe to return a specific user */
export function mockGetMe(me: MeResponse | null) {
  const f = vi.mocked(fetch)
  f.mockResolvedValueOnce({
    ok: me !== null,
    json: () => Promise.resolve(me),
  } as Response)
}

/** Mock getMe to throw (network error) */
export function mockGetMeFailure() {
  vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
}

/** Mock successful JSON response for any URL */
export function mockJsonResponse<T>(data: T, ok = true) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response)
}

/** Mock failed response with status */
export function mockFailureResponse(status: number, body?: string) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: false,
    status,
    text: () => Promise.resolve(body ?? ''),
    json: () => Promise.reject(new Error('Not JSON')),
  } as Response)
}

/** Stub the entire api module's getMe (for store tests that import api) */
export function createGetMeStub(returnValue: MeResponse | null) {
  return vi.fn().mockResolvedValue(returnValue)
}
