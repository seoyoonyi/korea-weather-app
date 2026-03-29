import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from 'react-router'
import type { DistrictNode } from '@/entities/district/model/types'
import type { FavoritePlace } from '@/entities/favorite/model/types'
import type {
  DailyWeatherForecast,
  WeatherForecast,
} from '@/entities/weather/model/types'
import { FavoriteCards } from '@/features/favorite/ui/FavoriteCards'
import { FAVORITES_LIMIT } from '@/features/favorite/model/FavoritesProvider'
import { DistrictSearchSelect } from '@/features/search/ui/DistrictSearchSelect'
import {
  type HomeFavoriteButtonState,
  type HomeHeroLocationContent,
  type HomeWeatherMessage,
  useHomePageModel,
} from '@/pages/home/model/useHomePageModel'
import { createWeatherThemeStyle, getWeatherVisualTheme } from '@/shared/lib/weatherVisualTheme'
import { HourlyTemperatureSection } from '@/shared/ui/HourlyTemperatureSection'
import { InfoRow } from '@/shared/ui/InfoRow'

export function HomePage() {
  const model = useHomePageModel()

  return (
    <main className="weather-night-shell min-h-screen px-4 py-4 text-slate-50 sm:px-5 sm:py-5 md:px-8 lg:px-10">
      <div className="pointer-events-none absolute left-[8%] top-[26rem] h-56 w-56 rounded-full bg-sky-300/8 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 right-[12%] h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />

      <div className="relative mx-auto w-full min-w-0 max-w-[1380px]">
        <HomeSearchHeader
          searchKeyword={model.searchKeyword}
          districtSuggestions={model.districtSuggestions}
          searchStatusMessage={model.searchStatusMessage}
          onSearchKeywordChange={model.onSearchKeywordChange}
          onSelectDistrict={model.onSelectDistrict}
        />

        <HomeHeroSection
          isSearchingPlace={model.isSearchingPlace}
          heroLocationContent={model.heroLocationContent}
          activeWeather={model.activeWeather}
          isActiveWeatherLoading={model.isActiveWeatherLoading}
          today={model.today}
          weatherConditionLabel={model.weatherConditionLabel}
          weatherSymbol={model.weatherSymbol}
          selectedFavorite={model.selectedFavorite}
          favoriteButtonState={model.favoriteButtonState}
          weatherMessage={model.weatherMessage}
          onFavoriteAction={model.onFavoriteAction}
        />

        <section className="grid w-full min-w-0 gap-4 sm:gap-6 lg:items-start lg:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.1fr)]">
          <div className="min-w-0 space-y-6">
            <HourlyTemperatureSection
              dateLabel={model.today ? `${model.today.date} 기준` : undefined}
              hourlyTemperatures={model.hourlyTemperatures}
              currentTemperature={model.activeWeather?.current.temperature}
              apparentTemperature={model.activeWeather?.current.apparentTemperature}
              minTemperature={model.today?.temperatureMin}
              maxTemperature={model.today?.temperatureMax}
              timeZone={model.activeTimeZone}
            />
          </div>

          <div className="min-w-0 space-y-6">
            <HomeWeatherDetailsSection
              activeWeather={model.activeWeather}
              today={model.today}
              isActiveWeatherLoading={model.isActiveWeatherLoading}
              weatherConditionLabel={model.weatherConditionLabel}
              weatherSymbol={model.weatherSymbol}
              activeTimeZone={model.activeTimeZone}
              activeUpdatedAt={model.activeUpdatedAt}
            />
          </div>
        </section>

        {!model.isSearchingPlace ? (
          <HomeFavoritesSection
            favorites={model.favorites}
            favoriteWeatherQueries={model.favoriteWeatherQueries}
            onRemoveFavorite={model.onRemoveFavorite}
            onUpdateFavoriteAlias={model.onUpdateFavoriteAlias}
          />
        ) : null}
      </div>
    </main>
  )
}

function HomeSearchHeader({
  searchKeyword,
  districtSuggestions,
  searchStatusMessage,
  onSearchKeywordChange,
  onSelectDistrict,
}: {
  searchKeyword: string
  districtSuggestions: DistrictNode[]
  searchStatusMessage: string | null
  onSearchKeywordChange: (nextValue: string) => void
  onSelectDistrict: (district: DistrictNode) => void
}) {
  return (
    <header className="flex flex-col gap-4 py-2 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <Link
          className="inline-flex text-xs font-medium tracking-[0.2em] text-slate-400 transition hover:text-slate-200"
          to="/"
        >
          Korea Weather
        </Link>
      </div>

      <div className="relative z-40 w-full lg:max-w-[42rem]">
        <DistrictSearchSelect
          className="w-full"
          value={searchKeyword}
          suggestions={districtSuggestions}
          statusMessage={searchStatusMessage}
          onValueChange={onSearchKeywordChange}
          onSelect={onSelectDistrict}
        />
      </div>
    </header>
  )
}

