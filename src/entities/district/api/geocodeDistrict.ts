import type { DistrictNode } from '@/entities/district/model/types'
import { getDistrictRepresentativeCoordinates } from '@/entities/district/model/districtCoordinates'
import { DEFAULT_WEATHER_TIMEZONE } from '@/shared/config/api'
import { formatDistrictLabel } from '@/shared/lib/formatDistrictLabel'

type GeocodeDistrictOptions = {
  signal?: AbortSignal
}

export type DistrictCoords = {
  latitude: number
  longitude: number
  label: string
  timezone: string | null
}

export async function geocodeDistrict(
  district: DistrictNode,
  _options: GeocodeDistrictOptions = {},
): Promise<DistrictCoords | null> {
  const representativeCoordinates = getDistrictRepresentativeCoordinates(district)

  if (!representativeCoordinates) {
    return null
  }

  return {
    latitude: representativeCoordinates.latitude,
    longitude: representativeCoordinates.longitude,
    label: formatDistrictLabel(district.fullName, ' · '),
    timezone: DEFAULT_WEATHER_TIMEZONE,
  }
}
