export const PREVIEW_DAYS = 60

type PreviewDay = {
  day: number
  reward: number
  base: number
  weekly: number
  monthly: number
  isReset: boolean
}

type GeneratePreviewInput = {
  base: number
  increment: number
  multiplier: number
  max: number
  weeklyMilestone: number
  monthlyMilestone: number
  rewardMode: 'linear' | 'exponential'
  resetOnMax: boolean
  days: number
}

export const generateBonusPreview = ({
  base,
  increment,
  multiplier,
  max,
  weeklyMilestone,
  monthlyMilestone,
  rewardMode,
  resetOnMax,
  days
}: GeneratePreviewInput): PreviewDay[] => {
  const result: PreviewDay[] = []
  let streak = 1

  for (let day = 1; day <= days; day++) {
    let reward =
      rewardMode === 'linear'
        ? base + (streak - 1) * increment
        : base * Math.pow(multiplier, streak - 1)

    const isWeekly = day % 7 === 0
    const isMonthly = day % 28 === 0

    let milestone = 0
    if (isWeekly) milestone += weeklyMilestone
    if (isMonthly) milestone += monthlyMilestone

    let isReset = false

    if (max > 0 && reward > max) {
      if (resetOnMax) {
        reward = base
        streak = 1
        isReset = true
      } else {
        reward = max
      }
    }

    result.push({
      day,
      reward: Number((reward + milestone).toFixed(2)),
      base: Number(reward.toFixed(2)),
      weekly: isWeekly ? weeklyMilestone : 0,
      monthly: isMonthly ? monthlyMilestone : 0,
      isReset
    })

    streak++
  }

  return result
}
