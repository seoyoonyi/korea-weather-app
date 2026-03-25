import { queryOptions, useQuery } from '@tanstack/react-query'
import { geocodeDistrict } from '@/entities/district/api/geocodeDistrict'
import type { DistrictNode } from '@/entities/district/model/types'

export function districtCoordsQueryOptions(district: DistrictNode | null) {
  return queryOptions({
    queryKey: ['district-coords', district?.fullName ?? null],
    queryFn: ({ signal }) => {
      if (!district) {
        return Promise.resolve(null)
      }

      return geocodeDistrict(district, { signal })
    },
    enabled: Boolean(district),
    staleTime: Infinity,
  })
}

export function useDistrictCoords(district: DistrictNode | null) {
  return useQuery(districtCoordsQueryOptions(district))
}
