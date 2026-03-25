import { useEffect, useState } from 'react'
import type { WeatherCoordinates } from '@/entities/weather/model/types'
import { BIG_DATA_CLOUD_REVERSE_GEOCODE_API_URL } from '@/shared/config/api'

const SEOUL_COORDINATES: WeatherCoordinates = {
  latitude: 37.5665,
  longitude: 126.978,
}

type CurrentLocationState = {
  coordinates: WeatherCoordinates
  label: string
  source: 'geolocation' | 'fallback'
  isResolving: boolean
  message: string | null
}

export function useCurrentLocation() {
  const [state, setState] = useState<CurrentLocationState>({
    coordinates: SEOUL_COORDINATES,
    label: '서울',
    source: 'fallback',
    isResolving: true,
    message: '현재 위치를 확인하는 동안 서울 날씨를 먼저 표시합니다.',
  })

  useEffect(() => {
    let cancelled = false
    const reverseGeocodeAbortController = new AbortController()

    if (!navigator.geolocation) {
      setState((previousState) => ({
        ...previousState,
        isResolving: false,
        message: '브라우저에서 위치 정보를 지원하지 않아 서울 기준 날씨를 표시합니다.',
      }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        const label = await getLocationLabel(coordinates, reverseGeocodeAbortController.signal)

        if (cancelled) {
          return
        }

        setState({
          coordinates,
          label,
          source: 'geolocation',
          isResolving: false,
          message: null,
        })
      },
      () => {
        if (cancelled) {
          return
        }

        setState((previousState) => ({
          ...previousState,
          isResolving: false,
          message: '위치 권한을 확인할 수 없어 서울 기준 날씨를 표시합니다.',
        }))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000 * 60 * 5,
      },
    )

    return () => {
      cancelled = true
      reverseGeocodeAbortController.abort()
    }
  }, [])

  return state
}

type ReverseGeocodeResponse = {
  city?: string
  locality?: string
  principalSubdivision?: string
}

async function getLocationLabel(coordinates: WeatherCoordinates, signal: AbortSignal) {
  try {
    const requestUrl = new URL(BIG_DATA_CLOUD_REVERSE_GEOCODE_API_URL)

    requestUrl.searchParams.set('latitude', String(coordinates.latitude))
    requestUrl.searchParams.set('longitude', String(coordinates.longitude))
    requestUrl.searchParams.set('localityLanguage', 'ko')

    const response = await fetch(requestUrl, {
      headers: {
        Accept: 'application/json',
      },
      signal,
    })

    if (!response.ok) {
      return '현재 위치'
    }

    const data = (await response.json()) as ReverseGeocodeResponse
    return formatLocationLabel(data)
  } catch {
    return '현재 위치'
  }
}

function formatLocationLabel({ locality, city, principalSubdivision }: ReverseGeocodeResponse) {
  const labelParts = Array.from(
    new Set([locality, city, principalSubdivision].filter((value): value is string => Boolean(value))),
  )

  return labelParts.length > 0 ? labelParts.join(' · ') : '현재 위치'
}
