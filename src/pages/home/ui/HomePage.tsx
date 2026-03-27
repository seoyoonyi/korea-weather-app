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
import { DistrictSearchSelect } from '@/features/search/ui/DistrictSearchSelect'
import { DEFAULT_WEATHER_TIMEZONE } from '@/shared/config/api'
import {
  formatDistrictLabel,
  getCompactAdministrativeLabel,
} from '@/shared/lib/formatDistrictLabel'
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
    isSearchSelectionLocked && selectedDistrict
      ? selectedDistrict.children
      : deferredSearchKeyword
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
    isSearchSelectionLocked,
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
  const favoriteButtonState = getFavoriteButtonState({
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
  const heroLocationContent = getHeroLocationContent(activeLocationLabel)
  const heroEyebrow = isSearchingPlace ? '검색한 장소' : '나의 위치'

  return (
    <main className="weather-night-shell min-h-screen px-4 py-4 text-slate-50 sm:px-5 sm:py-5 md:px-8 lg:px-10">
      <div className="pointer-events-none absolute left-[8%] top-[26rem] h-56 w-56 rounded-full bg-sky-300/8 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 right-[12%] h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1380px]">
        <header className="flex flex-col gap-4 py-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.34em] text-slate-400">Weather App</p>
          </div>

          <div className="relative z-40 w-full lg:max-w-[42rem]">
            <DistrictSearchSelect
              className="w-full"
              value={searchKeyword}
              suggestions={districtSuggestions}
              statusMessage={searchStatusMessage}
              onValueChange={(nextValue) => {
                setSearchKeyword(nextValue)

                if (
                  selectedDistrict &&
                  normalizeSearchValue(nextValue) !== normalizeSearchValue(selectedDistrict.fullName)
                ) {
                  setSelectedDistrict(null)
                }
              }}
              onSelect={(district) => {
                setSelectedDistrict(district)
                setSearchKeyword(formatDistrictLabel(district.fullName))
              }}
            />
          </div>
        </header>

        <section className="pb-8 pt-9 text-center sm:pb-12 sm:pt-12 md:pb-16 md:pt-16">
          <p className="text-sm font-medium text-slate-300">{heroEyebrow}</p>
          {heroLocationContent.regionLabel ? (
            <p className="mx-auto mt-4 max-w-[30rem] text-sm text-slate-400">
              {heroLocationContent.regionLabel}
            </p>
          ) : null}
          <h2 className="mx-auto mt-3 max-w-[12ch] break-keep text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-7xl">
            {heroLocationContent.title}
          </h2>
          <p className="mt-4 text-[4.4rem] font-extralight leading-none tracking-[-0.08em] text-white sm:mt-5 sm:text-[6.5rem] md:text-[9rem]">
            {activeWeather ? `${Math.round(activeWeather.current.temperature)}°` : '--'}
          </p>
          <div className="mt-3 flex flex-col items-center gap-3 sm:mt-4">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <span className="text-4xl leading-none text-slate-100 sm:text-5xl">{weatherSymbol}</span>
              <div className="text-center sm:text-left">
                <p className="text-xl font-medium text-white sm:text-2xl">{weatherConditionLabel}</p>
                <p className="mt-1 text-sm text-slate-300 sm:text-base">
                  체감 온도 {activeWeather ? `${Math.round(activeWeather.current.apparentTemperature)}°` : '--'}
                </p>
              </div>
            </div>
            <p className="text-lg font-medium text-slate-200 sm:text-xl">
              최고 {today ? `${Math.round(today.temperatureMax)}°` : '--'} / 최저{' '}
              {today ? `${Math.round(today.temperatureMin)}°` : '--'}
            </p>
          </div>

          {renderWeatherMessage({
            isSearchingPlace,
            selectedDistrict,
            currentLocationMessage: currentLocation.message,
            selectedDistrictCoordinates: selectedDistrictCoordinates.data,
            selectedDistrictCoordinatesError: selectedDistrictCoordinates.error,
            weatherError: activeWeatherQuery.error,
          })}
        </section>

        <section className="grid w-full min-w-0 gap-4 sm:gap-6 lg:items-stretch lg:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-w-0 space-y-6 lg:h-full">
            <section className="weather-glass-card relative z-10 w-full min-w-0 overflow-hidden rounded-[1.75rem] p-5 sm:rounded-[2.15rem] sm:p-6 md:p-7 lg:flex lg:h-full lg:flex-col">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">Hourly Forecast</p>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    시간대별 일기예보
                  </h3>
                </div>
                <p className="text-sm text-slate-400">{today ? `${today.date} 기준` : '예보 준비 중'}</p>
              </div>

              <div className="mt-5 overflow-x-auto sm:mt-6 lg:flex lg:flex-1 lg:items-center">
                <div className="flex min-w-max gap-3 pb-2 lg:pb-0">
                  {hourlyTemperatures.length > 0
                    ? hourlyTemperatures.map((hour) => (
                        <article
                          key={hour.time}
                          className="min-w-[96px] rounded-[1.35rem] border border-white/10 bg-white/8 px-3 py-4 text-center backdrop-blur-xl sm:min-w-[122px] sm:rounded-[1.6rem] sm:px-4 sm:py-5"
                        >
                          <p className="text-xs font-medium text-slate-300 sm:text-sm">
                            {formatHour(hour.time, browserTimeZone)}
                          </p>
                          <p className="mt-3 text-2xl leading-none text-slate-100 sm:mt-4 sm:text-3xl">☁</p>
                          <p className="mt-3 text-2xl font-semibold tracking-tight text-white sm:mt-4 sm:text-3xl">
                            {Math.round(hour.temperature)}°
                          </p>
                        </article>
                      ))
                    : Array.from({ length: 8 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-[142px] min-w-[96px] animate-pulse rounded-[1.35rem] bg-white/8 sm:h-[164px] sm:min-w-[122px] sm:rounded-[1.6rem]"
                        />
                      ))}
                </div>
              </div>
            </section>
          </div>

          <div className="min-w-0 space-y-6 lg:h-full">
            <section className="weather-glass-card w-full min-w-0 overflow-hidden rounded-[1.75rem] p-5 sm:rounded-[2.15rem] sm:p-6 md:p-7 lg:h-full">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">Detailed Weather</p>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    상세 날씨 정보
                  </h3>
                </div>
                <span className="max-w-full rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.7rem] font-medium text-slate-300 whitespace-normal break-keep sm:text-xs">
                  {activeLocationLabel}
                </span>
              </div>

              <div className="mt-5 grid gap-3 min-[520px]:grid-cols-2 sm:mt-6 sm:gap-4">
                <InfoRow
                  label="최고 기온"
                  value={today ? `${Math.round(today.temperatureMax)}°` : '--'}
                  className="rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
                  labelClassName="text-slate-300"
                  valueClassName="text-2xl text-white sm:text-3xl"
                />
                <InfoRow
                  label="최저 기온"
                  value={today ? `${Math.round(today.temperatureMin)}°` : '--'}
                  className="rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
                  labelClassName="text-slate-300"
                  valueClassName="text-2xl text-white sm:text-3xl"
                />
                <InfoRow
                  label="강수 확률"
                  value={today ? `${today.precipitationProbabilityMax}%` : '--'}
                  className="rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
                  labelClassName="text-slate-300"
                  valueClassName="text-2xl text-white sm:text-3xl"
                />
                <InfoRow
                  label="업데이트 시각"
                  value={activeWeather ? formatDateTime(activeWeather.current.time, browserTimeZone) : '--'}
                  className="rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
                  labelClassName="text-slate-300"
                  valueClassName="text-lg leading-tight text-white sm:text-xl"
                />
                <InfoRow
                  label="시간대"
                  value={
                    activeWeather?.location.timezone ??
                    selectedDistrictCoordinates.data?.timezone ??
                    browserTimeZone
                  }
                  className="rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
                  labelClassName="text-slate-300"
                  valueClassName="break-all text-lg leading-tight text-white sm:text-xl"
                />
                <InfoRow
                  label="풍속"
                  value={activeWeather ? `${Math.round(activeWeather.current.windSpeed)} km/h` : '--'}
                  className="rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
                  labelClassName="text-slate-300"
                  valueClassName="text-2xl text-white sm:text-3xl"
                />
              </div>
            </section>

          </div>
        </section>

        <section className="mt-6 weather-glass-card w-full min-w-0 overflow-hidden rounded-[1.75rem] p-5 sm:rounded-[2.15rem] sm:p-6 md:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">Favorites</p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                즐겨찾기 장소
              </h3>
            </div>
            <p className="text-sm text-slate-300">
              최대 6개까지 추가할 수 있으며 카드를 누르면 상세 페이지로 이동합니다.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.28em] text-slate-400">Selected Place</p>
                  <h4 className="mt-3 break-keep text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {selectedDistrict ? activeLocationLabel : '선택된 장소 없음'}
                  </h4>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {selectedDistrict
                      ? '현재 선택한 장소를 즐겨찾기에 추가하거나 목록에서 제거할 수 있습니다.'
                      : '검색에서 장소를 선택하면 바로 즐겨찾기에 추가할 수 있습니다.'}
                  </p>
                </div>
                <div className="inline-flex rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-slate-200">
                  {favorites.length} / {FAVORITES_LIMIT}
                </div>
              </div>

              {selectedDistrict ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">좌표</p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {activeCoordinates
                        ? `${activeCoordinates.latitude.toFixed(4)}, ${activeCoordinates.longitude.toFixed(4)}`
                        : '좌표 확인 중'}
                    </p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">상태</p>
                    <p className="mt-2 text-sm font-medium text-white">{favoriteActionMessage}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-slate-400">Action</p>
              <div className="mt-4">
                {selectedFavorite ? (
                  <button
                    className="w-full rounded-full border border-rose-300/30 bg-rose-500/10 px-4 py-4 text-base font-medium text-rose-100 transition hover:bg-rose-500/20"
                    onClick={() => removeFavorite(selectedFavorite.id)}
                  >
                    즐겨찾기에서 삭제
                  </button>
                ) : (
                  <button
                    className="w-full rounded-full border border-transparent bg-white px-4 py-4 text-base font-medium text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-slate-400"
                    disabled={favoriteButtonState.disabled}
                    onClick={handleAddFavorite}
                  >
                    {favoriteButtonState.label}
                  </button>
                )}
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">{favoriteActionMessage}</p>
            </div>
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
  isSearchSelectionLocked,
  districtSuggestions,
  selectedDistrict,
  selectedDistrictCoordinates,
  selectedDistrictCoordinatesError,
  isResolvingSelectedDistrict,
}: {
  isDistrictTreeLoading: boolean
  deferredSearchKeyword: string
  isSearchSelectionLocked: boolean
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

  if (isSearchSelectionLocked) {
    return null
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

function getHeroLocationContent(value: string) {
  const segments = value
    .split(/[·]/)
    .flatMap((segment) => segment.split(/\s+/))
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)

  if (segments.length === 0) {
    return {
      regionLabel: null,
      title: value,
    }
  }

  const [firstSegment, ...restSegments] = segments

  if (firstSegment && isTopLevelRegion(firstSegment) && restSegments.length > 0) {
    return {
      regionLabel: firstSegment,
      title: restSegments.join(' '),
    }
  }

  return {
    regionLabel: null,
    title: getCompactAdministrativeLabel(value, 2),
  }
}

function isTopLevelRegion(value: string) {
  return /(?:도|특별시|광역시|특별자치시|특별자치도)$/.test(value)
}

function getFavoriteButtonState({
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
  if (selectedFavorite) {
    return {
      label: '즐겨찾기에서 삭제',
      disabled: false,
    }
  }

  if (!selectedDistrict) {
    return {
      label: '장소를 먼저 선택하세요',
      disabled: true,
    }
  }

  if (selectedDistrictCoordinatesLoading) {
    return {
      label: '좌표 확인 중',
      disabled: true,
    }
  }

  if (!selectedDistrictCoordinates) {
    return {
      label: '추가할 수 없음',
      disabled: true,
    }
  }

  if (isFavoriteLimitReached) {
    return {
      label: '즐겨찾기 최대 6개',
      disabled: true,
    }
  }

  return {
    label: '즐겨찾기에 추가',
    disabled: false,
  }
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
      <p className="mx-auto mt-8 max-w-xl rounded-full border border-amber-200/20 bg-amber-500/10 px-5 py-3 text-sm text-amber-100 backdrop-blur-xl">
        해당 장소의 정보가 제공되지 않습니다.
      </p>
    )
  }

  if (selectedDistrictCoordinatesError || weatherError) {
    return (
      <p className="mx-auto mt-8 max-w-xl rounded-full border border-rose-200/20 bg-rose-500/12 px-5 py-3 text-sm text-rose-100 backdrop-blur-xl">
        {(selectedDistrictCoordinatesError ?? weatherError)?.message ?? '날씨 정보를 불러오지 못했습니다.'}
      </p>
    )
  }

  if (!isSearchingPlace && currentLocationMessage) {
    return (
      <p className="mx-auto mt-8 max-w-xl rounded-full border border-sky-200/20 bg-sky-400/10 px-5 py-3 text-sm text-sky-100 backdrop-blur-xl">
        {currentLocationMessage}
      </p>
    )
  }

  return null
}

function normalizeSearchValue(value: string) {
  return value.replaceAll(/\s|-/g, '').toLowerCase()
}
