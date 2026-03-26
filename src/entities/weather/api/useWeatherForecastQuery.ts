import { queryOptions, useQuery } from '@tanstack/react-query'
import { DEFAULT_WEATHER_TIMEZONE } from '@/shared/config/api'
import type { GetWeatherForecastParams } from '@/entities/weather/model/types'
import { getWeatherForecast } from '@/entities/weather/api/weatherApiClient'

type UseWeatherForecastQueryOptions = {
  enabled?: boolean
}

export function weatherForecastQueryOptions(params: GetWeatherForecastParams) {
  return queryOptions({
    queryKey: [
      'weather',
      params.latitude,
      params.longitude,
      params.timezone ?? DEFAULT_WEATHER_TIMEZONE,
    ],
    queryFn: ({ signal }) => getWeatherForecast(params, { signal }),
  })
}

export function useWeatherForecastQuery(
  params: GetWeatherForecastParams,
  options: UseWeatherForecastQueryOptions = {},
) {
  return useQuery({
    ...weatherForecastQueryOptions(params),
    enabled: options.enabled,
  })
}
