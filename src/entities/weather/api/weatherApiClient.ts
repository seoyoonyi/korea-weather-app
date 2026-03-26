import {
  DEFAULT_WEATHER_TIMEZONE,
  KMA_ULTRA_SHORT_NOWCAST_API_URL,
  KMA_VILLAGE_FORECAST_API_URL,
} from '@/shared/config/api'
import type {
  DailyWeatherForecast,
  GetWeatherForecastParams,
  HourlyWeatherForecast,
  WeatherForecast,
} from '@/entities/weather/model/types'
import { toKmaGrid } from '@/shared/lib/kmaGrid'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const KMA_TIMEZONE_ABBREVIATION = 'KST'
const KMA_SUCCESS_CODE = '00'
const KMA_VILLAGE_BASE_HOURS = [2, 5, 8, 11, 14, 17, 20, 23]
const KMA_MIN_REQUEST_INTERVAL_MS = 350
const KMA_RATE_LIMIT_RETRY_COUNT = 2
const KMA_RATE_LIMIT_RETRY_DELAY_MS = 1500

let kmaRequestQueue: Promise<void> = Promise.resolve()
let lastKmaRequestStartedAt = 0

type KmaGridCoordinates = {
  nx: number
  ny: number
}

type KmaApiResponse<TItem> = {
  response?: {
    header?: {
      resultCode?: string
      resultMsg?: string
    }
    body?: {
      items?: {
        item?: TItem[] | TItem
      }
    }
  }
}

type KmaNowcastItem = {
  baseDate: string
  baseTime: string
  category: string
  nx: number
  ny: number
  obsrValue: string
}

type KmaVillageForecastItem = {
  baseDate: string
  baseTime: string
  category: string
  fcstDate: string
  fcstTime: string
  fcstValue: string
  nx: number
  ny: number
}

type CurrentObservation = {
  time: string
  temperature: number | null
  windSpeed: number | null
  precipitationType: number | null
}

type ForecastPoint = {
  time: string
  temperature: number | null
  precipitationProbability: number | null
  sky: number | null
  precipitationType: number | null
  lightning: number | null
  windSpeed: number | null
}

type ParsedVillageForecast = {
  daily: DailyWeatherForecast[]
  hourly: HourlyWeatherForecast[]
  points: ForecastPoint[]
}

type GetWeatherForecastOptions = {
  signal?: AbortSignal
}

export async function getWeatherForecast(
  params: GetWeatherForecastParams,
  options: GetWeatherForecastOptions = {},
): Promise<WeatherForecast> {
  validateCoordinates(params)

  const serviceKey = getKmaServiceKey()
  const grid = toKmaGrid(params.latitude, params.longitude)
  const now = new Date()

  const [nowcastItems, villageForecastItems] = await Promise.all([
    fetchKmaItems<KmaNowcastItem>({
      endpoint: KMA_ULTRA_SHORT_NOWCAST_API_URL,
      grid,
      requestDateTime: getUltraShortNowcastBaseDateTime(now),
      serviceKey,
      signal: options.signal,
    }),
    fetchKmaItems<KmaVillageForecastItem>({
      endpoint: KMA_VILLAGE_FORECAST_API_URL,
      grid,
      requestDateTime: getVillageForecastBaseDateTime(now),
      serviceKey,
      signal: options.signal,
    }),
  ])

  const currentObservation = parseCurrentObservation(nowcastItems)
  const parsedVillageForecast = parseVillageForecast(villageForecastItems, now)
  const currentForecastPoint = getNearestForecastPoint(
    parsedVillageForecast.points,
    currentObservation.time,
  )

  const currentTemperature =
    currentObservation.temperature ?? currentForecastPoint?.temperature ?? null
  const currentWindSpeed =
    currentObservation.windSpeed ?? currentForecastPoint?.windSpeed ?? null

  if (currentTemperature === null) {
    throw new Error('기상청 예보에서 현재 기온을 찾지 못했습니다.')
  }

  const currentTime =
    currentObservation.time ||
    currentForecastPoint?.time ||
    createOffsetDateTime(getKstCompactDate(toKstDate(now)), getKstHourTime(now))
  const currentWeatherCode = deriveWeatherCode({
    precipitationType:
      currentObservation.precipitationType ?? currentForecastPoint?.precipitationType ?? null,
    sky: currentForecastPoint?.sky ?? null,
    lightning: currentForecastPoint?.lightning ?? null,
  })
  const todayForecast =
    parsedVillageForecast.daily[0] ?? buildFallbackDailyForecast(parsedVillageForecast.hourly, now)
  const timezone = params.timezone ?? DEFAULT_WEATHER_TIMEZONE

  return {
    location: {
      latitude: params.latitude,
      longitude: params.longitude,
      timezone,
      timezoneAbbreviation: KMA_TIMEZONE_ABBREVIATION,
    },
    current: {
      time: currentTime,
      temperature: currentTemperature,
      apparentTemperature: currentTemperature,
      isDay: isDaytime(currentTime),
      weatherCode: currentWeatherCode,
      windSpeed: currentWindSpeed === null ? 0 : toKilometersPerHour(currentWindSpeed),
    },
    daily: todayForecast ? [todayForecast] : [],
    hourly: parsedVillageForecast.hourly,
  }
}

