import { createContext, useContext, useState, type ReactNode } from 'react'

interface AuthState {
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

const STORAGE_KEY = 'mm_jwt'
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem(STORAGE_KEY),
  )

  const login = async (username: string, password: string) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (!res.ok) {
      let message = 'Credenziali non valide'
      try {
        const err = await res.json()
        if (err.detail) message = err.detail
      } catch {}
      throw new Error(message)
    }

    const data = await res.json()
    sessionStorage.setItem(STORAGE_KEY, data.access_token)
    setToken(data.access_token)
  }

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
