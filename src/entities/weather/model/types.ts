export type WeatherCoordinates = {
  latitude: number
  longitude: number
}

export type GetWeatherForecastParams = WeatherCoordinates & {
  timezone?: string
}

export type CurrentWeather = {
  time: string
  temperature: number
  apparentTemperature: number
  isDay: boolean
  weatherCode: number
  windSpeed: number
}

export type DailyWeatherForecast = {
  date: string
  weatherCode: number
  temperatureMax: number
  temperatureMin: number
  precipitationProbabilityMax: number
}

export type HourlyWeatherForecast = {
  time: string
  temperature: number
}

export type WeatherForecast = {
  location: {
    latitude: number
    longitude: number
    timezone: string
    timezoneAbbreviation: string
  }
  current: CurrentWeather
  daily: DailyWeatherForecast[]
  hourly: HourlyWeatherForecast[]
}
