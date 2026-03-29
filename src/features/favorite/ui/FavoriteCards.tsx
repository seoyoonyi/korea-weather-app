import { useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { FavoritePlace } from '@/entities/favorite/model/types'
import { getWeatherConditionLabel } from '@/entities/weather/model/getWeatherConditionLabel'
import type { WeatherForecast } from '@/entities/weather/model/types'
import { confirmFavoriteRemoval } from '@/features/favorite/model/confirmFavoriteRemoval'
import { createWeatherThemeStyle, getWeatherVisualTheme } from '@/shared/lib/weatherVisualTheme'
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
        const isWeatherLoading = weatherQuery?.isLoading || (weatherQuery?.isFetching && !weather)
        const weatherSymbol = weather ? getWeatherSymbol(weather.current.weatherCode) : '☀'
        const conditionLabel = isWeatherLoading
          ? '날씨 불러오는 중'
          : weatherQuery?.error
            ? '날씨 정보를 불러오지 못했습니다.'
            : weather
              ? getWeatherConditionLabel(weather.current.weatherCode)
              : '정보 없음'
        const themeStyle = createWeatherThemeStyle(
          getWeatherVisualTheme(weather?.current.weatherCode),
          'favorite',
        )

        return (
          <article
            key={favorite.id}
            className="weather-favorite-card rounded-[1.7rem] p-4 text-slate-50 transition duration-300 hover:-translate-y-0.5 hover:border-white/18 sm:p-5"
            style={themeStyle}
          >
            <div
              className="relative block w-full text-left"
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
                  <div className="flex justify-between gap-3">
                    <span className="text-[0.72rem] font-medium tracking-[0.16em] text-slate-300 uppercase">
                      이름 수정
                    </span>
                    <span className="weather-accent-pill rounded-full px-3 py-1 text-[0.72rem] font-medium text-white">
                      #{String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <label
                        className="text-[0.72rem] font-medium tracking-[0.16em] text-slate-400 uppercase"
                        htmlFor={`favorite-alias-${favorite.id}`}
                      >
                        별칭
                      </label>
                      <input
                        id={`favorite-alias-${favorite.id}`}
                        className="mt-2 w-full rounded-[1rem] border border-white/12 bg-white/6 px-4 py-3 text-[1.7rem] font-semibold leading-none tracking-tight text-white outline-none transition placeholder:text-slate-400 focus:border-sky-300/35 focus:ring-4 focus:ring-sky-300/10 sm:text-[1.9rem]"
                        value={draftAlias}
                        autoFocus
                        onChange={(event) => setDraftAlias(event.target.value)}
                      />
                      <p className="mt-3 truncate text-[1.02rem] text-slate-300">{favorite.label}</p>
                    </div>
                    <div className="shrink-0 pl-3 text-right">
                      <div className="flex flex-col items-end gap-3">
                        <div className="weather-icon-halo h-11 w-11">
                          <span className="text-[1.6rem] leading-none text-white">{weatherSymbol}</span>
                        </div>
                        <p className="font-mono tabular-nums text-[2.8rem] font-medium leading-none tracking-tight text-white sm:text-[3.8rem]">
                          {formatTemperature(weather?.current.temperature)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="weather-accent-pill rounded-full px-3 py-1 text-[0.78rem] font-medium text-white">
                      {conditionLabel}
                    </span>

                    <div className="flex justify-end gap-2">
                      <button
                        className="weather-accent-pill rounded-full px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-45"
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
                        className="weather-context-pill rounded-full px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
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

                  <div className="mt-4 flex flex-col gap-2 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-slate-100">
                        체감 {formatTemperature(weather?.current.apparentTemperature)}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {weather?.location.timezone ?? favorite.timezone}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-white sm:text-[1.05rem] sm:text-right">
                      최고 {formatTemperature(today?.temperatureMax)} / 최저{' '}
                      {formatTemperature(today?.temperatureMin)}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-end">
                    <span className="weather-accent-pill rounded-full px-3 py-1 text-[0.72rem] font-medium text-white">
                      #{String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[2rem] font-semibold leading-none tracking-tight text-white sm:text-[2.2rem]">
                        {favorite.alias}
                      </p>
                      <p className="mt-2 truncate text-[1.05rem] text-slate-300">{favorite.label}</p>
                    </div>
                    <div className="shrink-0 pl-3 text-right">
                      <div className="flex flex-col items-end gap-3">
                        <div className="weather-icon-halo h-11 w-11">
                          <span className="text-[1.6rem] leading-none text-white">{weatherSymbol}</span>
                        </div>
                        {isWeatherLoading ? (
                          <LoadingBar className="h-12 w-24 rounded-[1.4rem] sm:h-14 sm:w-24" />
                        ) : (
                          <p className="font-mono tabular-nums text-[2.8rem] font-medium leading-none tracking-tight text-white sm:text-[3.8rem]">
                            {formatTemperature(weather?.current.temperature)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="weather-accent-pill rounded-full px-3 py-1 text-[0.78rem] font-medium text-white">
                      {conditionLabel}
                    </span>

                    <div className="flex justify-end gap-2">
                      <button
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:border-sky-200/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/15"
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
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-rose-300/25 bg-rose-500/8 text-rose-100 transition hover:bg-rose-500/14 focus-visible:border-rose-200/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/15"
                        aria-label="즐겨찾기 삭제"
                        onClick={(event) => {
                          event.stopPropagation()
                          if (!confirmFavoriteRemoval(favorite)) {
                            return
                          }

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
                  </div>

                  <div className="mt-4 flex flex-col gap-2 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      {isWeatherLoading ? (
                        <div className="space-y-2">
                          <LoadingBar className="h-4 w-28" />
                          <LoadingBar className="h-3 w-20" />
                        </div>
                      ) : (
                        <>
                          <p className="truncate text-base font-medium text-slate-100">
                            체감 {formatTemperature(weather?.current.apparentTemperature)}
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            {weather?.location.timezone ?? favorite.timezone}
                          </p>
                        </>
                      )}
                    </div>
                    <p className="text-sm font-medium text-white sm:text-[1.05rem] sm:text-right">
                      최고 {formatTemperature(today?.temperatureMax)} / 최저{' '}
                      {formatTemperature(today?.temperatureMin)}
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

function formatTemperature(value: number | undefined) {
  return typeof value === 'number' ? `${Math.round(value)}°` : '--'
}

function LoadingBar({ className }: { className: string }) {
  return <div className={`weather-skeleton ${className}`} />
}
