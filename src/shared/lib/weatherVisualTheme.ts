import type { CSSProperties } from 'react'

export type WeatherVisualTheme = {
  accent: string
  accentSoft: string
  accentStrong: string
  glow: string
  surfaceTop: string
  surfaceBottom: string
}

const SUNNY_THEME: WeatherVisualTheme = {
  accent: '#f6c768',
  accentSoft: 'rgba(246, 199, 104, 0.16)',
  accentStrong: 'rgba(246, 199, 104, 0.32)',
  glow: 'rgba(248, 194, 76, 0.34)',
  surfaceTop: 'rgba(86, 72, 38, 0.88)',
  surfaceBottom: 'rgba(52, 44, 26, 0.94)',
}

const CLOUDY_THEME: WeatherVisualTheme = {
  accent: '#8fb7ff',
  accentSoft: 'rgba(143, 183, 255, 0.14)',
  accentStrong: 'rgba(143, 183, 255, 0.28)',
  glow: 'rgba(122, 176, 255, 0.24)',
  surfaceTop: 'rgba(43, 59, 108, 0.88)',
  surfaceBottom: 'rgba(28, 40, 76, 0.95)',
}

const RAINY_THEME: WeatherVisualTheme = {
  accent: '#70c6ff',
  accentSoft: 'rgba(112, 198, 255, 0.16)',
  accentStrong: 'rgba(112, 198, 255, 0.3)',
  glow: 'rgba(68, 184, 255, 0.3)',
  surfaceTop: 'rgba(32, 65, 92, 0.88)',
  surfaceBottom: 'rgba(21, 38, 58, 0.95)',
}

const SNOWY_THEME: WeatherVisualTheme = {
  accent: '#dff5ff',
  accentSoft: 'rgba(223, 245, 255, 0.16)',
  accentStrong: 'rgba(223, 245, 255, 0.32)',
  glow: 'rgba(191, 233, 255, 0.32)',
  surfaceTop: 'rgba(67, 87, 103, 0.88)',
  surfaceBottom: 'rgba(39, 52, 66, 0.95)',
}

const STORM_THEME: WeatherVisualTheme = {
  accent: '#ff9d68',
  accentSoft: 'rgba(255, 157, 104, 0.16)',
  accentStrong: 'rgba(255, 157, 104, 0.32)',
  glow: 'rgba(255, 126, 83, 0.34)',
  surfaceTop: 'rgba(91, 49, 42, 0.88)',
  surfaceBottom: 'rgba(57, 29, 28, 0.95)',
}

const FOGGY_THEME: WeatherVisualTheme = {
  accent: '#9fc6e4',
  accentSoft: 'rgba(159, 198, 228, 0.14)',
  accentStrong: 'rgba(159, 198, 228, 0.26)',
  glow: 'rgba(159, 198, 228, 0.2)',
  surfaceTop: 'rgba(56, 74, 98, 0.88)',
  surfaceBottom: 'rgba(34, 48, 68, 0.95)',
}

const LOADING_THEME: WeatherVisualTheme = {
  accent: '#8ad1ff',
  accentSoft: 'rgba(138, 209, 255, 0.14)',
  accentStrong: 'rgba(138, 209, 255, 0.24)',
  glow: 'rgba(125, 180, 255, 0.24)',
  surfaceTop: 'rgba(46, 58, 96, 0.86)',
  surfaceBottom: 'rgba(27, 35, 64, 0.95)',
}

export function getWeatherVisualTheme(weatherCode?: number | null) {
  if (weatherCode === null || weatherCode === undefined) {
    return LOADING_THEME
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return STORM_THEME
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return SNOWY_THEME
  }

  if ([61, 63, 65, 66, 67, 68, 80, 81, 82].includes(weatherCode)) {
    return RAINY_THEME
  }

  if ([45, 48].includes(weatherCode)) {
    return FOGGY_THEME
  }

  if ([3].includes(weatherCode)) {
    return CLOUDY_THEME
  }

  if ([1, 2].includes(weatherCode)) {
    return CLOUDY_THEME
  }

  return SUNNY_THEME
}

export function createWeatherThemeStyle(
  theme: WeatherVisualTheme,
  mode: 'current' | 'search' | 'favorite' = 'current',
): CSSProperties {
  const contextGlow =
    mode === 'search'
      ? 'rgba(249, 168, 76, 0.2)'
      : mode === 'favorite'
        ? 'rgba(244, 114, 182, 0.16)'
        : 'rgba(96, 165, 250, 0.18)'

  const contextAccent =
    mode === 'search'
      ? 'rgba(249, 168, 76, 0.72)'
      : mode === 'favorite'
        ? 'rgba(236, 72, 153, 0.62)'
        : 'rgba(96, 165, 250, 0.72)'

  return {
    '--weather-accent': theme.accent,
    '--weather-accent-soft': theme.accentSoft,
    '--weather-accent-strong': theme.accentStrong,
    '--weather-glow': theme.glow,
    '--weather-surface-top': theme.surfaceTop,
    '--weather-surface-bottom': theme.surfaceBottom,
    '--weather-context-glow': contextGlow,
    '--weather-context-accent': contextAccent,
  } as CSSProperties
}
