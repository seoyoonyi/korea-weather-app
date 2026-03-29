import type { KmaApiResponse, KmaGridCoordinates } from '@/entities/weather/api/kmaTypes'
import { getKstCompactDate, getKstCompactTime } from '@/entities/weather/api/kmaTime'

const KMA_SUCCESS_CODE = '00'
const KMA_MIN_REQUEST_INTERVAL_MS = 350
const KMA_RATE_LIMIT_RETRY_COUNT = 2
const KMA_RATE_LIMIT_RETRY_DELAY_MS = 1500

let kmaRequestQueue: Promise<void> = Promise.resolve()
let lastKmaRequestStartedAt = 0

export async function fetchKmaItems<TItem>({
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

export function getKmaServiceKey() {
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
