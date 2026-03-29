export function deriveWeatherCode({
  precipitationType,
  sky,
  lightning,
}: {
  precipitationType: number | null
  sky: number | null
  lightning: number | null
}) {
  if (lightning !== null && lightning > 0) {
    return 95
  }

  switch (precipitationType) {
    case 1:
    case 5:
      return 61
    case 2:
    case 6:
      return 68
    case 3:
    case 7:
      return 71
    case 4:
      return 80
    default:
      break
  }

  switch (sky) {
    case 1:
      return 0
    case 3:
      return 2
    case 4:
      return 3
    default:
      return 1
  }
}

export function toKilometersPerHour(metersPerSecond: number) {
  return Math.round(metersPerSecond * 3.6 * 10) / 10
}
