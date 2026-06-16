import { Sparkles } from 'lucide-react'

import StateLayout from './StateLayout'

const BotNotInGuild = () => {
  return (
    <StateLayout
      Icon={
        <Sparkles className="h-12 w-12 animate-pulse text-primary drop-shadow-lg" />
      }
      titleText="Bot Not In This Guild"
      description="This server does not currently have the bot installed. To access management features for this guild, please reach out to the bot administrator to add it. (Bot is private and only available on invited servers)"
    />
  )
}

export default BotNotInGuild
