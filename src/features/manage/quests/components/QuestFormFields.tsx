'use client'

import { CASINO_GAME_IDS, type CasinoGameId } from 'gambling-bot-shared/casino'
import {
  QUEST_CONDITION_TYPES,
  QUEST_KINDS,
  type QuestConditionType,
  type QuestKind,
  getAllowedConditionTypesForKind
} from 'gambling-bot-shared/quests'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const CONDITION_TYPE_LABELS: Record<QuestConditionType, string> = {
  casino_wins: 'Casino wins',
  casino_bets: 'Casino bets',
  casino_winnings: 'Casino winnings',
  net_profit: 'Net profit',
  bonus_claims: 'Bonus claims',
  bonus_streak: 'Daily bonus claim streak',
  vip_purchase: 'VIP purchase'
}

const GAME_CONDITION_TYPES = new Set<QuestConditionType>([
  'casino_wins',
  'casino_bets',
  'casino_winnings'
])

export type QuestFormState = {
  name: string
  description: string
  kind: QuestKind
  conditionType: QuestConditionType
  threshold: string
  game: CasinoGameId | ''
  rewardAmount: string
  enabled: boolean
  sortOrder: string
}

export const defaultQuestFormState = (): QuestFormState => ({
  name: '',
  description: '',
  kind: 'daily',
  conditionType: 'casino_bets',
  threshold: '1',
  game: '',
  rewardAmount: '0',
  enabled: true,
  sortOrder: '0'
})

export const questToFormState = (quest: {
  name: string
  description: string
  kind: QuestKind
  condition: {
    type: QuestConditionType
    threshold: number
    game?: CasinoGameId
  }
  rewardAmount: number
  enabled: boolean
  sortOrder: number
}): QuestFormState => ({
  name: quest.name,
  description: quest.description,
  kind: quest.kind,
  conditionType: quest.condition.type,
  threshold: String(quest.condition.threshold),
  game: quest.condition.game ?? '',
  rewardAmount: String(quest.rewardAmount),
  enabled: quest.enabled,
  sortOrder: String(quest.sortOrder)
})

type QuestFormFieldsProps = {
  values: QuestFormState
  onChange: (values: QuestFormState) => void
  idPrefix?: string
}

const QuestFormFields = ({
  values,
  onChange,
  idPrefix = 'quest'
}: QuestFormFieldsProps) => {
  const allowedTypes = getAllowedConditionTypesForKind(values.kind)
  const showGameField = GAME_CONDITION_TYPES.has(values.conditionType)

  const setField = <K extends keyof QuestFormState>(
    key: K,
    value: QuestFormState[K]
  ) => {
    onChange({ ...values, [key]: value })
  }

  const handleKindChange = (kind: QuestKind) => {
    const nextAllowed = getAllowedConditionTypesForKind(kind)
    const nextType = nextAllowed.includes(values.conditionType)
      ? values.conditionType
      : nextAllowed[0]

    onChange({
      ...values,
      kind,
      conditionType: nextType,
      game: GAME_CONDITION_TYPES.has(nextType) ? values.game : ''
    })
  }

  const handleConditionTypeChange = (conditionType: QuestConditionType) => {
    onChange({
      ...values,
      conditionType,
      game: GAME_CONDITION_TYPES.has(conditionType) ? values.game : ''
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={values.name}
          onChange={(event) => setField('name', event.target.value)}
          placeholder="Quest name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <textarea
          id={`${idPrefix}-description`}
          value={values.description}
          onChange={(event) => setField('description', event.target.value)}
          placeholder="Optional description shown to players"
          rows={3}
          className={cn(
            'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-kind`}>Kind</Label>
          <Select value={values.kind} onValueChange={handleKindChange}>
            <SelectTrigger id={`${idPrefix}-kind`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUEST_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind} className="capitalize">
                  {kind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-sort-order`}>Sort order</Label>
          <Input
            id={`${idPrefix}-sort-order`}
            type="number"
            min={0}
            value={values.sortOrder}
            onChange={(event) => setField('sortOrder', event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-condition-type`}>Condition type</Label>
          <Select
            value={values.conditionType}
            onValueChange={(value) =>
              handleConditionTypeChange(value as QuestConditionType)
            }
          >
            <SelectTrigger id={`${idPrefix}-condition-type`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {CONDITION_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-threshold`}>Threshold</Label>
          <Input
            id={`${idPrefix}-threshold`}
            type="number"
            min={1}
            value={values.threshold}
            onChange={(event) => setField('threshold', event.target.value)}
          />
        </div>
      </div>

      {showGameField ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-game`}>Game filter (optional)</Label>
          <Select
            value={values.game || 'any'}
            onValueChange={(value) =>
              setField('game', value === 'any' ? '' : (value as CasinoGameId))
            }
          >
            <SelectTrigger id={`${idPrefix}-game`}>
              <SelectValue placeholder="Any game" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any game</SelectItem>
              {CASINO_GAME_IDS.map((gameId) => (
                <SelectItem key={gameId} value={gameId} className="capitalize">
                  {gameId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-reward`}>Reward amount</Label>
        <Input
          id={`${idPrefix}-reward`}
          type="number"
          min={0}
          value={values.rewardAmount}
          onChange={(event) => setField('rewardAmount', event.target.value)}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor={`${idPrefix}-enabled`}>Enabled</Label>
          <p className="text-xs text-muted-foreground">
            Disabled quests stay in the list but do not grant rewards.
          </p>
        </div>
        <Switch
          id={`${idPrefix}-enabled`}
          checked={values.enabled}
          onCheckedChange={(checked) => setField('enabled', checked)}
        />
      </div>
    </div>
  )
}

export default QuestFormFields

export const parseQuestFormValues = (values: QuestFormState) => {
  const threshold = Number(values.threshold)
  const rewardAmount = Number(values.rewardAmount)
  const sortOrder = Number(values.sortOrder)

  return {
    name: values.name.trim(),
    description: values.description.trim(),
    kind: values.kind,
    condition: {
      type: values.conditionType,
      threshold,
      ...(values.game ? { game: values.game } : {})
    },
    rewardAmount,
    enabled: values.enabled,
    sortOrder
  }
}

export const isQuestFormValid = (values: QuestFormState): boolean => {
  if (!values.name.trim()) return false

  const threshold = Number(values.threshold)
  const rewardAmount = Number(values.rewardAmount)
  const sortOrder = Number(values.sortOrder)

  if (!Number.isInteger(threshold) || threshold < 1) return false
  if (!Number.isFinite(rewardAmount) || rewardAmount < 0) return false
  if (!Number.isInteger(sortOrder) || sortOrder < 0) return false
  if (!QUEST_CONDITION_TYPES.includes(values.conditionType)) return false
  if (
    !getAllowedConditionTypesForKind(values.kind).includes(values.conditionType)
  ) {
    return false
  }

  return true
}
