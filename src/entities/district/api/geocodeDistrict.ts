import type { DistrictNode } from '@/entities/district/model/types'
import { NOMINATIM_SEARCH_API_URL, OPEN_METEO_GEOCODING_API_URL } from '@/shared/config/api'

type GeocodeDistrictOptions = {
  signal?: AbortSignal
}

export type DistrictCoords = {
  latitude: number
  longitude: number
  label: string
  timezone: string | null
}

type OpenMeteoGeocodingResponse = {
  results?: OpenMeteoGeocodingResult[]
}

type OpenMeteoGeocodingResult = {
  name: string
  latitude: number
  longitude: number
  timezone?: string
  country_code?: string
  admin1?: string
  admin2?: string
  admin3?: string
  admin4?: string
}

type NominatimSearchResult = {
  lat: string
  lon: string
  display_name: string
  address?: {
    state?: string
    county?: string
    city?: string
    city_district?: string
    district?: string
    borough?: string
    suburb?: string
    town?: string
    village?: string
    hamlet?: string
    quarter?: string
    neighbourhood?: string
  }
}

export async function geocodeDistrict(
  district: DistrictNode,
  options: GeocodeDistrictOptions = {},
): Promise<DistrictCoords | null> {
  const searchTerms = Array.from(
    new Set([district.fullName.replaceAll('-', ' '), district.name]),
  )

  for (const searchTerm of searchTerms) {
    const response = await fetchGeocodingResults(searchTerm, options.signal)
    const bestMatch = pickBestGeocodingMatch(district, response.results ?? [])

    if (bestMatch) {
      return {
        latitude: bestMatch.latitude,
        longitude: bestMatch.longitude,
        label: formatGeocodedLabel(bestMatch),
        timezone: bestMatch.timezone ?? null,
      }
    }
  }

  const nominatimMatch = await findDistrictWithNominatim(district, options.signal)

  if (nominatimMatch) {
    return nominatimMatch
  }

  return null
}

