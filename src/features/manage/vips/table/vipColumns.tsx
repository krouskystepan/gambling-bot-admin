import { ColumnDef } from '@tanstack/react-table'
import { CircleQuestionMark } from 'lucide-react'

import Image from 'next/image'
import Link from 'next/link'

import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { formatOptionalText } from '@/lib/table/formatOptionalText'
import { createHiddenFilterColumn } from '@/lib/table/manualFilterColumn'
import { TVipChannels } from '@/types/types'

import { type GuildMemberOption } from './GuildMemberCombobox'
import VipActionsMenu from './VipActionsMenu'

export const vipColumns = (
  guildId: string,
  maxMembers: number,
  members: GuildMemberOption[],
  vipFeatureBlocked: boolean,
  vipFeatureBlockMessage: string | null
): ColumnDef<TVipChannels>[] => [
  createHiddenFilterColumn<TVipChannels>('search'),
  createHiddenFilterColumn<TVipChannels>('userId'),
  {
    header: 'Image',
    accessorKey: 'avatar',
    enableSorting: false,
    enableColumnFilter: false,
    size: 60,
    cell: ({ row }) => (
      <Image
        className="ml-2 rounded-full"
        width={36}
        height={36}
        alt={row.getValue('username')}
        src={row.getValue('avatar')}
      />
    )
  },
  {
    header: 'Channel Name',
    accessorKey: 'channelName',
    size: 140,
    cell: ({ row }) => (
      <p>
        {row.getValue('channelName')}
        <br />
        <span className="text-xs text-muted-foreground line-clamp-1">
          ({row.original.channelId})
        </span>
      </p>
    )
  },
  {
    header: 'Username',
    accessorKey: 'username',
    size: 160,
    cell: ({ row }) => (
      <p>
        <Link
          href={`/dashboard/g/${guildId}/users/${row.original.ownerId}`}
          className="font-medium hover:text-primary hover:underline"
        >
          {row.getValue('username')}
        </Link>
        <br />
        <span className="text-xs text-muted-foreground">
          ({row.original.ownerId})
        </span>
      </p>
    )
  },
  {
    header: 'Nickname',
    accessorKey: 'nickname',
    size: 80,
    cell: ({ row }) => formatOptionalText(row.original.nickname)
  },
  {
    header: 'Members',
    accessorKey: 'members',
    size: 70,
    cell: ({ row }) => {
      const members = row.getValue('members') as TVipChannels['members']

      return (
        <span className="flex items-center justify-start">
          {members.length > 0 ? (
            <>
              <span>{members.length}</span>
              <Tooltip>
                <TooltipTrigger className="ml-2 text-muted-foreground transition hover:text-foreground">
                  <CircleQuestionMark size={16} />
                </TooltipTrigger>
                <TooltipContent>
                  <ScrollArea className="h-fit p-1">
                    {members.map((member) => (
                      <Link
                        key={member.userId}
                        href={`/dashboard/g/${guildId}/users/${member.userId}`}
                        className="flex items-center gap-2 text-sm hover:text-primary"
                      >
                        <Image
                          className="rounded-full"
                          width={20}
                          height={20}
                          alt={member.username}
                          src={member.avatar}
                        />
                        <span>
                          {member.username} ({member.nickname || 'No nickname'})
                        </span>
                      </Link>
                    ))}
                  </ScrollArea>
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <span className="text-sm italic text-muted-foreground">
              No members
            </span>
          )}
        </span>
      )
    }
  },
  {
    header: 'Created At',
    accessorKey: 'createdAt',
    size: 100,
    cell: ({ row }) => {
      const dateString = row.getValue('createdAt') as string | null
      return dateString ? new Date(dateString).toLocaleDateString('cs') : '-'
    }
  },
  {
    header: 'Expires At',
    accessorKey: 'expiresAt',
    size: 100,
    cell: ({ row }) => {
      const dateString = row.getValue('expiresAt') as string | null
      return dateString ? new Date(dateString).toLocaleDateString('cs') : '-'
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 60,
    enableSorting: false,
    cell: ({ row }) => (
      <VipActionsMenu
        guildId={guildId}
        vip={row.original}
        maxMembers={maxMembers}
        members={members}
        vipFeatureBlocked={vipFeatureBlocked}
        vipFeatureBlockMessage={vipFeatureBlockMessage}
      />
    )
  }
]
