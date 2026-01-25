import { ColumnDef } from '@tanstack/react-table'
import { CircleQuestionMark } from 'lucide-react'

import Image from 'next/image'

import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { TVipChannels } from '@/types/types'

export const vipColumns: ColumnDef<TVipChannels>[] = [
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
        <span className="text-xs text-neutral-500 line-clamp-1">
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
        {row.getValue('username')}
        <br />
        <span className="text-xs text-neutral-500">
          ({row.original.ownerId})
        </span>
      </p>
    )
  },
  {
    header: 'Nickname',
    accessorKey: 'nickname',
    size: 80,
    cell: ({ row }) => row.getValue('nickname')
  },
  {
    header: 'Members',
    accessorKey: 'members',
    size: 70,
    cell: ({ row }) => {
      const members = row.getValue('members') as TVipChannels['members']

      return (
        <span className="flex justify-start items-center">
          <span>{members.length}</span>
          {members.length > 0 ? (
            <Tooltip>
              <TooltipTrigger className="ml-2 text-gray-400 transition hover:text-gray-600">
                <CircleQuestionMark size={16} />
              </TooltipTrigger>
              <TooltipContent>
                <ScrollArea className="h-fit p-1">
                  {members.map((member, index) => (
                    <p key={index} className="text-sm flex items-center gap-2">
                      <Image
                        className="rounded-full"
                        width={20}
                        height={20}
                        alt={member.username}
                        src={member.avatar}
                      />{' '}
                      <span>
                        {member.username} ({member.nickname || 'No nickname'})
                      </span>
                    </p>
                  ))}
                </ScrollArea>
              </TooltipContent>
            </Tooltip>
          ) : (
            <p className="text-sm italic">No members</p>
          )}
        </span>
      )
    }
  },
  {
    header: 'Created At',
    accessorKey: 'createdAt',
    size: 100,
    enableSorting: false,
    enableColumnFilter: false,
    cell: ({ row }) => {
      const dateString = row.getValue('createdAt') as string | null
      return dateString ? new Date(dateString).toLocaleDateString('cs') : '-'
    }
  },
  {
    header: 'Expires At',
    accessorKey: 'expiresAt',
    size: 100,
    enableSorting: false,
    enableColumnFilter: false,
    cell: ({ row }) => {
      const dateString = row.getValue('expiresAt') as string | null
      return dateString ? new Date(dateString).toLocaleDateString('cs') : '-'
    }
  }
  // {
  //   id: 'actions',
  //   header: 'Actions',
  //   size: 60,
  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   cell: ({ row }) => <Menu />
  //   // <RowActions
  //   //   row={row}
  //   //   guildId={guildId}
  //   //   managerId={managerId}
  //   //   setData={setData}
  //   // />
  // }
]
