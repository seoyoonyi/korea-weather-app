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
          heroEyebrow={model.heroEyebrow}
          heroLocationContent={model.heroLocationContent}
          activeWeather={model.activeWeather}
          today={model.today}
          weatherConditionLabel={model.weatherConditionLabel}
          weatherSymbol={model.weatherSymbol}
          selectedFavorite={model.selectedFavorite}
          favoriteButtonState={model.favoriteButtonState}
          favoriteActionMessage={model.favoriteActionMessage}
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
              activeLocationLabel={model.activeLocationLabel}
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
  heroEyebrow,
  heroLocationContent,
  activeWeather,
  today,
  weatherConditionLabel,
  weatherSymbol,
  selectedFavorite,
  favoriteButtonState,
  favoriteActionMessage,
  weatherMessage,
  onFavoriteAction,
}: {
  isSearchingPlace: boolean
  heroEyebrow: string
  heroLocationContent: HomeHeroLocationContent
  activeWeather: WeatherForecast | undefined
  today: DailyWeatherForecast | undefined
  weatherConditionLabel: string
  weatherSymbol: string
  selectedFavorite: FavoritePlace | undefined
  favoriteButtonState: HomeFavoriteButtonState
  favoriteActionMessage: string
  weatherMessage: HomeWeatherMessage | null
  onFavoriteAction: () => void
}) {
  return (
    <section className="pb-8 pt-9 text-center sm:pb-12 sm:pt-12 md:pb-16 md:pt-16">
      <p className="text-sm font-medium text-slate-300">{heroEyebrow}</p>
      {heroLocationContent.regionLabel ? (
        <p className="mx-auto mt-4 max-w-[30rem] text-sm text-slate-400">
          {heroLocationContent.regionLabel}
        </p>
      ) : null}
      <h2 className="mx-auto mt-3 max-w-[12ch] break-keep text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-7xl">
        {heroLocationContent.title}
      </h2>
      <p className="mt-4 text-[4.4rem] font-extralight leading-none tracking-[-0.08em] text-white sm:mt-5 sm:text-[6.5rem] md:text-[9rem]">
        {formatTemperature(activeWeather?.current.temperature)}
      </p>
      <div className="mt-3 flex flex-col items-center gap-3 sm:mt-4">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <span className="text-4xl leading-none text-slate-100 sm:text-5xl">{weatherSymbol}</span>
          <div className="text-center sm:text-left">
            <p className="text-xl font-medium text-white sm:text-2xl">{weatherConditionLabel}</p>
            <p className="mt-1 text-sm text-slate-300 sm:text-base">
              체감 온도 {formatTemperature(activeWeather?.current.apparentTemperature)}
            </p>
          </div>
        </div>
        <p className="text-lg font-medium text-slate-200 sm:text-xl">{formatTemperatureRange(today)}</p>
      </div>

      {isSearchingPlace ? (
        <div className="mt-6 flex flex-col items-center gap-3">
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
          <p className="text-sm text-slate-300">{favoriteActionMessage}</p>
        </div>
      ) : null}

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
  activeLocationLabel,
  activeTimeZone,
  activeUpdatedAt,
}: {
  activeWeather: WeatherForecast | undefined
  today: DailyWeatherForecast | undefined
  activeLocationLabel: string
  activeTimeZone: string
  activeUpdatedAt: string
}) {
  return (
    <section className="weather-glass-card w-full min-w-0 overflow-hidden rounded-[1.75rem] p-5 sm:rounded-[2.15rem] sm:p-6 md:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-slate-400">상세 날씨</p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            상세 날씨 정보
          </h3>
        </div>
        <span className="weather-badge rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.7rem] font-medium text-slate-300 whitespace-normal break-keep sm:self-auto sm:text-xs">
          {activeLocationLabel}
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
          valueClassName="text-2xl text-white sm:text-3xl"
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
          <p className="text-xs font-medium tracking-[0.2em] text-slate-400">즐겨찾기</p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            즐겨찾기 장소
          </h3>
          <p className="mt-3 text-sm text-slate-300">
            즐겨찾기는 최대 {FAVORITES_LIMIT}개까지 저장할 수 있으며 카드를 누르면 상세 페이지로 이동합니다.
          </p>
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
