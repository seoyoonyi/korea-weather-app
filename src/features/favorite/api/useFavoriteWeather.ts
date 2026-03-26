import { useQueries } from '@tanstack/react-query'
import type { FavoritePlace } from '@/entities/favorite/model/types'
import { weatherForecastQueryOptions } from '@/entities/weather/api/useWeatherForecastQuery'

export function useFavoriteWeather(favorites: FavoritePlace[]) {
  return useQueries({
    queries: favorites.map((favorite) =>
      weatherForecastQueryOptions({
        latitude: favorite.latitude,
        longitude: favorite.longitude,
        timezone: favorite.timezone,
      }),
    ),
  })
}
