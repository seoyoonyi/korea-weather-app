import { useDeferredValue, useState } from 'react'
import { useDistrictCoords } from '@/entities/district/api/useDistrictCoords'
import { useDistrictTree } from '@/entities/district/api/useDistrictTree'
import type { DistrictNode } from '@/entities/district/model/types'
import { searchDistricts } from '@/entities/district/model/searchDistricts'
import { useWeatherForecastQuery } from '@/entities/weather/api/useWeatherForecastQuery'
import { getWeatherConditionLabel } from '@/entities/weather/model/getWeatherConditionLabel'
import { useFavoriteWeather } from '@/features/favorite/api/useFavoriteWeather'
import { FavoriteCards } from '@/features/favorite/ui/FavoriteCards'
import {
  FAVORITES_LIMIT,
  useFavorites,
} from '@/features/favorite/model/FavoritesProvider'
import { useCurrentLocation } from '@/features/current-location/model/useCurrentLocation'
import { DEFAULT_WEATHER_TIMEZONE } from '@/shared/config/api'
import { formatDateTime, formatHour, getTodayHourlyTemperatures } from '@/shared/lib/weather'
import { InfoRow } from '@/shared/ui/InfoRow'
import { MetricCard } from '@/shared/ui/MetricCard'

const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_WEATHER_TIMEZONE