async function fetchKmaItems<TItem>({
  endpoint,
  grid,
  requestDateTime,
  serviceKey,
  signal,
}: {
  endpoint: string
  grid: KmaGridCoordinates
  requestDateTime: Date
  serviceKey: string
  signal?: AbortSignal
}) {
  const requestUrl = createKmaRequestUrl(endpoint, {
    serviceKey,
    base_date: getKstCompactDate(requestDateTime),
    base_time: getKstCompactTime(requestDateTime),
    nx: String(grid.nx),
    ny: String(grid.ny),
  })
  const response = await fetchKmaResponseWithRetry(requestUrl, signal)

  if (!response.ok) {
    const errorMessage = await readKmaErrorMessage(response)
    throw new Error(errorMessage ?? '기상청 날씨 정보를 불러오지 못했습니다.')
  }

  const body = (await response.json()) as KmaApiResponse<TItem>
  const resultCode = body.response?.header?.resultCode

  if (resultCode !== KMA_SUCCESS_CODE) {
    throw new Error(body.response?.header?.resultMsg ?? '기상청 응답을 해석하지 못했습니다.')
  }

  const items = body.response?.body?.items?.item

  if (!items) {
    return []
  }

  return Array.isArray(items) ? items : [items]
}

function parseCurrentObservation(items: KmaNowcastItem[]): CurrentObservation {
  const categories = new Map(items.map((item) => [item.category, item]))
  const sampleItem = items[0]

  return {
    time: sampleItem ? createOffsetDateTime(sampleItem.baseDate, sampleItem.baseTime) : '',
    temperature: getNumericKmaValue(categories.get('T1H')?.obsrValue),
    windSpeed: getNumericKmaValue(categories.get('WSD')?.obsrValue),
    precipitationType: getNumericKmaValue(categories.get('PTY')?.obsrValue),
  }
}

