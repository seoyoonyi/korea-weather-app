import districtsUrl from '../../../../korea_districts.json?url'
import { buildDistrictTree } from '@/entities/district/model/buildDistrictTree'
import type { DistrictTree } from '@/entities/district/model/types'

type GetDistrictTreeOptions = {
  signal?: AbortSignal
}

export async function getDistrictTree(
  options: GetDistrictTreeOptions = {},
): Promise<DistrictTree> {
  const response = await fetch(districtsUrl, {
    headers: {
      Accept: 'application/json',
    },
    signal: options.signal,
  })

  if (!response.ok) {
    throw new Error('행정구역 데이터를 불러오지 못했습니다.')
  }

  const districtPaths = (await response.json()) as string[]
  return buildDistrictTree(districtPaths)
}
