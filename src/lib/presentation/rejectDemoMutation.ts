import 'server-only'

import { isDemoGuild } from '@/lib/presentation/presentationMode'

export const DEMO_MUTATION_MESSAGE =
  'Presentation mode — sample data. Changes are disabled in this demo.'

export type DemoMutationRejection = {
  success: false
  message: string
  rateLimited?: false
}

/**
 * Defense-in-depth guard for write server actions that return a result object.
 * Returns a `{ success: false }` rejection for the demo guild; otherwise `null`
 * so the real logic proceeds unchanged.
 */
export function rejectDemoMutation(
  guildId: string
): DemoMutationRejection | null {
  if (isDemoGuild(guildId)) {
    return { success: false, message: DEMO_MUTATION_MESSAGE }
  }
  return null
}

/**
 * Variant for mutation actions that signal failure by throwing (e.g. settings
 * saves) rather than returning a result object.
 */
export function assertNotDemoMutation(guildId: string): void {
  if (isDemoGuild(guildId)) {
    throw new Error(DEMO_MUTATION_MESSAGE)
  }
}