function parseVillageForecast(items: KmaVillageForecastItem[], now: Date): ParsedVillageForecast {
  const availableDates = Array.from(
    new Set(
      items
        .map((item) => item.fcstDate)
        .filter((fcstDate): fcstDate is string => fcstDate.length === 8),
    ),
  ).sort()
  const todayDate = getKstCompactDate(toKstDate(now))
  const targetDate = availableDates.includes(todayDate) ? todayDate : (availableDates[0] ?? todayDate)
  const pointsByTime = new Map<string, ForecastPoint>()

  let temperatureMin: number | null = null
  let temperatureMax: number | null = null
  let precipitationProbabilityMax = 0

  for (const item of items) {
    if (item.fcstDate !== targetDate) {
      continue
    }

    const numericValue = getNumericKmaValue(item.fcstValue)

    if (item.category === 'TMN' && numericValue !== null) {
      temperatureMin = numericValue
      continue
    }

    if (item.category === 'TMX' && numericValue !== null) {
      temperatureMax = numericValue
      continue
    }

    const point = getOrCreateForecastPoint(pointsByTime, item.fcstDate, item.fcstTime)

    switch (item.category) {
      case 'TMP':
        point.temperature = numericValue
        break
      case 'POP':
        point.precipitationProbability = numericValue
        precipitationProbabilityMax = Math.max(precipitationProbabilityMax, numericValue ?? 0)
        break
      case 'SKY':
        point.sky = numericValue
        break
      case 'PTY':
        point.precipitationType = numericValue
        break
      case 'LGT':
        point.lightning = numericValue
        break
      case 'WSD':
        point.windSpeed = numericValue
        break
      default:
        break
    }
  }

  const sortedPoints = Array.from(pointsByTime.values()).sort((left, right) =>
    left.time.localeCompare(right.time),
  )
  const hourly = sortedPoints
    .filter((point) => point.temperature !== null)
    .map((point) => ({
      time: point.time,
      temperature: point.temperature ?? 0,
    }))

  const fallbackTemperatures = hourly.map((item) => item.temperature)
  const resolvedTemperatureMin =
    temperatureMin ?? (fallbackTemperatures.length > 0 ? Math.min(...fallbackTemperatures) : null)
  const resolvedTemperatureMax =
    temperatureMax ?? (fallbackTemperatures.length > 0 ? Math.max(...fallbackTemperatures) : null)
  const representativePoint =
    getRepresentativeForecastPoint(sortedPoints) ?? sortedPoints[0] ?? null
  const date = toHyphenatedDate(targetDate)

  return {
    daily:
      resolvedTemperatureMin !== null && resolvedTemperatureMax !== null
        ? [
            {
              date,
              weatherCode: deriveWeatherCode({
                precipitationType: representativePoint?.precipitationType ?? null,
                sky: representativePoint?.sky ?? null,
                lightning: representativePoint?.lightning ?? null,
              }),
              temperatureMax: resolvedTemperatureMax,
              temperatureMin: resolvedTemperatureMin,
              precipitationProbabilityMax,
            },
          ]
        : [],
    hourly,
    points: sortedPoints,
  }
}

function getOrCreateForecastPoint(
  pointsByTime: Map<string, ForecastPoint>,
  date: string,
  time: string,
) {
  const key = `${date}${time}`
  const existingPoint = pointsByTime.get(key)

  if (existingPoint) {
    return existingPoint
  }

  const nextPoint: ForecastPoint = {
    time: createOffsetDateTime(date, time),
    temperature: null,
    precipitationProbability: null,
    sky: null,
    precipitationType: null,
    lightning: null,
    windSpeed: null,
  }

  pointsByTime.set(key, nextPoint)
  return nextPoint
}

function getRepresentativeForecastPoint(points: ForecastPoint[]) {
  const noonPoint = points.find((point) => point.time.includes('T12:00:00+09:00'))

  if (noonPoint) {
    return noonPoint
  }

  return points.find((point) => point.time.includes('T15:00:00+09:00')) ?? null
}

function getNearestForecastPoint(points: ForecastPoint[], referenceTime: string) {
  if (points.length === 0) {
    return null
  }

  const referenceTimestamp = new Date(referenceTime).getTime()

  if (!Number.isFinite(referenceTimestamp)) {
    return points[0]
  }

  return points.reduce((bestPoint, point) => {
    const pointDistance = Math.abs(new Date(point.time).getTime() - referenceTimestamp)
    const bestDistance = Math.abs(new Date(bestPoint.time).getTime() - referenceTimestamp)

    return pointDistance < bestDistance ? point : bestPoint
  }, points[0])
}

