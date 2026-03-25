import { queryOptions, useQuery } from '@tanstack/react-query'
import { getDistrictTree } from '@/entities/district/api/districtApi'

export function districtTreeQueryOptions() {
  return queryOptions({
    queryKey: ['district-tree'],
    queryFn: ({ signal }) => getDistrictTree({ signal }),
    staleTime: Infinity,
  })
}

export function useDistrictTree() {
  return useQuery(districtTreeQueryOptions())
}
