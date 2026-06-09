import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './components/LoginPage'
import MainPage from './components/MainPage'

function AppRoutes() {
  const { token } = useAuth()
  return token ? <MainPage /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
