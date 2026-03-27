const CITY_DISTRICT_BOUNDARY_PATTERN = /^(.+시)(.+(?:구|군))$/

export function getDistrictSegments(value: string) {
  return value
    .split('-')
    .filter((segment) => segment.length > 0)
    .map((segment) => formatAdministrativeSegment(segment))
}

export function formatDistrictLabel(value: string, separator = ' ') {
  return getDistrictSegments(value).join(separator)
}

export function getDistrictPrimaryLabel(value: string) {
  const segments = getDistrictSegments(value)
  return segments.at(-1) ?? value
}

export function getDistrictSecondaryLabel(value: string, separator = ' · ') {
  const segments = getDistrictSegments(value)

  if (segments.length <= 1) {
    return null
  }

  return segments.slice(0, -1).join(separator)
}

export function getCompactAdministrativeLabel(value: string, maxParts = 3) {
  const parts = value
    .split(/[·\s]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)

  if (parts.length <= maxParts) {
    return parts.join(' ')
  }

  return parts.slice(-maxParts).join(' ')
}

export function formatDistrictSearchLabel(value: string) {
  return formatDistrictLabel(value)
}

function formatAdministrativeSegment(value: string) {
  const normalizedValue = value.replaceAll(/\s+/g, ' ').trim()
  const matchedSegments = normalizedValue.match(CITY_DISTRICT_BOUNDARY_PATTERN)

  if (!matchedSegments) {
    return normalizedValue
  }

  const [, citySegment, districtSegment] = matchedSegments

  if (!citySegment || !districtSegment) {
    return normalizedValue
  }

  return `${citySegment} ${districtSegment}`
}
