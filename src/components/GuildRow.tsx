'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'

import { IGuild } from '@/types/types'

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

const GuildRow = ({ guild }: { guild: IGuild }) => {
  const pathname = usePathname()

  const activeGuildId = pathname.split('/')[3]

  return (
    <a
      href={`/dashboard/g/${guild.id}`}
      className="group flex items-center justify-center overflow-hidden rounded-lg"
    >
      <div
        className={`absolute -left-1 w-2 rounded-r-sm bg-white opacity-0 transition-all duration-200 ${
          activeGuildId === guild.id
            ? 'h-10 opacity-100'
            : 'h-6 group-hover:opacity-100'
        }`}
      />

      <Tooltip>
        <TooltipTrigger asChild>
          {guild.icon ? (
            <Image
              src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
              alt={guild.name}
              className="size-10"
              height={40}
              width={40}
            />
          ) : (
            <div className="flex size-10 items-center justify-center bg-gray-600 text-sm text-white">
              {guild.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </TooltipTrigger>
        <TooltipContent side="right">{guild.name}</TooltipContent>
      </Tooltip>
    </a>
  )
}

export default GuildRow
