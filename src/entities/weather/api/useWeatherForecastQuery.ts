import { queryOptions, useQuery } from '@tanstack/react-query'
import { DEFAULT_FORECAST_DAYS, DEFAULT_WEATHER_TIMEZONE } from '@/shared/config/api'
import type { GetWeatherForecastParams } from '@/entities/weather/model/types'
import { getWeatherForecast } from '@/entities/weather/api/weatherApiClient'

export function weatherForecastQueryOptions(params: GetWeatherForecastParams) {
  return queryOptions({
    queryKey: [
      'weather',
      params.latitude,
      params.longitude,
      params.timezone ?? DEFAULT_WEATHER_TIMEZONE,
      params.forecastDays ?? DEFAULT_FORECAST_DAYS,
    ],
    queryFn: ({ signal }) => getWeatherForecast(params, { signal }),
  })
}

export function useWeatherForecastQuery(params: GetWeatherForecastParams) {
  return useQuery(weatherForecastQueryOptions(params))
}
