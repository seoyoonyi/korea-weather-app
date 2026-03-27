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
      <div className="rounded-[1.8rem] border border-dashed border-white/15 bg-white/6 px-5 py-8 text-sm text-slate-300">
        즐겨찾기한 장소가 없습니다. 검색 후 장소를 선택해서 최대 6개까지 추가할 수 있습니다.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {favorites.map((favorite, index) => {
        const weatherQuery = weatherQueries[index]
        const weather = weatherQuery?.data
        const today = weather?.daily[0]
        const isEditing = editingFavoriteId === favorite.id
        const weatherSymbol = weather ? getWeatherSymbol(weather.current.weatherCode) : '☀'

        return (
          <article
            key={favorite.id}
            className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-slate-50 shadow-[0_20px_50px_rgba(2,6,23,0.22)] transition hover:-translate-y-0.5 hover:bg-white/8 sm:rounded-[1.8rem] sm:p-5"
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
                    className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-sky-300/40 focus:ring-4 focus:ring-sky-300/10"
                    value={draftAlias}
                    onChange={(event) => setDraftAlias(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-950"
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
                      className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                        {favorite.alias}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">{favorite.label}</p>
                    </div>
                    <button
                      className="self-start rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-slate-300 sm:self-auto"
                      onClick={(event) => {
                        event.stopPropagation()
                        setEditingFavoriteId(favorite.id)
                        setDraftAlias(favorite.alias)
                      }}
                    >
                      edit name
                    </button>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-4 sm:mt-6">
                    <div>
                      <p className="text-4xl font-semibold leading-none tracking-tight text-white sm:text-5xl">
                        {weather ? `${Math.round(weather.current.temperature)}°` : '--'}
                      </p>
                      <p className="mt-3 text-lg leading-none text-slate-100 sm:mt-4 sm:text-xl">{weatherSymbol}</p>
                      <p className="mt-4 text-sm font-medium text-slate-200">
                        H {today ? `${Math.round(today.temperatureMax)}°` : '--'} / L{' '}
                        {today ? `${Math.round(today.temperatureMin)}°` : '--'}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
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
                  className="rounded-2xl border border-rose-300/30 px-4 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-500/10"
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
