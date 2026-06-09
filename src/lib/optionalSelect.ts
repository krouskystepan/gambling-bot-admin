export const SELECT_NONE_VALUE = '__none__' as const

export const toSelectValue = (stored: string | undefined) =>
  stored ? stored : SELECT_NONE_VALUE

export const fromSelectValue = (selected: string) =>
  selected === SELECT_NONE_VALUE ? '' : selected
