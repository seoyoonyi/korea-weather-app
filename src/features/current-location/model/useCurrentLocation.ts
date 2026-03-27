import { useEffect, useState } from 'react'
import type { WeatherCoordinates } from '@/entities/weather/model/types'
import { NOMINATIM_REVERSE_API_URL } from '@/shared/config/api'

const SEOUL_COORDINATES: WeatherCoordinates = {
  latitude: 37.5665,
  longitude: 126.978,
}

type ReverseGeocodeResponse = {
  address?: {
    state?: string
    province?: string
    city?: string
    county?: string
    municipality?: string
    city_district?: string
    borough?: string
    suburb?: string
    town?: string
    village?: string
    quarter?: string
    neighbourhood?: string
    hamlet?: string
  }
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
    label: '서울특별시',
    source: 'fallback',
    isResolving: true,
    message: '현재 위치를 확인하는 동안 서울특별시 날씨를 먼저 표시합니다.',
  })

  useEffect(() => {
    let cancelled = false
    const abortController = new AbortController()

    if (!navigator.geolocation) {
      setState((previousState) => ({
        ...previousState,
        isResolving: false,
        message: '브라우저에서 위치 정보를 지원하지 않아 서울특별시 기준 날씨를 표시합니다.',
      }))
      return
    }

    resolveCurrentPosition()

    return () => {
      cancelled = true
      abortController.abort()
    }

    function resolveCurrentPosition() {
      requestCurrentPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000 * 60 * 5,
        },
        async (position) => {
          if (cancelled) {
            return
          }

          const coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          const label = await resolveLocationLabel(coordinates, abortController.signal)

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
        (error) => {
          if (cancelled) {
            return
          }

          if (error.code === error.PERMISSION_DENIED) {
            setState((previousState) => ({
              ...previousState,
              isResolving: false,
              message: '브라우저 위치 권한이 거부되어 서울특별시 기준 날씨를 표시합니다.',
            }))
            return
          }

          requestCurrentPosition(
            {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 1000 * 60 * 10,
            },
            async (fallbackPosition) => {
              if (cancelled) {
                return
              }

              const coordinates = {
                latitude: fallbackPosition.coords.latitude,
                longitude: fallbackPosition.coords.longitude,
              }
              const label = await resolveLocationLabel(coordinates, abortController.signal)

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
            (fallbackError) => {
              if (cancelled) {
                return
              }

              setState((previousState) => ({
                ...previousState,
                isResolving: false,
                message: getGeolocationErrorMessage(fallbackError),
              }))
            },
          )
        },
      )
    }
  }, [])

  return state
}

function requestCurrentPosition(
  options: PositionOptions,
  onSuccess: PositionCallback,
  onError: PositionErrorCallback,
) {
  navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
}

function getGeolocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return '브라우저 위치 권한이 거부되어 서울특별시 기준 날씨를 표시합니다.'
  }

  if (error.code === error.TIMEOUT) {
    return '현재 위치 확인 시간이 초과되어 서울특별시 기준 날씨를 표시합니다.'
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return '현재 위치를 가져올 수 없어 서울특별시 기준 날씨를 표시합니다.'
  }

  return '현재 위치 확인에 실패해 서울특별시 기준 날씨를 표시합니다.'
}

async function resolveLocationLabel(coordinates: WeatherCoordinates, signal: AbortSignal) {
  const params = new URLSearchParams({
    lat: coordinates.latitude.toString(),
    lon: coordinates.longitude.toString(),
    format: 'jsonv2',
    'accept-language': 'ko',
    zoom: '18',
  })

  try {
    const response = await fetch(`${NOMINATIM_REVERSE_API_URL}?${params.toString()}`, {
      signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return '현재 위치'
    }

    const data = (await response.json()) as ReverseGeocodeResponse
    return formatAdministrativeLabel(data.address) ?? '현재 위치'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return '현재 위치'
    }

    return '현재 위치'
  }
}

function formatAdministrativeLabel(address: ReverseGeocodeResponse['address']) {
  if (!address) {
    return null
  }

  const segments = [
    getFirstNonEmptyValue(address.state, address.province),
    getFirstNonEmptyValue(address.city, address.county, address.municipality),
    getFirstNonEmptyValue(address.city_district, address.borough),
    getFirstNonEmptyValue(
      address.suburb,
      address.town,
      address.village,
      address.quarter,
      address.neighbourhood,
      address.hamlet,
    ),
  ].filter((segment): segment is string => Boolean(segment))

  if (segments.length === 0) {
    return null
  }

  return Array.from(new Set(segments)).join(' ')
}

function getFirstNonEmptyValue(...values: Array<string | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim()
}
