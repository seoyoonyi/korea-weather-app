import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { FavoriteDetailPage } from '@/pages/favorite-detail/ui/FavoriteDetailPage'
import { HomePage } from '@/pages/home/ui/HomePage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/favorites/:favoriteId" element={<FavoriteDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
