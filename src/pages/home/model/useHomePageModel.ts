import { useDeferredValue, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { DistrictCoords } from '@/entities/district/api/geocodeDistrict'
import { useDistrictCoords } from '@/entities/district/api/useDistrictCoords'
import { useDistrictTree } from '@/entities/district/api/useDistrictTree'
import type { DistrictNode } from '@/entities/district/model/types'
import { searchDistricts } from '@/entities/district/model/searchDistricts'
import { useWeatherForecastQuery } from '@/entities/weather/api/useWeatherForecastQuery'
import { getWeatherConditionLabel } from '@/entities/weather/model/getWeatherConditionLabel'
import { useFavoriteWeather } from '@/features/favorite/api/useFavoriteWeather'
import {
  FAVORITES_LIMIT,
  useFavorites,
} from '@/features/favorite/model/FavoritesProvider'
import { useCurrentLocation } from '@/features/current-location/model/useCurrentLocation'
import { DEFAULT_WEATHER_TIMEZONE } from '@/shared/config/api'
import {
  formatDistrictLabel,
  getCompactAdministrativeLabel,
} from '@/shared/lib/formatDistrictLabel'
import { formatDateTime, getTodayHourlyTemperatures } from '@/shared/lib/weather'
import { getWeatherSymbol } from '@/shared/lib/weatherSymbol'

const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_WEATHER_TIMEZONE
const SELECTED_DISTRICT_SEARCH_PARAM = 'district'

export type HomeHeroLocationContent = {
  regionLabel: string | null
  title: string
}

export type HomeFavoriteButtonState = {
  label: string
  disabled: boolean
}

export type HomeWeatherMessage = {
  tone: 'warning' | 'error' | 'info'
  text: string
}

export function useHomePageModel() {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictNode | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const deferredSearchKeyword = useDeferredValue(searchKeyword.trim())
  const selectedDistrictParam = searchParams.get(SELECTED_DISTRICT_SEARCH_PARAM)?.trim() ?? ''

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

  useEffect(() => {
    if (!districtTree) {
      return
    }

    if (!selectedDistrictParam) {
      setSelectedDistrict((currentSelectedDistrict) => {
        if (!currentSelectedDistrict) {
          return currentSelectedDistrict
        }

        setSearchKeyword((currentKeyword) =>
          normalizeSearchValue(currentKeyword) ===
          normalizeSearchValue(currentSelectedDistrict.fullName)
            ? ''
            : currentKeyword,
        )

        return null
      })
      return
    }

    const matchedDistrict = districtTree.allNodes.find(
      (district) => district.fullName === selectedDistrictParam,
    )

    if (!matchedDistrict) {
      setSelectedDistrict(null)
      setSearchKeyword('')
      setSearchParams(
        (currentSearchParams) => {
          const nextSearchParams = new URLSearchParams(currentSearchParams)
          nextSearchParams.delete(SELECTED_DISTRICT_SEARCH_PARAM)
          return nextSearchParams
        },
        { replace: true },
      )
      return
    }

    setSelectedDistrict((currentSelectedDistrict) =>
      currentSelectedDistrict?.fullName === matchedDistrict.fullName
        ? currentSelectedDistrict
        : matchedDistrict,
    )

    const formattedDistrictLabel = formatDistrictLabel(matchedDistrict.fullName)
    setSearchKeyword((currentKeyword) =>
      normalizeSearchValue(currentKeyword) === normalizeSearchValue(formattedDistrictLabel)
        ? currentKeyword
        : formattedDistrictLabel,
    )
  }, [districtTree, selectedDistrictParam, setSearchParams])

  const isSearchSelectionLocked =
    selectedDistrict !== null &&
    normalizeSearchValue(searchKeyword) === normalizeSearchValue(selectedDistrict.fullName)
  const districtSuggestions =
    isSearchSelectionLocked && selectedDistrict
      ? selectedDistrict.children
      : deferredSearchKeyword
        ? searchDistricts(districtTree?.allNodes ?? [], deferredSearchKeyword)
        : []

  const selectedDistrictCoordinatesQuery = useDistrictCoords(selectedDistrict)
  const selectedDistrictCoordinates = selectedDistrictCoordinatesQuery.data
  const currentLocationCoordinates = currentLocation.coordinates

  const currentWeatherQuery = useWeatherForecastQuery(
    {
      latitude: currentLocationCoordinates?.latitude ?? 0,
      longitude: currentLocationCoordinates?.longitude ?? 0,
      timezone: browserTimeZone,
    },
    {
      enabled: !isSearchingPlace && Boolean(currentLocationCoordinates),
    },
  )

  const selectedDistrictWeatherQuery = useWeatherForecastQuery(
    {
      latitude: selectedDistrictCoordinates?.latitude ?? 0,
      longitude: selectedDistrictCoordinates?.longitude ?? 0,
      timezone: selectedDistrictCoordinates?.timezone ?? browserTimeZone,
    },
    {
      enabled: Boolean(selectedDistrictCoordinates),
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
    selectedDistrictCoordinates?.label,
    currentLocation.label,
  )
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
    selectedDistrictCoordinates,
    selectedDistrictCoordinatesError: selectedDistrictCoordinatesQuery.error,
    isResolvingSelectedDistrict: selectedDistrictCoordinatesQuery.isLoading,
  })
  const favoriteActionMessage = getFavoriteActionMessage({
    selectedDistrict,
    selectedFavorite,
    isFavoriteLimitReached,
    selectedDistrictCoordinates,
    selectedDistrictCoordinatesLoading: selectedDistrictCoordinatesQuery.isLoading,
  })
  const favoriteButtonState = getFavoriteButtonState({
    selectedDistrict,
    selectedFavorite,
    isFavoriteLimitReached,
    selectedDistrictCoordinates,
    selectedDistrictCoordinatesLoading: selectedDistrictCoordinatesQuery.isLoading,
  })
  const weatherConditionLabel = activeWeather
    ? getWeatherConditionLabel(activeWeather.current.weatherCode)
    : '데이터 대기 중'
  const weatherSymbol = activeWeather ? getWeatherSymbol(activeWeather.current.weatherCode) : '○'
  const heroLocationContent = getHeroLocationContent(activeLocationLabel)
  const heroEyebrow = isSearchingPlace ? '검색한 장소' : '현재 위치'
  const weatherMessage = getWeatherMessage({
    isSearchingPlace,
    selectedDistrict,
    currentLocationMessage: currentLocation.message,
    selectedDistrictCoordinates,
    selectedDistrictCoordinatesError: selectedDistrictCoordinatesQuery.error,
    weatherError: activeWeatherQuery.error,
  })
  const activeTimeZone =
    activeWeather?.location.timezone ?? selectedDistrictCoordinates?.timezone ?? browserTimeZone
  const activeUpdatedAt = activeWeather
    ? formatDateTime(activeWeather.current.time, browserTimeZone)
    : '--'

  const handleSearchKeywordChange = (nextValue: string) => {
    setSearchKeyword(nextValue)

    if (
      selectedDistrict &&
      normalizeSearchValue(nextValue) !== normalizeSearchValue(selectedDistrict.fullName)
    ) {
      setSelectedDistrict(null)
      setSearchParams(
        (currentSearchParams) => {
          const nextSearchParams = new URLSearchParams(currentSearchParams)
          nextSearchParams.delete(SELECTED_DISTRICT_SEARCH_PARAM)
          return nextSearchParams
        },
        { replace: true },
      )
    }
  }

  const handleSelectDistrict = (district: DistrictNode) => {
    setSelectedDistrict(district)
    setSearchKeyword(formatDistrictLabel(district.fullName))
    setSearchParams((currentSearchParams) => {
      const nextSearchParams = new URLSearchParams(currentSearchParams)
      nextSearchParams.set(SELECTED_DISTRICT_SEARCH_PARAM, district.fullName)
      return nextSearchParams
    })
  }

  const handleFavoriteAction = () => {
    if (selectedFavorite) {
      removeFavorite(selectedFavorite.id)
      return
    }

    if (!selectedDistrict || !selectedDistrictCoordinates) {
      return
    }

    addFavorite({
      districtFullName: selectedDistrict.fullName,
      districtName: selectedDistrict.name,
      alias: selectedDistrict.name,
      label: selectedDistrictCoordinates.label,
      latitude: selectedDistrictCoordinates.latitude,
      longitude: selectedDistrictCoordinates.longitude,
      timezone: selectedDistrictCoordinates.timezone ?? browserTimeZone,
    })
  }

  return {
    searchKeyword,
    districtSuggestions,
    searchStatusMessage,
    favorites,
    favoriteWeatherQueries,
    currentLocationMessage: currentLocation.message,
    selectedDistrict,
    selectedDistrictCoordinates,
    selectedDistrictCoordinatesError: selectedDistrictCoordinatesQuery.error,
    isSearchingPlace,
    selectedFavorite,
    favoriteButtonState,
    favoriteActionMessage,
    heroEyebrow,
    heroLocationContent,
    activeWeather,
    activeLocationLabel,
    activeTimeZone,
    activeUpdatedAt,
    today,
    hourlyTemperatures,
    weatherConditionLabel,
    weatherSymbol,
    weatherMessage,
    onSearchKeywordChange: handleSearchKeywordChange,
    onSelectDistrict: handleSelectDistrict,
    onFavoriteAction: handleFavoriteAction,
    onRemoveFavorite: removeFavorite,
    onUpdateFavoriteAlias: updateFavoriteAlias,
  }
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
  selectedDistrictCoordinates: DistrictCoords | null | undefined
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
    return '선택한 장소의 정보를 확인할 수 없습니다.'
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
  selectedDistrictCoordinates: DistrictCoords | null | undefined
  selectedDistrictCoordinatesLoading: boolean
}) {
  if (!selectedDistrict) {
    return '검색으로 장소를 선택하면 즐겨찾기에 저장할 수 있습니다.'
  }

  if (selectedFavorite) {
    return '이미 즐겨찾기에 저장된 장소입니다.'
  }

  if (selectedDistrictCoordinatesLoading) {
    return '선택한 장소의 좌표를 확인하는 중입니다.'
  }

  if (!selectedDistrictCoordinates) {
    return '선택한 장소는 즐겨찾기에 저장할 수 없습니다.'
  }

  if (isFavoriteLimitReached) {
    return '즐겨찾기는 최대 6개까지 저장할 수 있습니다.'
  }

  return '선택한 장소를 즐겨찾기에 저장할 수 있습니다.'
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
  selectedDistrictCoordinates: DistrictCoords | null | undefined
  selectedDistrictCoordinatesLoading: boolean
}) {
  if (selectedFavorite) {
    return {
      label: '즐겨찾기 삭제',
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
      label: '저장할 수 없음',
      disabled: true,
    }
  }

  if (isFavoriteLimitReached) {
    return {
      label: '최대 6개까지 저장',
      disabled: true,
    }
  }

  return {
    label: '즐겨찾기에 저장',
    disabled: false,
  }
}

function getHeroLocationContent(value: string): HomeHeroLocationContent {
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

function getWeatherMessage({
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
  selectedDistrictCoordinates: DistrictCoords | null | undefined
  selectedDistrictCoordinatesError: Error | null
  weatherError: Error | null
}): HomeWeatherMessage | null {
  if (isSearchingPlace && selectedDistrict && !selectedDistrictCoordinates && !selectedDistrictCoordinatesError) {
    return {
      tone: 'warning',
      text: '선택한 장소의 정보를 확인할 수 없습니다.',
    }
  }

  if (selectedDistrictCoordinatesError || weatherError) {
    return {
      tone: 'error',
      text:
        (selectedDistrictCoordinatesError ?? weatherError)?.message ??
        '날씨 정보를 불러오지 못했습니다.',
    }
  }

  if (!isSearchingPlace && currentLocationMessage) {
    return {
      tone: 'info',
      text: currentLocationMessage,
    }
  }

  return null
}

function normalizeSearchValue(value: string) {
  return value.replaceAll(/\s|-/g, '').toLowerCase()
}
