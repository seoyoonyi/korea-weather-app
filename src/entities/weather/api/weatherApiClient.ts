import {
  DEFAULT_WEATHER_TIMEZONE,
  KMA_ULTRA_SHORT_NOWCAST_API_URL,
  KMA_VILLAGE_FORECAST_API_URL,
} from '@/shared/config/api'
import type {
  GetWeatherForecastParams,
  WeatherForecast,
} from '@/entities/weather/model/types'
import { buildFallbackDailyForecast, getNearestForecastPoint, parseCurrentObservation, parseVillageForecast } from '@/entities/weather/api/kmaParsers'
import { fetchKmaItems, getKmaServiceKey } from '@/entities/weather/api/kmaRequest'
import {
  createOffsetDateTime,
  getKstCompactDate,
  getKstHourTime,
  getUltraShortNowcastBaseDateTime,
  getVillageForecastBaseDateTime,
  isDaytime,
  KMA_TIMEZONE_ABBREVIATION,
  toKstDate,
} from '@/entities/weather/api/kmaTime'
import type { KmaNowcastItem, KmaVillageForecastItem } from '@/entities/weather/api/kmaTypes'
import { deriveWeatherCode, toKilometersPerHour } from '@/entities/weather/api/kmaWeather'
import { toKmaGrid } from '@/shared/lib/kmaGrid'

type GetWeatherForecastOptions = {
  signal?: AbortSignal
}

export async function getWeatherForecast(
  params: GetWeatherForecastParams,
  options: GetWeatherForecastOptions = {},
): Promise<WeatherForecast> {
  validateCoordinates(params)

  const serviceKey = getKmaServiceKey()
  const grid = toKmaGrid(params.latitude, params.longitude)
  const now = new Date()

  const [nowcastItems, villageForecastItems] = await Promise.all([
    fetchKmaItems<KmaNowcastItem>({
      endpoint: KMA_ULTRA_SHORT_NOWCAST_API_URL,
      grid,
      requestDateTime: getUltraShortNowcastBaseDateTime(now),
      serviceKey,
      signal: options.signal,
    }),
    fetchKmaItems<KmaVillageForecastItem>({
      endpoint: KMA_VILLAGE_FORECAST_API_URL,
      grid,
      requestDateTime: getVillageForecastBaseDateTime(now),
      serviceKey,
      signal: options.signal,
    }),
  ])

  const currentObservation = parseCurrentObservation(nowcastItems)
  const parsedVillageForecast = parseVillageForecast(villageForecastItems, now)
  const currentForecastPoint = getNearestForecastPoint(
    parsedVillageForecast.points,
    currentObservation.time,
  )

  const currentTemperature =
    currentObservation.temperature ?? currentForecastPoint?.temperature ?? null
  const currentWindSpeed =
    currentObservation.windSpeed ?? currentForecastPoint?.windSpeed ?? null

  if (currentTemperature === null) {
    throw new Error('기상청 예보에서 현재 기온을 찾지 못했습니다.')
  }

  const currentTime =
    currentObservation.time ||
    currentForecastPoint?.time ||
    createOffsetDateTime(getKstCompactDate(toKstDate(now)), getKstHourTime(now))
  const currentWeatherCode = deriveWeatherCode({
    precipitationType:
      currentObservation.precipitationType ?? currentForecastPoint?.precipitationType ?? null,
    sky: currentForecastPoint?.sky ?? null,
    lightning: currentForecastPoint?.lightning ?? null,
  })
  const todayForecast =
    parsedVillageForecast.daily[0] ?? buildFallbackDailyForecast(parsedVillageForecast.hourly, now)
  const timezone = params.timezone ?? DEFAULT_WEATHER_TIMEZONE

  return {
    location: {
      latitude: params.latitude,
      longitude: params.longitude,
      timezone,
      timezoneAbbreviation: KMA_TIMEZONE_ABBREVIATION,
    },
    current: {
      time: currentTime,
      temperature: currentTemperature,
      apparentTemperature: currentTemperature,
      isDay: isDaytime(currentTime),
      weatherCode: currentWeatherCode,
      windSpeed: currentWindSpeed === null ? 0 : toKilometersPerHour(currentWindSpeed),
    },
    daily: todayForecast ? [todayForecast] : [],
    hourly: parsedVillageForecast.hourly,
  }
}

function validateCoordinates({ latitude, longitude }: GetWeatherForecastParams) {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('latitude는 -90에서 90 사이의 숫자여야 합니다.')
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('longitude는 -180에서 180 사이의 숫자여야 합니다.')
  }
}
