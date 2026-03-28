import { useLayoutEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { useWeatherForecastQuery } from '@/entities/weather/api/useWeatherForecastQuery'
import { getWeatherConditionLabel } from '@/entities/weather/model/getWeatherConditionLabel'
import { useFavorites } from '@/features/favorite/model/FavoritesProvider'
import { DEFAULT_WEATHER_TIMEZONE } from '@/shared/config/api'
import { formatDateTime, getTodayHourlyTemperatures } from '@/shared/lib/weather'
import { getWeatherSymbol } from '@/shared/lib/weatherSymbol'
import { HourlyTemperatureSection } from '@/shared/ui/HourlyTemperatureSection'
import { InfoRow } from '@/shared/ui/InfoRow'
import { MetricCard } from '@/shared/ui/MetricCard'

const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_WEATHER_TIMEZONE

export function FavoriteDetailPage() {
  const { favoriteId } = useParams()
  const { findFavoriteById } = useFavorites()
  const favorite = favoriteId ? findFavoriteById(favoriteId) : undefined

  useLayoutEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    })
  }, [favoriteId])

  const weatherQuery = useWeatherForecastQuery(
    {
      latitude: favorite?.latitude ?? 0,
      longitude: favorite?.longitude ?? 0,
      timezone: favorite?.timezone ?? browserTimeZone,
    },
    {
      enabled: Boolean(favorite),
    },
  )

  if (!favoriteId) {
    return <Navigate to="/" replace />
  }

  if (!favorite) {
    return (
      <main className="weather-night-shell min-h-screen px-4 py-6 text-slate-50 sm:px-5 md:px-8 lg:px-10">
        <div className="pointer-events-none absolute left-[10%] top-[18rem] h-56 w-56 rounded-full bg-sky-300/8 blur-3xl" />
        <div className="pointer-events-none absolute bottom-20 right-[12%] h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl pt-10 sm:pt-16">
          <section className="weather-glass-card rounded-[2rem] p-8 sm:p-10">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              즐겨찾기 장소를 찾을 수 없습니다.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
              저장된 장소가 삭제되었거나 잘못된 경로로 들어온 것 같아요. 홈에서 다시 장소를 선택해 주세요.
            </p>
            <Link
              className="mt-8 inline-flex rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/14"
              aria-label="홈으로 돌아가기"
              to="/"
            >
              {'<-'}
            </Link>
          </section>
        </div>
      </main>
    )
  }

  const weather = weatherQuery.data
  const today = weather?.daily[0]
  const hourlyTemperatures = weather ? getTodayHourlyTemperatures(weather.hourly, today?.date) : []
  const weatherConditionLabel = weather ? getWeatherConditionLabel(weather.current.weatherCode) : '데이터 대기 중'
  const weatherSymbol = weather ? getWeatherSymbol(weather.current.weatherCode) : '○'
  const favoritePath = formatFavoritePath(favorite.districtFullName, favorite.districtName)
  const heroDescription = getHeroDescription(favorite.label, favoritePath, favorite.alias)
  const statusNotice = getStatusNotice({
    isLoading: weatherQuery.isLoading,
    isFetching: weatherQuery.isFetching,
    hasError: Boolean(weatherQuery.error),
  })

  return (
    <main className="weather-night-shell min-h-screen px-4 py-4 text-slate-50 sm:px-5 sm:py-5 md:px-8 lg:px-10">
      <div className="pointer-events-none absolute left-[8%] top-[24rem] h-56 w-56 rounded-full bg-sky-300/8 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 right-[12%] h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />

      <div className="relative mx-auto w-full min-w-0 max-w-[1380px]">
        <header className="flex flex-col gap-4 py-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              className="inline-flex items-center rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/12"
              aria-label="홈으로 돌아가기"
              to="/"
            >
              {'<-'}
            </Link>
          </div>

          {statusNotice ? (
            <div
              className={`weather-badge rounded-full border px-4 py-3 text-sm font-medium backdrop-blur-xl ${
                statusNotice.tone === 'error'
                  ? 'border-rose-200/25 bg-rose-500/12 text-rose-100'
                  : 'border-white/10 bg-white/8 text-slate-100'
              }`}
            >
              {statusNotice.label}
            </div>
          ) : null}
        </header>

        <section className="pb-8 pt-9 text-center sm:pb-12 sm:pt-12 md:pb-16 md:pt-16">
          <p className="text-sm font-medium text-slate-300">저장된 장소</p>
          <p className="mx-auto mt-4 max-w-[34rem] text-sm text-slate-400">{favoritePath}</p>
          <h1 className="mx-auto mt-3 max-w-[12ch] break-keep text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-7xl">
            {favorite.alias}
          </h1>
          {heroDescription ? (
            <p className="mx-auto mt-4 max-w-[36rem] text-sm leading-6 text-slate-300 sm:text-base">
              {heroDescription}
            </p>
          ) : null}
          <p className="mt-4 text-[4.4rem] font-extralight leading-none tracking-[-0.08em] text-white sm:mt-5 sm:text-[6.5rem] md:text-[9rem]">
            {weather ? `${Math.round(weather.current.temperature)}°` : '--'}
          </p>
          <div className="mt-3 flex flex-col items-center gap-3 sm:mt-4">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
              <span className="text-4xl leading-none text-slate-100 sm:text-5xl">{weatherSymbol}</span>
              <div className="text-center sm:text-left">
                <p className="text-xl font-medium text-white sm:text-2xl">{weatherConditionLabel}</p>
                <p className="mt-1 text-sm text-slate-300 sm:text-base">
                  체감 온도 {weather ? `${Math.round(weather.current.apparentTemperature)}°` : '--'}
                </p>
              </div>
            </div>
            <p className="text-lg font-medium text-slate-200 sm:text-xl">
              최고 {today ? `${Math.round(today.temperatureMax)}°` : '--'} / 최저{' '}
              {today ? `${Math.round(today.temperatureMin)}°` : '--'}
            </p>
          </div>

          {weatherQuery.error ? (
            <p className="mx-auto mt-8 max-w-xl rounded-full border border-rose-200/20 bg-rose-500/12 px-5 py-3 text-sm text-rose-100 backdrop-blur-xl">
              {weatherQuery.error.message}
            </p>
          ) : null}
        </section>

        <section className="grid w-full min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-start">
          <div className="min-w-0 space-y-6">
            <section className="weather-glass-card rounded-[1.75rem] p-5 sm:rounded-[2.15rem] sm:p-6 md:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-medium tracking-[0.2em] text-slate-400">핵심 지표</p>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    핵심 날씨 지표
                  </h2>
                </div>
                <span className="weather-badge rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.7rem] font-medium text-slate-300 whitespace-normal break-keep sm:self-auto sm:text-xs">
                  {weather?.location.timezone ?? favorite.timezone}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-3">
                <MetricCard
                  label="현재 기온"
                  value={weather ? `${Math.round(weather.current.temperature)}°` : '--'}
                  helper={weatherConditionLabel}
                  tone="glass"
                  className="rounded-[1.35rem] sm:rounded-[1.7rem]"
                />
                <MetricCard
                  label="당일 최저"
                  value={today ? `${Math.round(today.temperatureMin)}°` : '--'}
                  helper={today ? `${today.date}` : '데이터 대기 중'}
                  tone="glass"
                  className="rounded-[1.35rem] sm:rounded-[1.7rem]"
                />
                <MetricCard
                  label="당일 최고"
                  value={today ? `${Math.round(today.temperatureMax)}°` : '--'}
                  helper={weather ? `체감 ${Math.round(weather.current.apparentTemperature)}°` : '데이터 대기 중'}
                  tone="glass"
                  className="rounded-[1.35rem] sm:rounded-[1.7rem]"
                />
              </div>
            </section>

            <HourlyTemperatureSection
              dateLabel={today ? `${today.date} 기준` : undefined}
              hourlyTemperatures={hourlyTemperatures}
              currentTemperature={weather?.current.temperature}
              apparentTemperature={weather?.current.apparentTemperature}
              minTemperature={today?.temperatureMin}
              maxTemperature={today?.temperatureMax}
              timeZone={weather?.location.timezone ?? favorite.timezone ?? browserTimeZone}
            />
          </div>

          <aside className="weather-glass-card rounded-[1.75rem] p-5 sm:rounded-[2.15rem] sm:p-6 md:p-7 lg:sticky lg:top-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium tracking-[0.2em] text-slate-400">장소 정보</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  장소 상세 정보
                </h2>
              </div>
              <span className="weather-badge rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.7rem] font-medium text-slate-300 whitespace-normal break-keep sm:self-auto sm:text-xs">
                저장된 즐겨찾기
              </span>
            </div>

            <div className="mt-5 grid gap-3 min-[560px]:grid-cols-2 sm:mt-6 sm:gap-4">
              <InfoRow
                label="표시 이름"
                value={favorite.alias}
                className="weather-soft-panel rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
                labelClassName="text-slate-300"
                valueClassName="text-lg leading-tight text-white sm:text-xl"
              />
              <InfoRow
                label="위치 라벨"
                value={favorite.label}
                className="weather-soft-panel rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
                labelClassName="text-slate-300"
                valueClassName="text-lg leading-tight text-white sm:text-xl"
              />
              <InfoRow
                label="행정구역 경로"
                value={favoritePath}
                className="weather-soft-panel rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
                labelClassName="text-slate-300"
                valueClassName="text-lg leading-tight text-white sm:text-xl"
              />
              <InfoRow
                label="좌표"
                value={`위도 ${favorite.latitude.toFixed(4)}, 경도 ${favorite.longitude.toFixed(4)}`}
                className="weather-soft-panel rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
                labelClassName="text-slate-300"
                valueClassName="text-lg leading-tight text-white sm:text-xl"
              />
              <InfoRow
                label="시간대"
                value={weather?.location.timezone ?? favorite.timezone}
                className="weather-soft-panel rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
                labelClassName="text-slate-300"
                valueClassName="break-all text-lg leading-tight text-white sm:text-xl"
              />
              <InfoRow
                label="업데이트 시각"
                value={weather ? formatDateTime(weather.current.time, browserTimeZone) : '--'}
                className="weather-soft-panel rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
                labelClassName="text-slate-300"
                valueClassName="text-lg leading-tight text-white sm:text-xl"
              />
              <InfoRow
                label="강수 확률"
                value={today ? `${today.precipitationProbabilityMax}%` : '--'}
                className="weather-soft-panel rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
                labelClassName="text-slate-300"
                valueClassName="text-lg leading-tight text-white sm:text-xl"
              />
              <InfoRow
                label="풍속"
                value={weather ? `${Math.round(weather.current.windSpeed)} km/h` : '--'}
                className="weather-soft-panel rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
                labelClassName="text-slate-300"
                valueClassName="text-lg leading-tight text-white sm:text-xl"
              />
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

function getStatusNotice({
  isLoading,
  isFetching,
  hasError,
}: {
  isLoading: boolean
  isFetching: boolean
  hasError: boolean
}) {
  if (hasError) {
    return {
      label: '예보 확인 필요',
      tone: 'error' as const,
    }
  }

  if (isLoading) {
    return {
      label: '예보 불러오는 중',
      tone: 'default' as const,
    }
  }

  if (isFetching) {
    return {
      label: '예보 갱신 중',
      tone: 'default' as const,
    }
  }

  return null
}

function formatFavoritePath(districtFullName: string, districtName: string) {
  const path = districtFullName || districtName
  return path ? path.replaceAll('-', ' · ') : '경로 정보 없음'
}

function getHeroDescription(label: string, favoritePath: string, alias: string) {
  const normalizedLabel = normalizeLocationText(label)
  const normalizedPath = normalizeLocationText(favoritePath)
  const normalizedAlias = normalizeLocationText(alias)

  if (!normalizedLabel || normalizedLabel === normalizedPath || normalizedLabel === normalizedAlias) {
    return null
  }

  return label
}

function normalizeLocationText(value: string) {
  return value.replace(/[·.\-\s]/g, '').trim()
}
