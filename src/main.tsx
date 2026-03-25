import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/app/App'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { FavoritesProvider } from '@/features/favorite/model/FavoritesProvider'
import '@/app/styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <FavoritesProvider>
        <App />
      </FavoritesProvider>
    </QueryProvider>
  </StrictMode>,
)
