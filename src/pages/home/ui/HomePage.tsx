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
import { getWeatherSymbol } from '@/shared/lib/weatherSymbol'
import { InfoRow } from '@/shared/ui/InfoRow'

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
  const isSearchingPlace = Boolean(selectedDistrict)

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
  }, {
    enabled: !isSearchingPlace,
  })

  const selectedDistrictWeatherQuery = useWeatherForecastQuery(
    {
      latitude: selectedDistrictCoordinates.data?.latitude ?? 0,
      longitude: selectedDistrictCoordinates.data?.longitude ?? 0,
      timezone: selectedDistrictCoordinates.data?.timezone ?? browserTimeZone,
    },
    {
      enabled: Boolean(selectedDistrictCoordinates.data),
    },
  )

  const favoriteWeatherQueries = useFavoriteWeather(favorites)
  const selectedFavorite = selectedDistrict
    ? findFavoriteByDistrict(selectedDistrict.fullName)
    : undefined
  const isFavoriteLimitReached = favorites.length >= FAVORITES_LIMIT && !selectedFavorite
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

  const weatherConditionLabel = activeWeather
    ? getWeatherConditionLabel(activeWeather.current.weatherCode)
    : '데이터 대기 중'
  const weatherSymbol = activeWeather ? getWeatherSymbol(activeWeather.current.weatherCode) : '○'

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-6 lg:grid-cols-[minmax(260px,25%)_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-300 bg-white p-6 shadow-sm">
              <div className="rounded-[1.5rem] border border-slate-300 px-5 py-8 text-center">
                <p className="text-sm font-medium uppercase tracking-[0.26em] text-slate-500">
                  App Logo / Title
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Weather App</h1>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-300 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Location Search
              </p>

              <label className="mt-4 block">
                <input
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                  placeholder="장소를 검색하세요"
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
                <div className="mt-3 overflow-hidden rounded-[1.5rem] border border-slate-300 bg-white">
                  <ul className="divide-y divide-slate-200">
                    {districtSuggestions.map((district) => (
                      <li key={district.fullName}>
                        <button
                          className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition hover:bg-slate-50"
                          onClick={() => {
                            setSelectedDistrict(district)
                            setSearchKeyword(district.fullName)
                          }}
                        >
                          <div>
                            <p className="text-base font-medium text-slate-950">{district.fullName}</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                            {district.depth}단계
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {searchStatusMessage ? (
                <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {searchStatusMessage}
                </p>
              ) : null}
            </section>

            <section className="rounded-[2rem] border border-slate-300 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Current Location
              </p>
              <div className="mt-4 rounded-[1.5rem] border border-slate-300 p-5">
                <p className="text-sm text-slate-500">Your Location</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  {currentLocation.label}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  위도 {currentLocation.coordinates.latitude.toFixed(4)}, 경도{' '}
                  {currentLocation.coordinates.longitude.toFixed(4)}
                </p>
                {currentLocation.message ? (
                  <p className="mt-4 text-sm leading-6 text-slate-500">{currentLocation.message}</p>
                ) : null}
              </div>
            </section>
          </aside>

          <section className="space-y-6">
            <section className="rounded-[2rem] border border-slate-300 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Detailed Weather
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {activeLocationLabel}
                  </h2>
                </div>
                <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                  {getWeatherStatusLabel({
                    isSearchingPlace,
                    selectedDistrictCoordinatesLoading: selectedDistrictCoordinates.isLoading,
                    weatherLoading: activeWeatherQuery.isLoading,
                    weatherFetching: activeWeatherQuery.isFetching,
                  })}
                </span>
              </div>

              <div className="mt-5 rounded-[1.8rem] border border-slate-300 p-6 md:p-8">
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center">
                  <div className="text-center xl:text-left">
                    <p className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                      {activeLocationLabel}
                    </p>
                    <div className="mt-6 flex flex-col items-center gap-4 xl:flex-row xl:items-end">
                      <p className="text-[5rem] font-semibold leading-none tracking-[-0.08em] text-slate-950 sm:text-[6.5rem]">
                        {activeWeather ? `${Math.round(activeWeather.current.temperature)}°` : '--'}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-6xl leading-none text-slate-900">{weatherSymbol}</span>
                        <div className="text-left">
                          <p className="text-lg font-medium text-slate-900">
                            체감 온도 {activeWeather ? `${Math.round(activeWeather.current.apparentTemperature)}°` : '--'}
                          </p>
                          <p className="mt-1 text-base text-slate-600">{weatherConditionLabel}</p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-6 text-sm text-slate-500">
                      {activeCoordinates
                        ? `위도 ${activeCoordinates.latitude.toFixed(4)}, 경도 ${activeCoordinates.longitude.toFixed(4)}`
                        : '좌표를 찾는 중입니다.'}
                    </p>

                    {renderWeatherMessage({
                      isSearchingPlace,
                      selectedDistrict,
                      currentLocationMessage: currentLocation.message,
                      selectedDistrictCoordinates: selectedDistrictCoordinates.data,
                      selectedDistrictCoordinatesError: selectedDistrictCoordinates.error,
                      weatherError: activeWeatherQuery.error,
                    })}
                  </div>

                  <div className="space-y-4">
                    <InfoRow label="최고 기온" value={today ? `${Math.round(today.temperatureMax)}°` : '--'} />
                    <InfoRow label="최저 기온" value={today ? `${Math.round(today.temperatureMin)}°` : '--'} />
                    <InfoRow label="강수 확률" value={today ? `${today.precipitationProbabilityMax}%` : '--'} />
                    <InfoRow
                      label="업데이트 시각"
                      value={activeWeather ? formatDateTime(activeWeather.current.time, browserTimeZone) : '--'}
                    />
                    <InfoRow
                      label="시간대"
                      value={
                        activeWeather?.location.timezone ??
                        selectedDistrictCoordinates.data?.timezone ??
                        browserTimeZone
                      }
                    />
                    <InfoRow
                      label="풍속"
                      value={activeWeather ? `${Math.round(activeWeather.current.windSpeed)} km/h` : '--'}
                    />

                    <div className="rounded-[1.5rem] border border-slate-300 bg-slate-50 p-4">
                      {selectedFavorite ? (
                        <button
                          className="w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50"
                          onClick={() => removeFavorite(selectedFavorite.id)}
                        >
                          즐겨찾기에서 삭제
                        </button>
                      ) : (
                        <button
                          className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
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
                        <p className="mt-3 text-sm leading-6 text-slate-500">{favoriteActionMessage}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-300 bg-white p-6 shadow-sm">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Hourly Forecast
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    시간대별 기온 그래프
                  </h2>
                </div>
                <p className="text-sm text-slate-500">{today ? `${today.date} 기준` : '오늘 예보 준비 중'}</p>
              </div>

              <div className="mt-5 overflow-x-auto">
                <div className="flex min-w-max gap-4 pb-2">
                  {hourlyTemperatures.length > 0
                    ? hourlyTemperatures.map((hour) => (
                        <article
                          key={hour.time}
                          className="flex min-w-[140px] flex-col items-center rounded-[1.6rem] border border-slate-300 bg-white px-5 py-5 text-center"
                        >
                          <p className="text-sm font-medium text-slate-500">
                            {formatHour(hour.time, browserTimeZone)}
                          </p>
                          <p className="mt-3 text-4xl leading-none text-slate-900">☀</p>
                          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                            {Math.round(hour.temperature)}°
                          </p>
                        </article>
                      ))
                    : Array.from({ length: 8 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-[170px] min-w-[140px] animate-pulse rounded-[1.6rem] bg-slate-100"
                        />
                      ))}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-300 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Favorites
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    즐겨찾기 장소
                  </h2>
                </div>
                <p className="text-sm text-slate-500">최대 6개까지 추가할 수 있으며 카드를 누르면 상세 페이지로 이동합니다.</p>
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
          </section>
        </div>
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