function buildFallbackDailyForecast(hourly: HourlyWeatherForecast[], now: Date): DailyWeatherForecast | null {
  if (hourly.length === 0) {
    return null
  }

  const temperatures = hourly.map((item) => item.temperature)

  return {
    date: toHyphenatedDate(getKstCompactDate(toKstDate(now))),
    weatherCode: 1,
    temperatureMax: Math.max(...temperatures),
    temperatureMin: Math.min(...temperatures),
    precipitationProbabilityMax: 0,
  }
}

function validateCoordinates({ latitude, longitude }: GetWeatherForecastParams) {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('latitude는 -90에서 90 사이의 숫자여야 합니다.')
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('longitude는 -180에서 180 사이의 숫자여야 합니다.')
  }
}

function getKmaServiceKey() {
  const serviceKey = import.meta.env.VITE_KMA_SERVICE_KEY?.trim()

  if (!serviceKey) {
    throw new Error('VITE_KMA_SERVICE_KEY가 설정되지 않았습니다.')
  }

  return serviceKey
}

function createKmaRequestUrl(
  endpoint: string,
  params: Record<string, string>,
) {
  const requestUrl = new URL(endpoint)
  const searchParams = new URLSearchParams()

  searchParams.set('serviceKey', normalizeServiceKey(params.serviceKey))
  searchParams.set('pageNo', '1')
  searchParams.set('numOfRows', '1000')
  searchParams.set('dataType', 'JSON')
  searchParams.set('base_date', params.base_date)
  searchParams.set('base_time', params.base_time)
  searchParams.set('nx', params.nx)
  searchParams.set('ny', params.ny)
  requestUrl.search = searchParams.toString().replace(
    `serviceKey=${encodeURIComponent(normalizeServiceKey(params.serviceKey))}`,
    `serviceKey=${normalizeServiceKey(params.serviceKey)}`,
  )

  return requestUrl
}

function normalizeServiceKey(serviceKey: string) {
  try {
    return decodeURIComponent(serviceKey) === serviceKey
      ? encodeURIComponent(serviceKey)
      : serviceKey
  } catch {
    return encodeURIComponent(serviceKey)
  }
}

function getUltraShortNowcastBaseDateTime(now: Date) {
  const kstDate = toKstDate(now)

  if (kstDate.getUTCMinutes() < 40) {
    kstDate.setUTCHours(kstDate.getUTCHours() - 1)
  }

  kstDate.setUTCMinutes(0, 0, 0)
  return kstDate
}

function getVillageForecastBaseDateTime(now: Date) {
  const kstDate = toKstDate(now)
  const hour = kstDate.getUTCHours()
  const minute = kstDate.getUTCMinutes()
  const availableBaseHour = [...KMA_VILLAGE_BASE_HOURS]
    .reverse()
    .find((baseHour) => hour > baseHour || (hour === baseHour && minute >= 10))

  if (availableBaseHour === undefined) {
    kstDate.setUTCDate(kstDate.getUTCDate() - 1)
    kstDate.setUTCHours(23, 0, 0, 0)
    return kstDate
  }

  kstDate.setUTCHours(availableBaseHour, 0, 0, 0)
  return kstDate
}

function toKstDate(date: Date) {
  return new Date(date.getTime() + KST_OFFSET_MS)
}

