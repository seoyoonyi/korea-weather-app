export type FavoritePlace = {
  id: string
  districtFullName: string
  districtName: string
  alias: string
  label: string
  latitude: number
  longitude: number
  timezone: string
  createdAt: string
}

export type AddFavoritePlaceInput = {
  districtFullName: string
  districtName: string
  alias: string
  label: string
  latitude: number
  longitude: number
  timezone: string
}