function HomeHeroSection({
  isSearchingPlace,
  heroLocationContent,
  activeWeather,
  isActiveWeatherLoading,
  today,
  weatherConditionLabel,
  weatherSymbol,
  selectedFavorite,
  favoriteButtonState,
  weatherMessage,
  onFavoriteAction,
}: {
  isSearchingPlace: boolean
  heroLocationContent: HomeHeroLocationContent
  activeWeather: WeatherForecast | undefined
  isActiveWeatherLoading: boolean
  today: DailyWeatherForecast | undefined
  weatherConditionLabel: string
  weatherSymbol: string
  selectedFavorite: FavoritePlace | undefined
  favoriteButtonState: HomeFavoriteButtonState
  weatherMessage: HomeWeatherMessage | null
  onFavoriteAction: () => void
}) {
  const weatherTheme = getWeatherVisualTheme(activeWeather?.current.weatherCode)
  const themeStyle = createWeatherThemeStyle(
    weatherTheme,
    isSearchingPlace ? 'search' : 'current',
  )
  const heroStatusLabel = isActiveWeatherLoading ? '날씨 동기화 중' : weatherConditionLabel

  return (
    <section className="pb-8 pt-9 text-center sm:pb-12 sm:pt-12 md:pb-16 md:pt-16">
      <div
        className="weather-hero-panel mx-auto max-w-[68rem] rounded-[1.7rem] px-5 py-6 sm:px-7 sm:py-7 md:px-9 md:py-8"
        style={themeStyle}
      >
        <div className="flex justify-center">
          <span className="weather-accent-pill rounded-full px-3 py-1.5 text-[0.72rem] font-medium text-white">
            {heroStatusLabel}
          </span>
        </div>

        {heroLocationContent.regionLabel ? (
          <p className="mx-auto mt-5 max-w-[34rem] text-sm text-slate-300">
            {heroLocationContent.regionLabel}
          </p>
        ) : null}

        <h2 className="mx-auto mt-3 max-w-[12ch] break-keep text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
          {heroLocationContent.title}
        </h2>

        <div className="mt-7 flex flex-col items-center gap-5 lg:flex-row lg:items-end lg:justify-center lg:gap-8">
          <div className="weather-icon-halo h-18 w-18 shrink-0 sm:h-20 sm:w-20">
            <span className="text-4xl leading-none text-white sm:text-5xl">{weatherSymbol}</span>
          </div>

          <div className="min-w-0 text-center lg:text-left">
            {isActiveWeatherLoading ? (
              <div className="flex flex-col items-center gap-4 lg:items-start">
                <LoadingBar className="h-5 w-32 sm:w-40" />
                <LoadingBar className="h-20 w-44 rounded-[2rem] sm:h-24 sm:w-56" />
                <LoadingBar className="h-5 w-40 sm:w-56" />
              </div>
            ) : (
              <>
                <p className="font-mono tabular-nums text-[4.2rem] font-light leading-none tracking-[-0.06em] text-white sm:text-[5.8rem] md:text-[7.2rem]">
                  {formatTemperature(activeWeather?.current.temperature)}
                </p>
                <div className="mt-3 flex flex-col gap-2 text-slate-200 lg:items-start">
                  <p className="text-sm text-slate-300 sm:text-base">
                    체감 온도 {formatTemperature(activeWeather?.current.apparentTemperature)}
                  </p>
                  <p className="text-base font-medium text-slate-200 sm:text-lg">{formatTemperatureRange(today)}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {isSearchingPlace ? (
          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              className={`inline-flex min-w-[220px] items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition sm:min-w-[240px] sm:text-base ${
                selectedFavorite
                  ? 'border border-rose-300/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20'
                  : 'border border-transparent bg-white text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-slate-400'
              }`}
              disabled={!selectedFavorite && favoriteButtonState.disabled}
              onClick={onFavoriteAction}
            >
              {selectedFavorite ? '즐겨찾기 삭제' : favoriteButtonState.label}
            </button>
          </div>
        ) : null}
      </div>

      <HomeWeatherMessageBanner message={weatherMessage} />
    </section>
  )
}

function HomeWeatherMessageBanner({ message }: { message: HomeWeatherMessage | null }) {
  if (!message) {
    return null
  }

  const classNameByTone = {
    warning: 'border-amber-200/20 bg-amber-500/10 text-amber-100',
    error: 'border-rose-200/20 bg-rose-500/12 text-rose-100',
    info: 'border-sky-200/20 bg-sky-400/10 text-sky-100',
  }

  return (
    <p
      className={`mx-auto mt-8 max-w-xl rounded-full border px-5 py-3 text-sm backdrop-blur-xl ${classNameByTone[message.tone]}`}
    >
      {message.text}
    </p>
  )
}

function HomeWeatherDetailsSection({
  activeWeather,
  today,
  isActiveWeatherLoading,
  weatherConditionLabel,
  weatherSymbol,
  activeTimeZone,
  activeUpdatedAt,
}: {
  activeWeather: WeatherForecast | undefined
  today: DailyWeatherForecast | undefined
  isActiveWeatherLoading: boolean
  weatherConditionLabel: string
  weatherSymbol: string
  activeTimeZone: string
  activeUpdatedAt: string
}) {
  const themeStyle = createWeatherThemeStyle(
    getWeatherVisualTheme(activeWeather?.current.weatherCode),
    'current',
  )

  return (
    <section
      className="weather-glass-card w-full min-w-0 overflow-hidden rounded-[1.75rem] p-5 sm:rounded-[2.15rem] sm:p-6 md:p-7"
      style={themeStyle}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">날씨 정보</h3>
        </div>
        <span className="weather-badge weather-accent-pill rounded-full px-3 py-1 text-[0.7rem] font-medium text-white whitespace-normal break-keep sm:self-auto sm:text-xs">
          {weatherSymbol} {isActiveWeatherLoading ? '기다리는 중' : weatherConditionLabel}
        </span>
      </div>

      <div className="mt-5 grid gap-3 min-[520px]:grid-cols-2 sm:mt-6 sm:gap-4">
        <InfoRow
          label="최고 기온"
          value={formatTemperature(today?.temperatureMax)}
          className="rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
          labelClassName="text-slate-300"
          valueClassName="text-2xl text-white sm:text-3xl"
        />
        <InfoRow
          label="최저 기온"
          value={formatTemperature(today?.temperatureMin)}
          className="rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
          labelClassName="text-slate-300"
          valueClassName="text-2xl text-white sm:text-3xl"
        />
        <InfoRow
          label="강수 확률"
          value={today ? `${today.precipitationProbabilityMax}%` : '--'}
          className="rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
          labelClassName="text-slate-300"
          valueClassName="text-2xl text-white sm:text-3xl"
        />
        <InfoRow
          label="업데이트 시각"
          value={activeUpdatedAt}
          className="rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
          labelClassName="text-slate-300"
          valueClassName="text-lg leading-tight text-white sm:text-xl"
        />
        <InfoRow
          label="시간대"
          value={activeTimeZone}
          className="rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
          labelClassName="text-slate-300"
          valueClassName="break-all text-lg leading-tight text-white sm:text-xl"
        />
        <InfoRow
          label="풍속"
          value={activeWeather ? `${Math.round(activeWeather.current.windSpeed)} km/h` : '--'}
          className="rounded-[1.35rem] border-white/10 bg-white/8 px-5 py-4 sm:rounded-[1.7rem] sm:px-6 sm:py-5"
          labelClassName="text-slate-300"
          valueClassName="text-lg leading-tight text-white sm:text-xl"
        />
      </div>
    </section>
  )
}

function HomeFavoritesSection({
  favorites,
  favoriteWeatherQueries,
  onRemoveFavorite,
  onUpdateFavoriteAlias,
}: {
  favorites: FavoritePlace[]
  favoriteWeatherQueries: UseQueryResult<WeatherForecast, Error>[]
  onRemoveFavorite: (favoriteId: string) => void
  onUpdateFavoriteAlias: (favoriteId: string, alias: string) => void
}) {
  return (
    <section className="mt-6 weather-glass-card w-full min-w-0 overflow-hidden rounded-[1.75rem] p-5 sm:rounded-[2.15rem] sm:p-6 md:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">즐겨찾기</h3>
        </div>
        <div className="inline-flex self-start rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-slate-100">
          {favorites.length} / {FAVORITES_LIMIT}
        </div>
      </div>

      <div className="mt-6">
        <FavoriteCards
          favorites={favorites}
          weatherQueries={favoriteWeatherQueries}
          onRemoveFavorite={onRemoveFavorite}
          onUpdateFavoriteAlias={onUpdateFavoriteAlias}
        />
      </div>
    </section>
  )
}

function formatTemperature(value: number | undefined) {
  return typeof value === 'number' ? `${Math.round(value)}°` : '--'
}

function formatTemperatureRange(today: DailyWeatherForecast | undefined) {
  return `최고 ${formatTemperature(today?.temperatureMax)} / 최저 ${formatTemperature(today?.temperatureMin)}`
}

function LoadingBar({ className }: { className: string }) {
  return <div className={`weather-skeleton ${className}`} />
}
