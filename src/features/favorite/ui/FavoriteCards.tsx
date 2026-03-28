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
  const trimmedDraftAlias = draftAlias.trim()
  const isDraftAliasValid = trimmedDraftAlias.length > 0

  if (favorites.length === 0) {
    return (
      <div className="rounded-[1.8rem] border border-dashed border-white/15 bg-white/6 px-5 py-8 text-sm text-slate-300">
        즐겨찾기한 장소가 없습니다. 검색으로 장소를 선택해 최대 6개까지 저장할 수 있습니다.
      </div>
    )
  }

  return (
    <div className="grid gap-4 px-1 sm:px-0 sm:grid-cols-2 xl:grid-cols-3">
      {favorites.map((favorite, index) => {
        const weatherQuery = weatherQueries[index]
        const weather = weatherQuery?.data
        const today = weather?.daily[0]
        const isEditing = editingFavoriteId === favorite.id
        const weatherSymbol = weather ? getWeatherSymbol(weather.current.weatherCode) : '☀'
        const conditionLabel = weatherQuery?.isLoading
          ? '날씨 불러오는 중'
          : weatherQuery?.error
            ? '날씨 정보를 불러오지 못했습니다.'
            : weather
              ? getWeatherConditionLabel(weather.current.weatherCode)
              : '정보 없음'

        return (
          <article
            key={favorite.id}
            className="rounded-[1.7rem] border border-white/14 bg-[linear-gradient(180deg,rgba(55,63,112,0.82)_0%,rgba(44,52,96,0.92)_100%)] p-4 text-slate-50 shadow-[0_22px_55px_rgba(2,6,23,0.24)] transition hover:-translate-y-0.5 hover:border-white/18 hover:bg-[linear-gradient(180deg,rgba(60,69,121,0.86)_0%,rgba(47,55,103,0.96)_100%)] sm:p-5"
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
                <div className="space-y-4" onClick={(event) => event.stopPropagation()}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <input
                        className="w-full rounded-[1rem] border border-white/10 bg-white/8 px-4 py-2.5 text-base font-medium text-white outline-none transition placeholder:text-slate-400 focus:border-sky-300/40 focus:ring-4 focus:ring-sky-300/10"
                        value={draftAlias}
                        onChange={(event) => setDraftAlias(event.target.value)}
                      />
                      <p className="mt-2 truncate text-sm text-slate-300">{favorite.label}</p>
                    </div>
                    <p className="self-end text-[3.2rem] font-semibold leading-none tracking-tight text-white sm:self-auto sm:text-[3.7rem]">
                      {weather ? `${Math.round(weather.current.temperature)}°` : '--'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-lg leading-none text-slate-100">{weatherSymbol}</span>
                      <p className="truncate text-sm font-medium text-slate-100">{conditionLabel}</p>
                    </div>
                    <p className="text-sm font-medium text-slate-100 sm:text-right">
                      최고 {today ? `${Math.round(today.temperatureMax)}°` : '--'} / 최저{' '}
                      {today ? `${Math.round(today.temperatureMin)}°` : '--'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="rounded-[1rem] bg-white px-4 py-2 text-sm font-medium text-slate-950 transition disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-slate-400"
                      disabled={!isDraftAliasValid}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (!isDraftAliasValid) {
                          return
                        }

                        onUpdateFavoriteAlias(favorite.id, trimmedDraftAlias)
                        setEditingFavoriteId(null)
                        setDraftAlias('')
                      }}
                    >
                      저장
                    </button>
                    <button
                      className="rounded-[1rem] border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
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
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[2rem] font-semibold leading-none tracking-tight text-white sm:text-[2.2rem]">
                        {favorite.alias}
                      </p>
                      <p className="mt-2 truncate text-[1.05rem] text-slate-300">{favorite.label}</p>
                    </div>
                    <div className="shrink-0 pl-3 text-right">
                      <p className="text-[3.1rem] font-semibold leading-none tracking-tight text-white sm:text-[4.4rem]">
                        {weather ? `${Math.round(weather.current.temperature)}°` : '--'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      className="rounded-full border border-white/10 bg-white/6 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:border-sky-200/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/15"
                      aria-label="이름 수정"
                      onClick={(event) => {
                        event.stopPropagation()
                        setEditingFavoriteId(favorite.id)
                        setDraftAlias(favorite.alias)
                      }}
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3.75 13.75v2.5h2.5l7.37-7.37-2.5-2.5-7.37 7.37Z" />
                        <path d="m10.88 6.38 2.5 2.5" />
                        <path d="M12.63 4.63 14 3.25a1.77 1.77 0 0 1 2.5 2.5l-1.37 1.38" />
                      </svg>
                    </button>
                    <button
                      className="rounded-full border border-rose-300/25 bg-rose-500/8 p-2 text-rose-100 transition hover:bg-rose-500/14 focus-visible:border-rose-200/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/15"
                      aria-label="즐겨찾기 삭제"
                      onClick={(event) => {
                        event.stopPropagation()
                        onRemoveFavorite(favorite.id)
                      }}
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4.5 6h11" />
                        <path d="M8 3.75h4" />
                        <path d="M6.75 6l.55 8.1A1.25 1.25 0 0 0 8.55 15.25h2.9A1.25 1.25 0 0 0 12.7 14.1L13.25 6" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-xl leading-none text-slate-100">{weatherSymbol}</span>
                      <p className="truncate text-base font-medium text-slate-100">{conditionLabel}</p>
                    </div>
                    <p className="text-sm font-medium text-white sm:text-[1.05rem] sm:text-right">
                      최고 {today ? `${Math.round(today.temperatureMax)}°` : '--'} / 최저{' '}
                      {today ? `${Math.round(today.temperatureMin)}°` : '--'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