export function HomePage() {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictNode | null>(null)
  const deferredSearchKeyword = useDeferredValue(searchKeyword.trim())

  const {
    favorites,
    addFavorite,
    removeFavorite,
    updateFavoriteAlias,
    findFavoriteByDistrict,
  } = useFavorites()
  const currentLocation = useCurrentLocation()
  const { data: districtTree, isLoading: isDistrictTreeLoading } = useDistrictTree()
  const favoriteWeatherQueries = useFavoriteWeather(favorites)

  const isSearchSelectionLocked =
    selectedDistrict !== null &&
    normalizeSearchValue(searchKeyword) === normalizeSearchValue(selectedDistrict.fullName)
  const districtSuggestions =
    deferredSearchKeyword && !isSearchSelectionLocked
      ? searchDistricts(districtTree?.allNodes ?? [], deferredSearchKeyword)
      : []

  const selectedDistrictCoordinates = useDistrictCoords(selectedDistrict)

  const currentWeatherQuery = useWeatherForecastQuery({
    ...currentLocation.coordinates,
    timezone: browserTimeZone,
    forecastDays: 1,
  })

  const selectedDistrictWeatherQuery = useWeatherForecastQuery(
    {
      latitude: selectedDistrictCoordinates.data?.latitude ?? 0,
      longitude: selectedDistrictCoordinates.data?.longitude ?? 0,
      timezone: selectedDistrictCoordinates.data?.timezone ?? browserTimeZone,
      forecastDays: 1,
    },
    {
      enabled: Boolean(selectedDistrictCoordinates.data),
    },
  )

  const selectedFavorite = selectedDistrict
    ? findFavoriteByDistrict(selectedDistrict.fullName)
    : undefined
  const isFavoriteLimitReached = favorites.length >= FAVORITES_LIMIT && !selectedFavorite
  const isSearchingPlace = Boolean(selectedDistrict)
  const activeWeatherQuery = isSearchingPlace ? selectedDistrictWeatherQuery : currentWeatherQuery
  const activeWeather = activeWeatherQuery.data
  const activeLocationLabel = getActiveLocationLabel(
    isSearchingPlace,
    selectedDistrict,
    selectedDistrictCoordinates.data?.label,
    currentLocation.label,
  )
  const activeCoordinates = isSearchingPlace
    ? selectedDistrictCoordinates.data
      ? {
          latitude: selectedDistrictCoordinates.data.latitude,
          longitude: selectedDistrictCoordinates.data.longitude,
        }
      : null
    : currentLocation.coordinates
  const today = activeWeather?.daily[0]
  const hourlyTemperatures = activeWeather
    ? getTodayHourlyTemperatures(activeWeather.hourly, today?.date)
    : []
  const searchStatusMessage = getSearchStatusMessage({
    isDistrictTreeLoading,
    deferredSearchKeyword,
    districtSuggestions,
    selectedDistrict,
    selectedDistrictCoordinates: selectedDistrictCoordinates.data,
    selectedDistrictCoordinatesError: selectedDistrictCoordinates.error,
    isResolvingSelectedDistrict: selectedDistrictCoordinates.isLoading,
  })
  const favoriteActionMessage = getFavoriteActionMessage({
    selectedDistrict,
    selectedFavorite,
    isFavoriteLimitReached,
    selectedDistrictCoordinates: selectedDistrictCoordinates.data,
    selectedDistrictCoordinatesLoading: selectedDistrictCoordinates.isLoading,
  })

  const handleAddFavorite = () => {
    if (!selectedDistrict || !selectedDistrictCoordinates.data) {
      return
    }

    addFavorite({
      districtFullName: selectedDistrict.fullName,
      districtName: selectedDistrict.name,
      alias: selectedDistrict.name,
      label: selectedDistrictCoordinates.data.label,
      latitude: selectedDistrictCoordinates.data.latitude,
      longitude: selectedDistrictCoordinates.data.longitude,
      timezone: selectedDistrictCoordinates.data.timezone ?? browserTimeZone,
    })
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#e0f2fe_100%)] px-6 py-10 text-slate-950 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-700">
                Korea District Search
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                대한민국 행정구역으로 날씨 검색
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                시, 군, 구, 동 단위 이름으로 검색하면 매칭되는 행정구역 목록을 보여주고,
                선택한 장소의 날씨를 조회합니다.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-950 px-5 py-4 text-slate-50">
              <p className="text-sm text-slate-300">즐겨찾기</p>
              <p className="mt-2 text-lg font-medium">
                {favorites.length} / {FAVORITES_LIMIT}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">장소 검색</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  placeholder="예: 서울특별시, 종로구, 청운동"
                  value={searchKeyword}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setSearchKeyword(nextValue)

                    if (
                      selectedDistrict &&
                      normalizeSearchValue(nextValue) !== normalizeSearchValue(selectedDistrict.fullName)
                    ) {
                      setSelectedDistrict(null)
                    }
                  }}
                />
              </label>

              {districtSuggestions.length > 0 ? (
                <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                  <ul className="divide-y divide-slate-100">
                    {districtSuggestions.map((district) => (
                      <li key={district.fullName}>
                        <button
                          className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition hover:bg-sky-50"
                          onClick={() => {
                            setSelectedDistrict(district)
                            setSearchKeyword(district.fullName)
                          }}
                        >
                          <div>
                            <p className="text-base font-medium text-slate-950">{district.name}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {district.fullName.replaceAll('-', ' > ')}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {district.depth}단계
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {searchStatusMessage ? (
                <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {searchStatusMessage}
                </p>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-slate-50">
              <p className="text-sm uppercase tracking-[0.24em] text-sky-300">Selected Place</p>
              <div className="mt-5 space-y-4">
                <InfoRow label="표시 위치" value={activeLocationLabel} />
                <InfoRow
                  label="조회 기준"
                  value={isSearchingPlace ? '검색으로 선택한 장소' : '브라우저 현재 위치'}
                />
                <InfoRow
                  label="행정구역 경로"
                  value={selectedDistrict ? selectedDistrict.fullName.replaceAll('-', ' > ') : '선택된 장소 없음'}
                />
              </div>

              <div className="mt-6">
                {selectedFavorite ? (
                  <button
                    className="w-full rounded-2xl border border-red-200 px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    onClick={() => removeFavorite(selectedFavorite.id)}
                  >
                    즐겨찾기에서 삭제
                  </button>
                ) : (
                  <button
                    className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                    disabled={
                      !selectedDistrictCoordinates.data ||
                      selectedDistrictCoordinates.isLoading ||
                      isFavoriteLimitReached
                    }
                    onClick={handleAddFavorite}
                  >
                    즐겨찾기에 추가
                  </button>
                )}

                {favoriteActionMessage ? (
                  <p className="mt-3 text-sm text-slate-300">{favoriteActionMessage}</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-700">Favorites</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">즐겨찾기 장소</h2>
            </div>
            <p className="text-sm text-slate-500">카드를 클릭하면 상세 페이지로 이동합니다.</p>
          </div>

          <div className="mt-6">
            <FavoriteCards
              favorites={favorites}
              weatherQueries={favoriteWeatherQueries}
              onRemoveFavorite={removeFavorite}
              onUpdateFavoriteAlias={updateFavoriteAlias}
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-700">Open API Weather</p>
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">{activeLocationLabel}</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  {activeCoordinates
                    ? `위도 ${activeCoordinates.latitude.toFixed(4)}, 경도 ${activeCoordinates.longitude.toFixed(4)}`
                    : '좌표를 찾는 중입니다.'}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-950 px-5 py-4 text-slate-50">
                <p className="text-sm text-slate-300">상태</p>
                <p className="mt-2 text-lg font-medium">
                  {getWeatherStatusLabel({
                    isSearchingPlace,
                    selectedDistrictCoordinatesLoading: selectedDistrictCoordinates.isLoading,
                    weatherLoading: activeWeatherQuery.isLoading,
                    weatherFetching: activeWeatherQuery.isFetching,
                  })}
                </p>
              </div>
            </div>

            {renderWeatherMessage({
              isSearchingPlace,
              selectedDistrict,
              currentLocationMessage: currentLocation.message,
              selectedDistrictCoordinates: selectedDistrictCoordinates.data,
              selectedDistrictCoordinatesError: selectedDistrictCoordinates.error,
              weatherError: activeWeatherQuery.error,
            })}

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <MetricCard
                label="현재 기온"
                value={activeWeather ? `${Math.round(activeWeather.current.temperature)}°` : '--'}
                helper={
                  activeWeather ? getWeatherConditionLabel(activeWeather.current.weatherCode) : '데이터 대기 중'
                }
              />
              <MetricCard
                label="당일 최저"
                value={today ? `${Math.round(today.temperatureMin)}°` : '--'}
                helper={today ? `${today.date}` : '데이터 대기 중'}
              />
              <MetricCard
                label="당일 최고"
                value={today ? `${Math.round(today.temperatureMax)}°` : '--'}
                helper={
                  activeWeather ? `체감 ${Math.round(activeWeather.current.apparentTemperature)}°` : '데이터 대기 중'
                }
              />
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-slate-50 shadow-[0_24px_80px_rgba(2,6,23,0.18)]">
            <p className="text-sm uppercase tracking-[0.24em] text-sky-300">Details</p>
            <div className="mt-6 space-y-5">
              <InfoRow label="표시 위치" value={activeLocationLabel} />
              <InfoRow
                label="시간대"
                value={
                  activeWeather?.location.timezone ??
                  selectedDistrictCoordinates.data?.timezone ??
                  browserTimeZone
                }
              />
              <InfoRow
                label="업데이트 시각"
                value={activeWeather ? formatDateTime(activeWeather.current.time, browserTimeZone) : '--'}
              />
              <InfoRow
                label="강수 확률"
                value={today ? `${today.precipitationProbabilityMax}%` : '--'}
              />
              <InfoRow
                label="풍속"
                value={activeWeather ? `${Math.round(activeWeather.current.windSpeed)} km/h` : '--'}
              />
            </div>
          </aside>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-700">Hourly Temperature</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">시간대별 기온</h2>
            </div>
            <p className="text-sm text-slate-500">{today ? `${today.date} 기준` : '오늘 예보 준비 중'}</p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {hourlyTemperatures.length > 0
              ? hourlyTemperatures.map((hour) => (
                  <article
                    key={hour.time}
                    className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5 transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50"
                  >
                    <p className="text-sm text-slate-500">{formatHour(hour.time, browserTimeZone)}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      {Math.round(hour.temperature)}°
                    </p>
                  </article>
                ))
              : Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-28 animate-pulse rounded-3xl bg-slate-100" />
                ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function getActiveLocationLabel(
  isSearchingPlace: boolean,
  selectedDistrict: DistrictNode | null,
  selectedDistrictLabel: string | undefined,
  currentLocationLabel: string,
) {
  if (!isSearchingPlace) {
    return currentLocationLabel
  }

  return selectedDistrictLabel ?? selectedDistrict?.name ?? '검색한 장소'
}

function getSearchStatusMessage({
  isDistrictTreeLoading,
  deferredSearchKeyword,
  districtSuggestions,
  selectedDistrict,
  selectedDistrictCoordinates,
  selectedDistrictCoordinatesError,
  isResolvingSelectedDistrict,
}: {
  isDistrictTreeLoading: boolean
  deferredSearchKeyword: string
  districtSuggestions: DistrictNode[]
  selectedDistrict: DistrictNode | null
  selectedDistrictCoordinates: { latitude: number; longitude: number } | null | undefined
  selectedDistrictCoordinatesError: Error | null
  isResolvingSelectedDistrict: boolean
}) {
  if (isDistrictTreeLoading) {
    return '행정구역 데이터를 불러오는 중입니다.'
  }

  if (isResolvingSelectedDistrict) {
    return '선택한 장소의 좌표를 확인하는 중입니다.'
  }

  if (selectedDistrictCoordinatesError) {
    return selectedDistrictCoordinatesError.message
  }

  if (selectedDistrict && !selectedDistrictCoordinates) {
    return '해당 장소의 정보가 제공되지 않습니다.'
  }

  if (deferredSearchKeyword.length > 0 && districtSuggestions.length === 0) {
    return '검색어와 일치하는 대한민국 행정구역이 없습니다.'
  }

  return null
}

function getFavoriteActionMessage({
  selectedDistrict,
  selectedFavorite,
  isFavoriteLimitReached,
  selectedDistrictCoordinates,
  selectedDistrictCoordinatesLoading,
}: {
  selectedDistrict: DistrictNode | null
  selectedFavorite: { id: string } | undefined
  isFavoriteLimitReached: boolean
  selectedDistrictCoordinates: { latitude: number; longitude: number } | null | undefined
  selectedDistrictCoordinatesLoading: boolean
}) {
  if (!selectedDistrict) {
    return '장소를 선택하면 즐겨찾기에 추가할 수 있습니다.'
  }

  if (selectedFavorite) {
    return '이미 즐겨찾기에 추가된 장소입니다.'
  }

  if (selectedDistrictCoordinatesLoading) {
    return '즐겨찾기 추가를 위해 장소 좌표를 확인하는 중입니다.'
  }

  if (!selectedDistrictCoordinates) {
    return '해당 장소의 정보가 제공되지 않아 즐겨찾기에 추가할 수 없습니다.'
  }

  if (isFavoriteLimitReached) {
    return '즐겨찾기는 최대 6개까지 추가할 수 있습니다.'
  }

  return '선택한 장소를 즐겨찾기에 추가할 수 있습니다.'
}

function getWeatherStatusLabel({
  isSearchingPlace,
  selectedDistrictCoordinatesLoading,
  weatherLoading,
  weatherFetching,
}: {
  isSearchingPlace: boolean
  selectedDistrictCoordinatesLoading: boolean
  weatherLoading: boolean
  weatherFetching: boolean
}) {
  if (isSearchingPlace && selectedDistrictCoordinatesLoading) {
    return '장소 좌표 확인 중'
  }

  if (weatherLoading) {
    return '날씨 불러오는 중'
  }

  if (weatherFetching) {
    return '날씨 갱신 중'
  }

  return '최신 예보 준비됨'
}

function renderWeatherMessage({
  isSearchingPlace,
  selectedDistrict,
  currentLocationMessage,
  selectedDistrictCoordinates,
  selectedDistrictCoordinatesError,
  weatherError,
}: {
  isSearchingPlace: boolean
  selectedDistrict: DistrictNode | null
  currentLocationMessage: string | null
  selectedDistrictCoordinates: { latitude: number; longitude: number } | null | undefined
  selectedDistrictCoordinatesError: Error | null
  weatherError: Error | null
}) {
  if (isSearchingPlace && selectedDistrict && !selectedDistrictCoordinates && !selectedDistrictCoordinatesError) {
    return (
      <p className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        해당 장소의 정보가 제공되지 않습니다.
      </p>
    )
  }

  if (selectedDistrictCoordinatesError || weatherError) {
    return (
      <p className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        {(selectedDistrictCoordinatesError ?? weatherError)?.message ?? '날씨 정보를 불러오지 못했습니다.'}
      </p>
    )
  }

  if (!isSearchingPlace && currentLocationMessage) {
    return (
      <p className="mt-6 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
        {currentLocationMessage}
      </p>
    )
  }

  return null
}

function normalizeSearchValue(value: string) {
  return value.replaceAll(/\s|-/g, '').toLowerCase()
}
