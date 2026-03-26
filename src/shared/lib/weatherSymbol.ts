export function getWeatherSymbol(weatherCode: number) {
  if ([95, 96, 99].includes(weatherCode)) {
    return '⛈'
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return '❄'
  }

  if ([61, 63, 65, 66, 67, 68, 80, 81, 82].includes(weatherCode)) {
    return '☔'
  }

  if ([45, 48].includes(weatherCode)) {
    return '〰'
  }

  if ([1, 2].includes(weatherCode)) {
    return '⛅'
  }

  if (weatherCode === 3) {
    return '☁'
  }

  return '☀'
}
