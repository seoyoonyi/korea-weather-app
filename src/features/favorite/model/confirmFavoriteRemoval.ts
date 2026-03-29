import type { FavoritePlace } from '@/entities/favorite/model/types'

export function confirmFavoriteRemoval(favorite: Pick<FavoritePlace, 'alias' | 'districtName'>) {
  if (typeof window === 'undefined') {
    return true
  }

  const favoriteName = favorite.alias.trim() || favorite.districtName.trim() || '선택한 장소'

  return window.confirm(
    `'${favoriteName}' 즐겨찾기를 정말 삭제할까요?\n삭제하면 홈에서 다시 추가해야 합니다.`,
  )
}
