import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_PROFILE_PREFERENCES,
  LANDING_SECTION_OPTIONS,
  getProfilePreferencesServerSnapshot,
  getProfilePreferencesSnapshot,
  persistProfilePreferences,
  subscribeToProfilePreferences,
  useProfilePreferences
} from '@/lib/preferences/profilePreferences'

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useSyncExternalStore: (
      _subscribe: () => () => void,
      getSnapshot: () => unknown
    ) => getSnapshot()
  }
})

const STORAGE_KEY = 'admin-profile-preferences'

function storageEvent(key: string | null): Event {
  const event = new Event('storage') as Event & { key: string | null }
  event.key = key
  return event
}

function createMemoryStorage(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    }
  }
}

describe('profilePreferences', () => {
  let storage: Storage

  beforeEach(() => {
    storage = createMemoryStorage()
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    })
    persistProfilePreferences({ ...DEFAULT_PROFILE_PREFERENCES })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('excludes development sections from landing options', () => {
    expect(LANDING_SECTION_OPTIONS.some((o) => o.id.startsWith('dev'))).toBe(
      false
    )
    expect(LANDING_SECTION_OPTIONS[0]).toEqual({
      id: 'overview',
      label: 'Overview'
    })
  })

  it('returns defaults when storage is empty', () => {
    storage.removeItem(STORAGE_KEY)
    expect(getProfilePreferencesSnapshot()).toEqual(DEFAULT_PROFILE_PREFERENCES)
  })

  it('returns server snapshot defaults', () => {
    expect(getProfilePreferencesServerSnapshot()).toEqual(
      DEFAULT_PROFILE_PREFERENCES
    )
  })

  it('persists and reads valid preferences', () => {
    persistProfilePreferences({
      theme: 'dark',
      tableDensity: 'compact',
      landingSection: 'users',
      reduceMotion: true,
      richToasts: false,
      toastPosition: 'top-left'
    })

    expect(getProfilePreferencesSnapshot()).toEqual({
      theme: 'dark',
      tableDensity: 'compact',
      landingSection: 'users',
      reduceMotion: true,
      richToasts: false,
      toastPosition: 'top-left'
    })
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!)).toEqual({
      theme: 'dark',
      tableDensity: 'compact',
      landingSection: 'users',
      reduceMotion: true,
      richToasts: false,
      toastPosition: 'top-left'
    })
  })

  it('returns the same snapshot reference when unchanged', () => {
    const first = getProfilePreferencesSnapshot()
    const second = getProfilePreferencesSnapshot()
    expect(first).toBe(second)
  })

  it('keeps valid fields and defaults invalid ones', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        theme: 'light',
        tableDensity: 'huge',
        landingSection: 'transactions',
        reduceMotion: true,
        richToasts: 'yes',
        toastPosition: 'middle'
      })
    )

    expect(getProfilePreferencesSnapshot()).toEqual({
      theme: 'light',
      tableDensity: 'comfortable',
      landingSection: 'transactions',
      reduceMotion: true,
      richToasts: true,
      toastPosition: 'bottom-right'
    })
  })

  it('normalizes fully invalid stored values', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        theme: 'neon',
        tableDensity: 'huge',
        landingSection: 'dev',
        reduceMotion: 'no',
        richToasts: 1,
        toastPosition: 'center'
      })
    )

    expect(getProfilePreferencesSnapshot()).toEqual(DEFAULT_PROFILE_PREFERENCES)
  })

  it('falls back when stored JSON is not a plain object', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify(['dark']))
    expect(getProfilePreferencesSnapshot()).toEqual(DEFAULT_PROFILE_PREFERENCES)

    storage.setItem(STORAGE_KEY, 'null')
    expect(getProfilePreferencesSnapshot()).toEqual(DEFAULT_PROFILE_PREFERENCES)

    storage.setItem(STORAGE_KEY, JSON.stringify('dark'))
    expect(getProfilePreferencesSnapshot()).toEqual(DEFAULT_PROFILE_PREFERENCES)
  })

  it('falls back when stored JSON is invalid', () => {
    storage.setItem(STORAGE_KEY, '{not-json')
    expect(getProfilePreferencesSnapshot()).toEqual(DEFAULT_PROFILE_PREFERENCES)
  })

  it('falls back when getItem throws', () => {
    vi.spyOn(storage, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })

    expect(getProfilePreferencesSnapshot()).toEqual(DEFAULT_PROFILE_PREFERENCES)
  })

  it('ignores setItem failures', () => {
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })

    expect(() => persistProfilePreferences({ theme: 'light' })).not.toThrow()
  })

  it('notifies subscribers on persist and storage events', () => {
    const listeners = new Map<string, Set<EventListener>>()

    const addEventListener = vi.fn(
      (type: string, listener: EventListenerOrEventListenerObject) => {
        const handler =
          typeof listener === 'function' ? listener : listener.handleEvent
        const set = listeners.get(type) ?? new Set()
        set.add(handler)
        listeners.set(type, set)
      }
    )
    const removeEventListener = vi.fn(
      (type: string, listener: EventListenerOrEventListenerObject) => {
        const handler =
          typeof listener === 'function' ? listener : listener.handleEvent
        listeners.get(type)?.delete(handler)
      }
    )

    vi.stubGlobal('window', {
      addEventListener,
      removeEventListener,
      dispatchEvent: (event: Event) => {
        listeners.get(event.type)?.forEach((handler) => handler(event))
        return true
      }
    })

    const listener = vi.fn()
    const unsubscribe = subscribeToProfilePreferences(listener)

    persistProfilePreferences({ theme: 'light' })
    expect(listener).toHaveBeenCalledTimes(1)

    window.dispatchEvent(storageEvent(STORAGE_KEY))
    expect(listener).toHaveBeenCalledTimes(2)

    window.dispatchEvent(storageEvent('other-key'))
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    persistProfilePreferences({ theme: 'dark' })
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('useProfilePreferences returns snapshot and persist', () => {
    persistProfilePreferences({ theme: 'light', tableDensity: 'compact' })

    const result = useProfilePreferences()
    expect(result.preferences).toEqual({
      theme: 'light',
      tableDensity: 'compact',
      landingSection: 'overview',
      reduceMotion: false,
      richToasts: true,
      toastPosition: 'bottom-right'
    })
    expect(result.persist).toBe(persistProfilePreferences)
  })
})