async function fetchGeocodingResults(searchTerm: string, signal?: AbortSignal) {
  const requestUrl = new URL(OPEN_METEO_GEOCODING_API_URL)

  requestUrl.searchParams.set('name', searchTerm)
  requestUrl.searchParams.set('count', '20')
  requestUrl.searchParams.set('language', 'ko')
  requestUrl.searchParams.set('countryCode', 'KR')

  const response = await fetch(requestUrl, {
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('장소 좌표를 찾지 못했습니다.')
  }

  return (await response.json()) as OpenMeteoGeocodingResponse
}

function pickBestGeocodingMatch(
  district: DistrictNode,
  results: OpenMeteoGeocodingResult[],
) {
  const rankedResults = results
    .map((result) => ({
      result,
      score: getGeocodingScore(district, result),
    }))
    .filter((item) => item.score >= getMinimumScore(district))
    .sort((left, right) => right.score - left.score)

  return rankedResults[0]?.result ?? null
}

function getGeocodingScore(
  district: DistrictNode,
  result: OpenMeteoGeocodingResult,
) {
  const selectedSegments = district.fullName.split('-').map(normalizeValue)
  const lastSegment = selectedSegments.at(-1) ?? ''
  const candidateSegments = Array.from(
    new Set(
      [result.name, result.admin4, result.admin3, result.admin2, result.admin1]
        .filter((value): value is string => Boolean(value))
        .map(normalizeValue),
    ),
  )

  let score = 0

  if (normalizeValue(result.name) === lastSegment) {
    score += 40
  }

  for (const segment of selectedSegments) {
    if (candidateSegments.includes(segment)) {
      score += 12
      continue
    }

    if (candidateSegments.some((candidateSegment) => candidateSegment.includes(segment))) {
      score += 4
    }
  }

  return score
}

function getMinimumScore(district: DistrictNode) {
  if (district.depth === 1) {
    return 40
  }

  return 52
}

function formatGeocodedLabel(result: OpenMeteoGeocodingResult) {
  const labelParts = Array.from(
    new Set([result.name, result.admin3, result.admin2, result.admin1].filter(Boolean)),
  )

  return labelParts.join(' · ')
}

function normalizeValue(value: string) {
  return value.replaceAll(/\s|-/g, '').toLowerCase()
}

async function findDistrictWithNominatim(district: DistrictNode, signal?: AbortSignal) {
  const searchTerms = Array.from(
    new Set([
      `${district.fullName.replaceAll('-', ', ')}, 대한민국`,
      `${district.fullName.replaceAll('-', ' ')}`,
      district.name,
    ]),
  )

  for (const searchTerm of searchTerms) {
    const results = await fetchNominatimResults(searchTerm, signal)
    const bestMatch = pickBestNominatimMatch(district, results)

    if (bestMatch) {
      return {
        latitude: Number(bestMatch.lat),
        longitude: Number(bestMatch.lon),
        label: formatNominatimLabel(bestMatch),
        timezone: null,
      }
    }
  }

  return null
}

async function fetchNominatimResults(searchTerm: string, signal?: AbortSignal) {
  const requestUrl = new URL(NOMINATIM_SEARCH_API_URL)

  requestUrl.searchParams.set('q', searchTerm)
  requestUrl.searchParams.set('format', 'jsonv2')
  requestUrl.searchParams.set('limit', '10')
  requestUrl.searchParams.set('countrycodes', 'kr')
  requestUrl.searchParams.set('addressdetails', '1')
  requestUrl.searchParams.set('accept-language', 'ko')

  const response = await fetch(requestUrl, {
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    return []
  }

  return (await response.json()) as NominatimSearchResult[]
}

function pickBestNominatimMatch(district: DistrictNode, results: NominatimSearchResult[]) {
  const rankedResults = results
    .map((result) => ({
      result,
      score: getNominatimScore(district, result),
    }))
    .filter((item) => item.score >= getMinimumNominatimScore(district))
    .sort((left, right) => right.score - left.score)

  return rankedResults[0]?.result ?? null
}

function getNominatimScore(district: DistrictNode, result: NominatimSearchResult) {
  const selectedSegments = district.fullName.split('-').map(normalizeValue)
  const lastSegment = selectedSegments.at(-1) ?? ''
  const address = result.address
  const candidateSegments = Array.from(
    new Set(
      [
        result.display_name,
        address?.state,
        address?.county,
        address?.city,
        address?.city_district,
        address?.district,
        address?.borough,
        address?.suburb,
        address?.town,
        address?.village,
        address?.hamlet,
        address?.quarter,
        address?.neighbourhood,
      ]
        .filter((value): value is string => Boolean(value))
        .map(normalizeValue),
    ),
  )

  let score = 0

  if (candidateSegments.some((candidateSegment) => candidateSegment === lastSegment)) {
    score += 45
  }

  for (const segment of selectedSegments) {
    if (candidateSegments.includes(segment)) {
      score += 12
      continue
    }

    if (candidateSegments.some((candidateSegment) => candidateSegment.includes(segment))) {
      score += 5
    }
  }

  return score
}

function getMinimumNominatimScore(district: DistrictNode) {
  if (district.depth === 1) {
    return 30
  }

  if (district.depth === 2) {
    return 38
  }

  return 45
}

function formatNominatimLabel(result: NominatimSearchResult) {
  const address = result.address
  const labelParts = Array.from(
    new Set(
      [
        address?.neighbourhood,
        address?.quarter,
        address?.suburb,
        address?.borough,
        address?.district,
        address?.city_district,
        address?.town,
        address?.city,
        address?.county,
        address?.state,
      ].filter((value): value is string => Boolean(value)),
    ),
  )

  return labelParts.length > 0 ? labelParts.join(' · ') : result.display_name
}
