import { endOfDay, startOfDay } from 'date-fns'

/** Earliest date used for "whole time" filters (all guild history in admin). */
export const WHOLE_TIME_START = new Date(2020, 0, 1)

export function getWholeTimeRange(end: Date = new Date()) {
  return {
    from: startOfDay(WHOLE_TIME_START),
    to: endOfDay(end)
  }
}
