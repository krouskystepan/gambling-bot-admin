import type {
  UserProfileBanHistoryEntry,
  UserProfileStaffNote
} from '@/actions/database/userProfile.action'
import { Badge } from '@/components/ui/badge'

type UserProfileModerationSectionProps = {
  staffNotes: UserProfileStaffNote[]
  banHistory: UserProfileBanHistoryEntry[]
  banned: boolean
}

const UserProfileModerationSection = ({
  staffNotes,
  banHistory,
  banned
}: UserProfileModerationSectionProps) => {
  const showNotes = staffNotes.length > 0
  const showBanHistory = banned || banHistory.length > 0

  if (!showNotes && !showBanHistory) {
    return null
  }

  return (
    <div
      className={
        showNotes && showBanHistory
          ? 'grid gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-2'
          : 'rounded-lg border bg-muted/20 p-4'
      }
    >
      {showNotes ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Staff notes</p>
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {staffNotes.map((note, index) => (
              <div
                key={`${note.authorId}-${note.createdAt.toString()}-${index}`}
                className="rounded-md border bg-background px-3 py-2"
              >
                <p className="text-sm">{note.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {note.authorUsername ?? note.authorId} ·{' '}
                  {new Date(note.createdAt).toLocaleString('cs')}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {showBanHistory ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Ban history</p>
          {banHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Currently banned. No prior history recorded.
            </p>
          ) : (
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {banHistory.map((entry, index) => (
                <div
                  key={`${entry.bannedAt.toString()}-${index}`}
                  className="rounded-md border bg-background px-3 py-2"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={entry.unbannedAt ? 'secondary' : 'destructive'}
                      className="px-2"
                    >
                      {entry.unbannedAt ? 'Ended' : 'Active'}
                    </Badge>
                    {entry.reason ? (
                      <span className="text-xs text-muted-foreground">
                        {entry.reason}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm">
                    {new Date(entry.bannedAt).toLocaleString('cs')} by{' '}
                    {entry.bannedByUsername ?? entry.bannedBy}
                  </p>
                  {entry.unbannedAt ? (
                    <p className="text-xs text-muted-foreground">
                      Unbanned {new Date(entry.unbannedAt).toLocaleString('cs')}{' '}
                      by {entry.unbannedByUsername ?? entry.unbannedBy}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default UserProfileModerationSection
