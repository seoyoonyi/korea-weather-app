import { useWeatherForecastQuery } from '@/entities/weather/api/useWeatherForecastQuery'
import { getWeatherConditionLabel } from '@/entities/weather/model/getWeatherConditionLabel'
import type { HourlyWeatherForecast } from '@/entities/weather/model/types'
import { useCurrentLocation } from '@/features/current-location/model/useCurrentLocation'
import { DEFAULT_WEATHER_TIMEZONE } from '@/shared/config/api'

const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_WEATHER_TIMEZONE

export function HomePage() {
  const location = useCurrentLocation()
  const { data, error, isError, isLoading, isFetching } = useWeatherForecastQuery({
    ...location.coordinates,
    timezone: browserTimeZone,
    forecastDays: 1,
  })

  const today = data?.daily[0]
  const hourlyTemperatures = data ? getTodayHourlyTemperatures(data.hourly, today?.date) : []

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#e0f2fe_100%)] px-6 py-10 text-slate-950 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-700">Open API Weather</p>
            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{location.label}</h1>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  위도 {location.coordinates.latitude.toFixed(4)}, 경도 {location.coordinates.longitude.toFixed(4)}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-950 px-5 py-4 text-slate-50">
                <p className="text-sm text-slate-300">상태</p>
                <p className="mt-2 text-lg font-medium">
                  {isLoading ? '날씨 불러오는 중' : isFetching ? '날씨 갱신 중' : '최신 예보 준비됨'}
                </p>
              </div>
            </div>

            {location.message ? (
              <p className="mt-6 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                {location.message}
              </p>
            ) : null}

            {isError ? (
              <p className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error instanceof Error ? error.message : '날씨 정보를 불러오지 못했습니다.'}
              </p>
            ) : null}

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <MetricCard
                label="현재 기온"
                value={data ? `${Math.round(data.current.temperature)}°` : '--'}
                helper={data ? getWeatherConditionLabel(data.current.weatherCode) : '데이터 대기 중'}
              />
              <MetricCard
                label="당일 최저"
                value={today ? `${Math.round(today.temperatureMin)}°` : '--'}
                helper={today ? `${today.date}` : '데이터 대기 중'}
              />
              <MetricCard
                label="당일 최고"
                value={today ? `${Math.round(today.temperatureMax)}°` : '--'}
                helper={data ? `체감 ${Math.round(data.current.apparentTemperature)}°` : '데이터 대기 중'}
              />
            </div>
          </div>

          <aside className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-slate-50 shadow-[0_24px_80px_rgba(2,6,23,0.18)]">
            <p className="text-sm uppercase tracking-[0.24em] text-sky-300">Location</p>
            <div className="mt-6 space-y-5">
              <InfoRow label="표시 위치" value={location.label} />
              <InfoRow
                label="위치 기준"
                value={location.source === 'geolocation' ? '브라우저 현재 위치' : '서울 기본 위치'}
              />
              <InfoRow label="시간대" value={data?.location.timezone ?? browserTimeZone} />
              <InfoRow
                label="업데이트 시각"
                value={data ? formatDateTime(data.current.time, browserTimeZone) : '--'}
              />
              <InfoRow
                label="강수 확률"
                value={today ? `${today.precipitationProbabilityMax}%` : '--'}
              />
              <InfoRow
                label="풍속"
                value={data ? `${Math.round(data.current.windSpeed)} km/h` : '--'}
              />
            </div>
          </aside>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
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
                    className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5 transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50"
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
        </section>
      </div>
    </main>
  )
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </article>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-base font-medium text-white">{value}</p>
    </div>
  )
}

function getTodayHourlyTemperatures(hourly: HourlyWeatherForecast[], date?: string) {
  if (!date) {
    return hourly.slice(0, 8)
  }

  return hourly.filter((item) => item.time.startsWith(date)).slice(0, 24)
}

function formatHour(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(new Date(value))
}

function formatDateTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(new Date(value))
}
