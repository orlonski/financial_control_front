import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '@/services/api'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      
      // Verify token is still valid
      authApi.getMe()
        .then(({ user }) => {
          setUser(user)
        })
        .catch(() => {
          // Token is invalid, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { user, token } = await authApi.login({ email, password })
    
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    
    setUser(user)
    setToken(token)
  }

  const register = async (name: string, email: string, password: string) => {
    const { user, token } = await authApi.register({ name, email, password })
    
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    
    setUser(user)
    setToken(token)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
