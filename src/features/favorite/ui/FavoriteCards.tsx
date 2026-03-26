import { useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { FavoritePlace } from '@/entities/favorite/model/types'
import { getWeatherConditionLabel } from '@/entities/weather/model/getWeatherConditionLabel'
import type { WeatherForecast } from '@/entities/weather/model/types'
import { getWeatherSymbol } from '@/shared/lib/weatherSymbol'

export function FavoriteCards({
  favorites,
  weatherQueries,
  onRemoveFavorite,
  onUpdateFavoriteAlias,
}: {
  favorites: FavoritePlace[]
  weatherQueries: UseQueryResult<WeatherForecast, Error>[]
  onRemoveFavorite: (favoriteId: string) => void
  onUpdateFavoriteAlias: (favoriteId: string, alias: string) => void
}) {
  const navigate = useNavigate()
  const [editingFavoriteId, setEditingFavoriteId] = useState<string | null>(null)
  const [draftAlias, setDraftAlias] = useState('')

  if (favorites.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500">
        즐겨찾기한 장소가 없습니다. 검색 후 장소를 선택해서 최대 6개까지 추가할 수 있습니다.
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {favorites.map((favorite, index) => {
        const weatherQuery = weatherQueries[index]
        const weather = weatherQuery?.data
        const today = weather?.daily[0]
        const isEditing = editingFavoriteId === favorite.id
        const weatherSymbol = weather ? getWeatherSymbol(weather.current.weatherCode) : '☀'

        return (
          <article
            key={favorite.id}
            className="rounded-[1.75rem] border border-slate-300 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400"
          >
            <div
              className="block w-full text-left"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/favorites/${favorite.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate(`/favorites/${favorite.id}`)
                }
              }}
            >
              {isEditing ? (
                <div className="space-y-3" onClick={(event) => event.stopPropagation()}>
                  <input
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                    value={draftAlias}
                    onChange={(event) => setDraftAlias(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white"
                      onClick={(event) => {
                        event.stopPropagation()
                        onUpdateFavoriteAlias(favorite.id, draftAlias)
                        setEditingFavoriteId(null)
                        setDraftAlias('')
                      }}
                    >
                      저장
                    </button>
                    <button
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                      onClick={(event) => {
                        event.stopPropagation()
                        setEditingFavoriteId(null)
                        setDraftAlias('')
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-2xl font-semibold tracking-tight text-slate-950">{favorite.alias}</p>
                      <p className="mt-2 text-sm text-slate-500">{favorite.label}</p>
                    </div>
                    <button
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600"
                      onClick={(event) => {
                        event.stopPropagation()
                        setEditingFavoriteId(favorite.id)
                        setDraftAlias(favorite.alias)
                      }}
                    >
                      edit name
                    </button>
                  </div>

                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-5xl font-semibold leading-none tracking-tight text-slate-950">
                        {weather ? `${Math.round(weather.current.temperature)}°` : '--'}
                      </p>
                      <p className="mt-4 text-xl leading-none text-slate-900">{weatherSymbol}</p>
                      <p className="mt-4 text-sm font-medium text-slate-700">
                        H {today ? `${Math.round(today.temperatureMax)}°` : '--'} / L{' '}
                        {today ? `${Math.round(today.temperatureMin)}°` : '--'}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {weatherQuery?.isLoading
                          ? '날씨 불러오는 중'
                          : weatherQuery?.error
                            ? '날씨 정보를 불러오지 못했습니다.'
                            : weather
                              ? getWeatherConditionLabel(weather.current.weatherCode)
                              : '정보 없음'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {!isEditing ? (
              <div className="mt-5 flex justify-end gap-2">
                <button
                  className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemoveFavorite(favorite.id)
                  }}
                >
                  삭제
                </button>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
