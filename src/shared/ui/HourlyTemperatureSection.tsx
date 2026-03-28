import type { HourlyWeatherForecast } from '@/entities/weather/model/types'
import { formatHour } from '@/shared/lib/weather'

type HourlyTemperatureSectionProps = {
  dateLabel?: string
  hourlyTemperatures: HourlyWeatherForecast[]
  currentTemperature?: number
  apparentTemperature?: number
  minTemperature?: number
  maxTemperature?: number
  timeZone: string
}

export function HourlyTemperatureSection({
  dateLabel,
  hourlyTemperatures,
  currentTemperature,
  apparentTemperature,
  minTemperature,
  maxTemperature,
  timeZone,
}: HourlyTemperatureSectionProps) {
  const visibleHourlyTemperatures = hourlyTemperatures.slice(0, 24)

  return (
    <section className="weather-glass-card min-w-0 rounded-[1.75rem] p-5 sm:rounded-[2.15rem] sm:p-6 md:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-slate-400">시간별 예보</p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">24시간 기온</h3>
        </div>
        <p className="text-sm text-slate-400">{dateLabel ?? '예보 준비 중'}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-sm font-medium text-slate-200">
          현재 {currentTemperature === undefined ? '--' : `${Math.round(currentTemperature)}°`}
        </span>
        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-sm font-medium text-slate-200">
          최저 {minTemperature === undefined ? '--' : `${Math.round(minTemperature)}°`}
        </span>
        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-sm font-medium text-slate-200">
          최고 {maxTemperature === undefined ? '--' : `${Math.round(maxTemperature)}°`}
        </span>
      </div>

      <div className="mt-5 overflow-x-auto sm:mt-6">
        <div className="flex min-w-max gap-3 pb-2">
          {visibleHourlyTemperatures.length > 0
            ? visibleHourlyTemperatures.map((hour, index) => (
                <article
                  key={hour.time}
                  className={`rounded-[1.35rem] border px-4 py-4 text-center backdrop-blur-xl sm:min-w-[118px] sm:rounded-[1.6rem] sm:px-5 sm:py-5 ${
                    index === 0
                      ? 'border-sky-200/25 bg-sky-300/12'
                      : 'border-white/10 bg-white/8'
                  }`}
                >
                  <p className="text-sm font-medium text-slate-200">{index === 0 ? '지금' : formatHour(hour.time, timeZone)}</p>
                  <p className="mt-4 text-[2.15rem] font-semibold leading-none tracking-tight text-white sm:text-[2.4rem]">
                    {Math.round(hour.temperature)}°
                  </p>
                  <p className="mt-4 text-xs font-medium text-slate-400">
                    {index === 0
                      ? `체감 ${apparentTemperature === undefined ? '--' : `${Math.round(apparentTemperature)}°`}`
                      : getCompactTemperatureDeltaLabel(hour.temperature, currentTemperature ?? hour.temperature)}
                  </p>
                </article>
              ))
            : Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[132px] min-w-[118px] animate-pulse rounded-[1.35rem] bg-white/8 sm:rounded-[1.6rem]"
                />
              ))}
        </div>
      </div>
    </section>
  )
}

function getCompactTemperatureDeltaLabel(temperature: number, currentTemperature: number) {
  const delta = Math.round(temperature - currentTemperature)

  if (delta === 0) {
    return '현재와 비슷'
  }

  if (delta > 0) {
    return `현재보다 +${delta}°`
  }

  return `현재보다 -${Math.abs(delta)}°`
}
