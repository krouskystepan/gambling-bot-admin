import LoadFailed from '@/components/states/LoadFailed'
import RateLimited from '@/components/states/RateLimmited'

export function guildPageDenial(options?: { rateLimited?: boolean }) {
  return options?.rateLimited ? <RateLimited /> : <LoadFailed />
}
