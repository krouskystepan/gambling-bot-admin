import { DEFAULT_GUILD_CONFIG_OPEN_SECTIONS } from '@/components/shell/guild-config/guildConfigSidebarLinks'

const SIDEBAR_SECTIONS_STORAGE_KEY = 'guild-config-sidebar-sections'

type SidebarSectionsListener = () => void

let sidebarSectionsListeners: SidebarSectionsListener[] = []

export const subscribeToSidebarSections = (
  listener: SidebarSectionsListener
) => {
  sidebarSectionsListeners = [...sidebarSectionsListeners, listener]

  const onStorage = (event: StorageEvent) => {
    if (event.key === SIDEBAR_SECTIONS_STORAGE_KEY) {
      listener()
    }
  }

  window.addEventListener('storage', onStorage)

  return () => {
    sidebarSectionsListeners = sidebarSectionsListeners.filter(
      (item) => item !== listener
    )
    window.removeEventListener('storage', onStorage)
  }
}

const notifySidebarSectionsChange = () => {
  sidebarSectionsListeners.forEach((listener) => listener())
}

const readStoredOpenSections = (): string[] => {
  try {
    const raw = localStorage.getItem(SIDEBAR_SECTIONS_STORAGE_KEY)
    if (!raw) return [...DEFAULT_GUILD_CONFIG_OPEN_SECTIONS]

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [...DEFAULT_GUILD_CONFIG_OPEN_SECTIONS]

    return parsed.filter(
      (value): value is string =>
        typeof value === 'string' &&
        (DEFAULT_GUILD_CONFIG_OPEN_SECTIONS as readonly string[]).includes(
          value
        )
    )
  } catch {
    return [...DEFAULT_GUILD_CONFIG_OPEN_SECTIONS]
  }
}

const serializeOpenSections = (sections: string[]) => sections.join(',')

export const parseOpenSections = (serialized: string): string[] =>
  serialized === '' ? [] : serialized.split(',')

export const getSidebarSectionsSnapshot = () =>
  serializeOpenSections(readStoredOpenSections())

export const getSidebarSectionsServerSnapshot = () =>
  serializeOpenSections([...DEFAULT_GUILD_CONFIG_OPEN_SECTIONS])

export const persistOpenSections = (sections: string[]) => {
  try {
    localStorage.setItem(SIDEBAR_SECTIONS_STORAGE_KEY, JSON.stringify(sections))
  } catch {
    // Ignore quota or private-mode storage errors.
  }

  notifySidebarSectionsChange()
}
