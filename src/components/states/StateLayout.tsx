import React from 'react'

interface StateLayoutProps {
  Icon: React.ReactNode
  titleText: string
  titleStyle: string
  description: string
  button?: React.ReactNode
}

const StateLayout = ({
  Icon,
  titleText,
  titleStyle,
  description,
  button
}: StateLayoutProps) => {
  return (
    <div className="min-h-full flex size-full flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      {Icon}

      <h1 className={`text-4xl font-extrabold ${titleStyle}`}>{titleText}</h1>

      <p className="max-w-sm text-gray-300">{description}</p>

      {button ? button : null}
    </div>
  )
}

export default StateLayout
