import { useEffect, useState } from 'react'
import type { WeatherCoordinates } from '@/entities/weather/model/types'

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

    if (!navigator.geolocation) {
      setState((previousState) => ({
        ...previousState,
        isResolving: false,
        message: '브라우저에서 위치 정보를 지원하지 않아 서울 기준 날씨를 표시합니다.',
      }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        if (cancelled) {
          return
        }

        setState({
          coordinates,
          label: '현재 위치',
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
    }
  }, [])

  return state
}
