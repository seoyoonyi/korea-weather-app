import type { HourlyWeatherForecast } from '@/entities/weather/model/types'

export function getTodayHourlyTemperatures(hourly: HourlyWeatherForecast[], date?: string) {
  if (!date) {
    return hourly.slice(0, 24)
  }

  return hourly.filter((item) => item.time.startsWith(date)).slice(0, 24)
}

export function formatHour(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(new Date(value))
}

export function formatDateTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(new Date(value))
}
