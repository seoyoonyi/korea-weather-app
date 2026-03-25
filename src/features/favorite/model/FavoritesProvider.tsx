import { createContext, useContext, useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { AddFavoritePlaceInput, FavoritePlace } from '@/entities/favorite/model/types'
import { DEFAULT_WEATHER_TIMEZONE } from '@/shared/config/api'

const FAVORITES_STORAGE_KEY = 'korea-weather-app:favorites'
export const FAVORITES_LIMIT = 6

type AddFavoriteResult =
  | { ok: true; favorite: FavoritePlace }
  | { ok: false; reason: 'duplicate' | 'limit' }

type FavoritesContextValue = {
  favorites: FavoritePlace[]
  addFavorite: (input: AddFavoritePlaceInput) => AddFavoriteResult
  removeFavorite: (favoriteId: string) => void
  updateFavoriteAlias: (favoriteId: string, alias: string) => void
  findFavoriteById: (favoriteId: string) => FavoritePlace | undefined
  findFavoriteByDistrict: (districtFullName: string) => FavoritePlace | undefined
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: PropsWithChildren) {
  const [favorites, setFavorites] = useState<FavoritePlace[]>(readFavorites)

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
  }, [favorites])

  const addFavorite = (input: AddFavoritePlaceInput): AddFavoriteResult => {
    const existingFavorite = favorites.find(
      (favorite) => favorite.districtFullName === input.districtFullName,
    )

    if (existingFavorite) {
      return { ok: false, reason: 'duplicate' }
    }

    if (favorites.length >= FAVORITES_LIMIT) {
      return { ok: false, reason: 'limit' }
    }

    const favorite: FavoritePlace = {
      id: createFavoriteId(),
      createdAt: new Date().toISOString(),
      ...input,
      alias: input.alias.trim() || input.districtName,
    }

    setFavorites((previousFavorites) => [favorite, ...previousFavorites])
    return { ok: true, favorite }
  }

  const removeFavorite = (favoriteId: string) => {
    setFavorites((previousFavorites) =>
      previousFavorites.filter((favorite) => favorite.id !== favoriteId),
    )
  }

  const updateFavoriteAlias = (favoriteId: string, alias: string) => {
    setFavorites((previousFavorites) =>
      previousFavorites.map((favorite) => {
        if (favorite.id !== favoriteId) {
          return favorite
        }

        const nextAlias = alias.trim() || favorite.districtName

        return {
          ...favorite,
          alias: nextAlias,
        }
      }),
    )
  }

  const findFavoriteById = (favoriteId: string) =>
    favorites.find((favorite) => favorite.id === favoriteId)

  const findFavoriteByDistrict = (districtFullName: string) =>
    favorites.find((favorite) => favorite.districtFullName === districtFullName)

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        updateFavoriteAlias,
        findFavoriteById,
        findFavoriteByDistrict,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)

  if (!context) {
    throw new Error('useFavorites는 FavoritesProvider 내부에서만 사용할 수 있습니다.')
  }

  return context
}

function readFavorites() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const storedValue = window.localStorage.getItem(FAVORITES_STORAGE_KEY)

    if (!storedValue) {
      return []
    }

    const parsedValue = JSON.parse(storedValue) as unknown

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue
      .map((value) => sanitizeFavorite(value))
      .filter((value): value is FavoritePlace => value !== null)
      .slice(0, FAVORITES_LIMIT)
  } catch {
    return []
  }
}

function sanitizeFavorite(value: unknown): FavoritePlace | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const favorite = value as Partial<FavoritePlace>
  const latitude = toFiniteNumber(favorite.latitude)
  const longitude = toFiniteNumber(favorite.longitude)

  if (latitude === null || longitude === null) {
    return null
  }

  const districtName = getNonEmptyString(
    favorite.districtName,
    favorite.alias,
    favorite.label,
    '저장된 장소',
  )
  const districtFullName = getNonEmptyString(
    favorite.districtFullName,
    favorite.label,
    favorite.districtName,
    districtName,
  )

  return {
    id: getNonEmptyString(favorite.id, createFavoriteId()),
    districtFullName,
    districtName,
    alias: getNonEmptyString(favorite.alias, districtName),
    label: getNonEmptyString(favorite.label, districtFullName),
    latitude,
    longitude,
    timezone: getNonEmptyString(favorite.timezone, DEFAULT_WEATHER_TIMEZONE),
    createdAt: getNonEmptyString(favorite.createdAt, new Date().toISOString()),
  }
}

function getNonEmptyString(...values: Array<string | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }

  return ''
}

function toFiniteNumber(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function createFavoriteId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `favorite-${Date.now()}`
}
