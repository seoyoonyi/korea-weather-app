import type { DistrictNode } from '@/entities/district/model/types'

type DistrictCoordinates = {
  latitude: number
  longitude: number
}

const ROOT_DISTRICT_COORDINATES: Record<string, DistrictCoordinates> = {
  서울특별시: { latitude: 37.5665, longitude: 126.978 },
  부산광역시: { latitude: 35.1796, longitude: 129.0756 },
  대구광역시: { latitude: 35.8714, longitude: 128.6014 },
  인천광역시: { latitude: 37.4563, longitude: 126.7052 },
  광주광역시: { latitude: 35.1595, longitude: 126.8526 },
  대전광역시: { latitude: 36.3504, longitude: 127.3845 },
  울산광역시: { latitude: 35.5384, longitude: 129.3114 },
  세종특별자치시: { latitude: 36.48, longitude: 127.289 },
  경기도: { latitude: 37.2636, longitude: 127.0286 },
  충청북도: { latitude: 36.6424, longitude: 127.489 },
  충청남도: { latitude: 36.659, longitude: 126.6728 },
  전라남도: { latitude: 34.8161, longitude: 126.463 },
  경상북도: { latitude: 36.5684, longitude: 128.7294 },
  경상남도: { latitude: 35.2279, longitude: 128.6811 },
  제주특별자치도: { latitude: 33.4996, longitude: 126.5312 },
  강원특별자치도: { latitude: 37.8813, longitude: 127.7298 },
  전북특별자치도: { latitude: 35.8242, longitude: 127.148 },
}

export function getDistrictRepresentativeCoordinates(district: DistrictNode) {
  const rootDistrictName = district.fullName.split('-')[0]

  if (!rootDistrictName) {
    return null
  }

  return ROOT_DISTRICT_COORDINATES[rootDistrictName] ?? null
}
