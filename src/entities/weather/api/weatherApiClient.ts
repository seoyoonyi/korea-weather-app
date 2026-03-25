import {
  DEFAULT_FORECAST_DAYS,
  DEFAULT_WEATHER_TIMEZONE,
  OPEN_METEO_FORECAST_API_URL,
} from '@/shared/config/api'
import type {
  DailyWeatherForecast,
  GetWeatherForecastParams,
  HourlyWeatherForecast,
  WeatherForecast,
} from '@/entities/weather/model/types'

const CURRENT_WEATHER_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'is_day',
  'weather_code',
  'wind_speed_10m',
] as const

const DAILY_WEATHER_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_probability_max',
] as const

const HOURLY_WEATHER_FIELDS = ['temperature_2m'] as const

type OpenMeteoForecastResponse = {
  latitude: number
  longitude: number
  timezone: string
  timezone_abbreviation: string
  current: {
    time: string
    temperature_2m: number
    apparent_temperature: number
    is_day: number
    weather_code: number
    wind_speed_10m: number
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
  }
}

type ApiErrorResponse = {
  error?: boolean
  reason?: string
}

type GetWeatherForecastOptions = {
  signal?: AbortSignal
}

export async function getWeatherForecast(
  params: GetWeatherForecastParams,
  options: GetWeatherForecastOptions = {},
): Promise<WeatherForecast> {
  validateCoordinates(params)

  const requestUrl = new URL(OPEN_METEO_FORECAST_API_URL)
  const timezone = params.timezone ?? DEFAULT_WEATHER_TIMEZONE
  const forecastDays = normalizeForecastDays(params.forecastDays)

  requestUrl.searchParams.set('latitude', String(params.latitude))
  requestUrl.searchParams.set('longitude', String(params.longitude))
  requestUrl.searchParams.set('timezone', timezone)
  requestUrl.searchParams.set('forecast_days', String(forecastDays))
  requestUrl.searchParams.set('current', CURRENT_WEATHER_FIELDS.join(','))
  requestUrl.searchParams.set('daily', DAILY_WEATHER_FIELDS.join(','))
  requestUrl.searchParams.set('hourly', HOURLY_WEATHER_FIELDS.join(','))

  const response = await fetch(requestUrl, {
    headers: {
      Accept: 'application/json',
    },
    signal: options.signal,
  })

  if (!response.ok) {
    const errorBody = (await readJsonSafely<ApiErrorResponse>(response)) ?? {}
    throw new Error(errorBody.reason ?? '날씨 데이터를 불러오지 못했습니다.')
  }

  const rawForecast = (await response.json()) as OpenMeteoForecastResponse

  return {
    location: {
      latitude: rawForecast.latitude,
      longitude: rawForecast.longitude,
      timezone: rawForecast.timezone,
      timezoneAbbreviation: rawForecast.timezone_abbreviation,
    },
    current: {
      time: rawForecast.current.time,
      temperature: rawForecast.current.temperature_2m,
      apparentTemperature: rawForecast.current.apparent_temperature,
      isDay: rawForecast.current.is_day === 1,
      weatherCode: rawForecast.current.weather_code,
      windSpeed: rawForecast.current.wind_speed_10m,
    },
    daily: mapDailyForecast(rawForecast.daily),
    hourly: mapHourlyForecast(rawForecast.hourly),
  }
}

function mapDailyForecast(daily: OpenMeteoForecastResponse['daily']): DailyWeatherForecast[] {
  return daily.time.map((date, index) => ({
    date,
    weatherCode: daily.weather_code[index] ?? 0,
    temperatureMax: daily.temperature_2m_max[index] ?? 0,
    temperatureMin: daily.temperature_2m_min[index] ?? 0,
    precipitationProbabilityMax: daily.precipitation_probability_max[index] ?? 0,
  }))
}

function mapHourlyForecast(hourly: OpenMeteoForecastResponse['hourly']): HourlyWeatherForecast[] {
  return hourly.time.map((time, index) => ({
    time,
    temperature: hourly.temperature_2m[index] ?? 0,
  }))
}

function normalizeForecastDays(forecastDays?: number) {
  if (forecastDays === undefined) {
    return DEFAULT_FORECAST_DAYS
  }

  return Math.min(Math.max(Math.trunc(forecastDays), 1), 16)
}

function validateCoordinates({ latitude, longitude }: GetWeatherForecastParams) {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('latitude는 -90에서 90 사이의 숫자여야 합니다.')
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('longitude는 -180에서 180 사이의 숫자여야 합니다.')
  }
}

async function readJsonSafely<T>(response: Response) {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}
