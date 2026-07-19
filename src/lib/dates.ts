const WEEKDAY_INDEX = [6, 0, 1, 2, 3, 4, 5] as const
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const [, yearText, monthText, dayText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  date.setHours(0, 0, 0, 0)
  return date
}

export function addCalendarDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + days)
  return next
}

export function countWorkingDays(
  today: Date,
  targetDate: string,
  daysOff: readonly number[],
): number | null {
  const target = parseLocalDate(targetDate)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (!target || target < start) return null

  const off = new Set(daysOff.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))
  const startSerial = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const targetSerial = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
  const inclusiveCalendarDays = Math.round((targetSerial - startSerial) / MILLISECONDS_PER_DAY) + 1
  const fullWeeks = Math.floor(inclusiveCalendarDays / 7)
  const remainder = inclusiveCalendarDays % 7
  let total = fullWeeks * (7 - off.size)
  const firstWeekday = WEEKDAY_INDEX[start.getDay()]
  for (let offset = 0; offset < remainder; offset += 1) {
    if (!off.has((firstWeekday + offset) % 7)) total += 1
  }
  return total
}
