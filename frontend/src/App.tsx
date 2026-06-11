import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './components/LoginPage'
import AppLayout from './components/AppLayout'
import AnalisiPage from './pages/AnalisiPage'
import EsploraPage from './pages/EsploraPage'
import IngestPage from './pages/IngestPage'

function AppRoutes() {
  const { token } = useAuth()

  if (!token) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/analisi" replace />} />
        <Route path="/analisi" element={<AnalisiPage />} />
        <Route path="/esplora" element={<EsploraPage />} />
        <Route path="/ingest" element={<IngestPage />} />
        <Route path="*" element={<Navigate to="/analisi" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
