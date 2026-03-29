import type { DailyWeatherForecast, HourlyWeatherForecast } from '@/entities/weather/model/types'

export type KmaGridCoordinates = {
  nx: number
  ny: number
}

export type KmaApiResponse<TItem> = {
  response?: {
    header?: {
      resultCode?: string
      resultMsg?: string
    }
    body?: {
      items?: {
        item?: TItem[] | TItem
      }
    }
  }
}

export type KmaNowcastItem = {
  baseDate: string
  baseTime: string
  category: string
  nx: number
  ny: number
  obsrValue: string
}

export type KmaVillageForecastItem = {
  baseDate: string
  baseTime: string
  category: string
  fcstDate: string
  fcstTime: string
  fcstValue: string
  nx: number
  ny: number
}

export type CurrentObservation = {
  time: string
  temperature: number | null
  windSpeed: number | null
  precipitationType: number | null
}

export type ForecastPoint = {
  time: string
  temperature: number | null
  precipitationProbability: number | null
  sky: number | null
  precipitationType: number | null
  lightning: number | null
  windSpeed: number | null
}

export type ParsedVillageForecast = {
  daily: DailyWeatherForecast[]
  hourly: HourlyWeatherForecast[]
  points: ForecastPoint[]
}
