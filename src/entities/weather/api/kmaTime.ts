const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const KMA_VILLAGE_BASE_HOURS = [2, 5, 8, 11, 14, 17, 20, 23]

export const KMA_TIMEZONE_ABBREVIATION = 'KST'

export function getUltraShortNowcastBaseDateTime(now: Date) {
  const kstDate = toKstDate(now)

  if (kstDate.getUTCMinutes() < 40) {
    kstDate.setUTCHours(kstDate.getUTCHours() - 1)
  }

  kstDate.setUTCMinutes(0, 0, 0)
  return kstDate
}

export function getVillageForecastBaseDateTime(now: Date) {
  const kstDate = toKstDate(now)
  const hour = kstDate.getUTCHours()
  const minute = kstDate.getUTCMinutes()
  const availableBaseHour = [...KMA_VILLAGE_BASE_HOURS]
    .reverse()
    .find((baseHour) => hour > baseHour || (hour === baseHour && minute >= 10))

  if (availableBaseHour === undefined) {
    kstDate.setUTCDate(kstDate.getUTCDate() - 1)
    kstDate.setUTCHours(23, 0, 0, 0)
    return kstDate
  }

  kstDate.setUTCHours(availableBaseHour, 0, 0, 0)
  return kstDate
}

export function toKstDate(date: Date) {
  return new Date(date.getTime() + KST_OFFSET_MS)
}

export function getKstCompactDate(date: Date) {
  return [
    String(date.getUTCFullYear()),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('')
}

export function getKstCompactTime(date: Date) {
  return [
    String(date.getUTCHours()).padStart(2, '0'),
    String(date.getUTCMinutes()).padStart(2, '0'),
  ].join('')
}

export function getKstHourTime(date: Date) {
  const kstDate = toKstDate(date)
  return `${String(kstDate.getUTCHours()).padStart(2, '0')}00`
}

export function createOffsetDateTime(compactDate: string, compactTime: string) {
  return `${compactDate.slice(0, 4)}-${compactDate.slice(4, 6)}-${compactDate.slice(6, 8)}T${compactTime.slice(0, 2)}:${compactTime.slice(2, 4)}:00+09:00`
}

export function toHyphenatedDate(compactDate: string) {
  return `${compactDate.slice(0, 4)}-${compactDate.slice(4, 6)}-${compactDate.slice(6, 8)}`
}

export function isDaytime(value: string) {
  const hour = toKstDate(new Date(value)).getUTCHours()
  return hour >= 6 && hour < 18
}
