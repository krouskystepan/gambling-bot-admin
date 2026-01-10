import { Sparkles } from 'lucide-react'

import StateLayout from './StateLayout'

const BotNotInGuild = () => {
  return (
    <StateLayout
      Icon={
        <Sparkles className="animate-spin-slower h-12 w-12 text-yellow-400 drop-shadow-lg" />
      }
      titleText="Bot Not In This Guild"
      titleStyle="bg-linear-to-r from-yellow-300 via-yellow-500 to-yellow-300 bg-clip-text text-transparent animate-gradient-x"
      description="This server does not currently have the bot installed. To access management features for this guild, please reach out to the bot administrator to add it. (Bot is private and only available on invited servers)"
    />
  )
}

export default BotNotInGuild
