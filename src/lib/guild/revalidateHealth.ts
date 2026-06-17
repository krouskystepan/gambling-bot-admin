import { revalidatePath } from 'next/cache'

/** Refreshes sidebar health badge and overview health link after ops/setup changes. */
export const revalidateGuildHealth = (guildId: string) => {
  revalidatePath(`/dashboard/g/${guildId}`, 'layout')
}
