import { Link, Navigate, useParams } from 'react-router'
import { useFavorites } from '@/features/favorite/model/FavoritesProvider'
import { useWeatherForecastQuery } from '@/entities/weather/api/useWeatherForecastQuery'
import { getWeatherConditionLabel } from '@/entities/weather/model/getWeatherConditionLabel'
import { DEFAULT_WEATHER_TIMEZONE } from '@/shared/config/api'
import { formatDateTime, formatHour, getTodayHourlyTemperatures } from '@/shared/lib/weather'
import { InfoRow } from '@/shared/ui/InfoRow'
import { MetricCard } from '@/shared/ui/MetricCard'

const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_WEATHER_TIMEZONE

export function FavoriteDetailPage() {
  const { favoriteId } = useParams()
  const { findFavoriteById } = useFavorites()
  const favorite = favoriteId ? findFavoriteById(favoriteId) : undefined

  const weatherQuery = useWeatherForecastQuery(
    {
      latitude: favorite?.latitude ?? 0,
      longitude: favorite?.longitude ?? 0,
      timezone: favorite?.timezone ?? browserTimeZone,
      forecastDays: 1,
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
      <main className="min-h-screen bg-slate-100 px-6 py-12 text-slate-950 lg:px-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-700">Favorite Detail</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">즐겨찾기 장소를 찾을 수 없습니다.</h1>
          <Link
            className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            to="/"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    )
  }

  const weather = weatherQuery.data
  const today = weather?.daily[0]
  const hourlyTemperatures = weather ? getTodayHourlyTemperatures(weather.hourly, today?.date) : []

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#e0f2fe_100%)] px-6 py-10 text-slate-950 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Link className="text-sm font-medium text-sky-700 hover:text-sky-900" to="/">
                홈으로 돌아가기
              </Link>
              <p className="mt-4 text-sm font-medium uppercase tracking-[0.24em] text-sky-700">
                Favorite Detail
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{favorite.alias}</h1>
              <p className="mt-3 text-base leading-7 text-slate-600">{favorite.label}</p>
              <p className="mt-1 text-sm text-slate-500">
                {formatFavoritePath(favorite.districtFullName, favorite.districtName)}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-950 px-5 py-4 text-slate-50">
              <p className="text-sm text-slate-300">상태</p>
              <p className="mt-2 text-lg font-medium">
                {weatherQuery.isLoading ? '날씨 불러오는 중' : weatherQuery.isFetching ? '날씨 갱신 중' : '최신 예보 준비됨'}
              </p>
            </div>
          </div>

          {weatherQuery.error ? (
            <p className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {weatherQuery.error.message}
            </p>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <MetricCard
              label="현재 기온"
              value={weather ? `${Math.round(weather.current.temperature)}°` : '--'}
              helper={weather ? getWeatherConditionLabel(weather.current.weatherCode) : '데이터 대기 중'}
            />
            <MetricCard
              label="당일 최저"
              value={today ? `${Math.round(today.temperatureMin)}°` : '--'}
              helper={today ? `${today.date}` : '데이터 대기 중'}
            />
            <MetricCard
              label="당일 최고"
              value={today ? `${Math.round(today.temperatureMax)}°` : '--'}
              helper={weather ? `체감 ${Math.round(weather.current.apparentTemperature)}°` : '데이터 대기 중'}
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-700">Hourly Temperature</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">시간대별 기온</h2>
              </div>
              <p className="text-sm text-slate-500">{today ? `${today.date} 기준` : '오늘 예보 준비 중'}</p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {hourlyTemperatures.length > 0
                ? hourlyTemperatures.map((hour) => (
                    <article
                      key={hour.time}
                      className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5"
                    >
                      <p className="text-sm text-slate-500">{formatHour(hour.time, browserTimeZone)}</p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                        {Math.round(hour.temperature)}°
                      </p>
                    </article>
                  ))
                : Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="h-28 animate-pulse rounded-3xl bg-slate-100" />
                  ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-slate-50 shadow-[0_24px_80px_rgba(2,6,23,0.18)]">
            <p className="text-sm uppercase tracking-[0.24em] text-sky-300">Details</p>
            <div className="mt-6 space-y-5">
              <InfoRow label="표시 이름" value={favorite.alias} />
              <InfoRow label="위치 라벨" value={favorite.label} />
              <InfoRow
                label="행정구역 경로"
                value={formatFavoritePath(favorite.districtFullName, favorite.districtName)}
              />
              <InfoRow
                label="좌표"
                value={`위도 ${favorite.latitude.toFixed(4)}, 경도 ${favorite.longitude.toFixed(4)}`}
              />
              <InfoRow label="시간대" value={weather?.location.timezone ?? favorite.timezone} />
              <InfoRow
                label="업데이트 시각"
                value={weather ? formatDateTime(weather.current.time, browserTimeZone) : '--'}
              />
              <InfoRow label="강수 확률" value={today ? `${today.precipitationProbabilityMax}%` : '--'} />
              <InfoRow label="풍속" value={weather ? `${Math.round(weather.current.windSpeed)} km/h` : '--'} />
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

function formatFavoritePath(districtFullName: string, districtName: string) {
  const path = districtFullName || districtName
  return path ? path.replaceAll('-', ' > ') : '경로 정보 없음'
}
