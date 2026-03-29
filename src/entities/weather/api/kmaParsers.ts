import type { DailyWeatherForecast, HourlyWeatherForecast } from '@/entities/weather/model/types'
import {
  type CurrentObservation,
  type ForecastPoint,
  type KmaNowcastItem,
  type KmaVillageForecastItem,
  type ParsedVillageForecast,
} from '@/entities/weather/api/kmaTypes'
import {
  createOffsetDateTime,
  getKstCompactDate,
  toHyphenatedDate,
  toKstDate,
} from '@/entities/weather/api/kmaTime'
import { deriveWeatherCode } from '@/entities/weather/api/kmaWeather'

export function parseCurrentObservation(items: KmaNowcastItem[]): CurrentObservation {
  const categories = new Map(items.map((item) => [item.category, item]))
  const sampleItem = items[0]

  return {
    time: sampleItem ? createOffsetDateTime(sampleItem.baseDate, sampleItem.baseTime) : '',
    temperature: getNumericKmaValue(categories.get('T1H')?.obsrValue),
    windSpeed: getNumericKmaValue(categories.get('WSD')?.obsrValue),
    precipitationType: getNumericKmaValue(categories.get('PTY')?.obsrValue),
  }
}

export function parseVillageForecast(
  items: KmaVillageForecastItem[],
  now: Date,
): ParsedVillageForecast {
  const availableDates = Array.from(
    new Set(
      items
        .map((item) => item.fcstDate)
        .filter((fcstDate): fcstDate is string => fcstDate.length === 8),
    ),
  ).sort()
  const todayDate = getKstCompactDate(toKstDate(now))
  const targetDate = availableDates.includes(todayDate) ? todayDate : (availableDates[0] ?? todayDate)
  const pointsByTime = new Map<string, ForecastPoint>()

  let temperatureMin: number | null = null
  let temperatureMax: number | null = null
  let precipitationProbabilityMax = 0

  for (const item of items) {
    if (item.fcstDate !== targetDate) {
      continue
    }

    const numericValue = getNumericKmaValue(item.fcstValue)

    if (item.category === 'TMN' && numericValue !== null) {
      temperatureMin = numericValue
      continue
    }

    if (item.category === 'TMX' && numericValue !== null) {
      temperatureMax = numericValue
      continue
    }

    const point = getOrCreateForecastPoint(pointsByTime, item.fcstDate, item.fcstTime)

    switch (item.category) {
      case 'TMP':
        point.temperature = numericValue
        break
      case 'POP':
        point.precipitationProbability = numericValue
        precipitationProbabilityMax = Math.max(precipitationProbabilityMax, numericValue ?? 0)
        break
      case 'SKY':
        point.sky = numericValue
        break
      case 'PTY':
        point.precipitationType = numericValue
        break
      case 'LGT':
        point.lightning = numericValue
        break
      case 'WSD':
        point.windSpeed = numericValue
        break
      default:
        break
    }
  }

  const sortedPoints = Array.from(pointsByTime.values()).sort((left, right) =>
    left.time.localeCompare(right.time),
  )
  const hourly = sortedPoints
    .filter((point) => point.temperature !== null)
    .map((point) => ({
      time: point.time,
      temperature: point.temperature ?? 0,
    }))

  const fallbackTemperatures = hourly.map((item) => item.temperature)
  const resolvedTemperatureMin =
    temperatureMin ?? (fallbackTemperatures.length > 0 ? Math.min(...fallbackTemperatures) : null)
  const resolvedTemperatureMax =
    temperatureMax ?? (fallbackTemperatures.length > 0 ? Math.max(...fallbackTemperatures) : null)
  const representativePoint =
    getRepresentativeForecastPoint(sortedPoints) ?? sortedPoints[0] ?? null
  const date = toHyphenatedDate(targetDate)

  return {
    daily:
      resolvedTemperatureMin !== null && resolvedTemperatureMax !== null
        ? [
            {
              date,
              weatherCode: deriveWeatherCode({
                precipitationType: representativePoint?.precipitationType ?? null,
                sky: representativePoint?.sky ?? null,
                lightning: representativePoint?.lightning ?? null,
              }),
              temperatureMax: resolvedTemperatureMax,
              temperatureMin: resolvedTemperatureMin,
              precipitationProbabilityMax,
            },
          ]
        : [],
    hourly,
    points: sortedPoints,
  }
}

export function getNearestForecastPoint(points: ForecastPoint[], referenceTime: string) {
  if (points.length === 0) {
    return null
  }

  const referenceTimestamp = new Date(referenceTime).getTime()

  if (!Number.isFinite(referenceTimestamp)) {
    return points[0]
  }

  return points.reduce((bestPoint, point) => {
    const pointDistance = Math.abs(new Date(point.time).getTime() - referenceTimestamp)
    const bestDistance = Math.abs(new Date(bestPoint.time).getTime() - referenceTimestamp)

    return pointDistance < bestDistance ? point : bestPoint
  }, points[0])
}

export function buildFallbackDailyForecast(hourly: HourlyWeatherForecast[], now: Date): DailyWeatherForecast | null {
  if (hourly.length === 0) {
    return null
  }

  const temperatures = hourly.map((item) => item.temperature)

  return {
    date: toHyphenatedDate(getKstCompactDate(toKstDate(now))),
    weatherCode: 1,
    temperatureMax: Math.max(...temperatures),
    temperatureMin: Math.min(...temperatures),
    precipitationProbabilityMax: 0,
  }
}

function getOrCreateForecastPoint(
  pointsByTime: Map<string, ForecastPoint>,
  date: string,
  time: string,
) {
  const key = `${date}${time}`
  const existingPoint = pointsByTime.get(key)

  if (existingPoint) {
    return existingPoint
  }

  const nextPoint: ForecastPoint = {
    time: createOffsetDateTime(date, time),
    temperature: null,
    precipitationProbability: null,
    sky: null,
    precipitationType: null,
    lightning: null,
    windSpeed: null,
  }

  pointsByTime.set(key, nextPoint)
  return nextPoint
}

function getRepresentativeForecastPoint(points: ForecastPoint[]) {
  const noonPoint = points.find((point) => point.time.includes('T12:00:00+09:00'))

  if (noonPoint) {
    return noonPoint
  }

  return points.find((point) => point.time.includes('T15:00:00+09:00')) ?? null
}

function getNumericKmaValue(value?: string) {
  if (value === undefined) {
    return null
  }

  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : null
}