function getKstCompactDate(date: Date) {
  return [
    String(date.getUTCFullYear()),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('')
}

function getKstCompactTime(date: Date) {
  return [
    String(date.getUTCHours()).padStart(2, '0'),
    String(date.getUTCMinutes()).padStart(2, '0'),
  ].join('')
}

function getKstHourTime(date: Date) {
  const kstDate = toKstDate(date)
  return `${String(kstDate.getUTCHours()).padStart(2, '0')}00`
}

function createOffsetDateTime(compactDate: string, compactTime: string) {
  return `${compactDate.slice(0, 4)}-${compactDate.slice(4, 6)}-${compactDate.slice(6, 8)}T${compactTime.slice(0, 2)}:${compactTime.slice(2, 4)}:00+09:00`
}

function toHyphenatedDate(compactDate: string) {
  return `${compactDate.slice(0, 4)}-${compactDate.slice(4, 6)}-${compactDate.slice(6, 8)}`
}

function getNumericKmaValue(value?: string) {
  if (value === undefined) {
    return null
  }

  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : null
}

function deriveWeatherCode({
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

function isDaytime(value: string) {
  const hour = toKstDate(new Date(value)).getUTCHours()
  return hour >= 6 && hour < 18
}

function toKilometersPerHour(metersPerSecond: number) {
  return Math.round(metersPerSecond * 3.6 * 10) / 10
}

async function fetchKmaResponseWithRetry(requestUrl: URL, signal?: AbortSignal) {
  let lastResponse: Response | null = null

  for (let attempt = 0; attempt <= KMA_RATE_LIMIT_RETRY_COUNT; attempt += 1) {
    const response = await enqueueKmaRequest(
      () =>
        fetch(requestUrl, {
          headers: {
            Accept: 'application/json',
          },
          signal,
        }),
      signal,
    )

    if (response.status !== 429) {
      return response
    }

    lastResponse = response

    if (attempt < KMA_RATE_LIMIT_RETRY_COUNT) {
      await waitFor(
        KMA_RATE_LIMIT_RETRY_DELAY_MS * (attempt + 1),
        signal,
      )
    }
  }

  return lastResponse as Response
}

function enqueueKmaRequest<T>(request: () => Promise<T>, signal?: AbortSignal) {
  const runRequest = async () => {
    throwIfAborted(signal)

    const waitTime = Math.max(
      0,
      lastKmaRequestStartedAt + KMA_MIN_REQUEST_INTERVAL_MS - Date.now(),
    )

    if (waitTime > 0) {
      await waitFor(waitTime, signal)
    }

    throwIfAborted(signal)
    lastKmaRequestStartedAt = Date.now()

    return request()
  }

  const scheduledRequest = kmaRequestQueue.then(runRequest, runRequest)
  kmaRequestQueue = scheduledRequest.then(
    () => undefined,
    () => undefined,
  )

  return scheduledRequest
}

function waitFor(delayMs: number, signal?: AbortSignal) {
  if (delayMs <= 0) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort)
      resolve()
    }, delayMs)

    function handleAbort() {
      window.clearTimeout(timeoutId)
      signal?.removeEventListener('abort', handleAbort)
      reject(new DOMException('The operation was aborted.', 'AbortError'))
    }

    signal?.addEventListener('abort', handleAbort, { once: true })
  })
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError')
  }
}

async function readKmaErrorMessage(response: Response) {
  if (response.status === 429) {
    return '기상청 요청이 몰려 잠시 후 다시 시도해 주세요.'
  }

  const rawBody = await response.text()

  if (!rawBody) {
    return null
  }

  try {
    const parsedBody = JSON.parse(rawBody) as KmaApiResponse<unknown>
    const resultMessage = parsedBody.response?.header?.resultMsg

    if (resultMessage) {
      return resultMessage
    }
  } catch {
    // Some KMA errors are returned as XML/text.
  }

  const xmlMessage =
    extractXmlValue(rawBody, 'returnAuthMsg') ??
    extractXmlValue(rawBody, 'returnReasonCode') ??
    extractXmlValue(rawBody, 'resultMsg') ??
    extractXmlValue(rawBody, 'errMsg')

  return xmlMessage?.trim() || null
}

function extractXmlValue(rawBody: string, tagName: string) {
  const matchedValue = rawBody.match(new RegExp(`<${tagName}>([^<]+)</${tagName}>`, 'i'))
  return matchedValue?.[1] ?? null
}
