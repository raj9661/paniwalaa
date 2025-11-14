'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { mockUsers } from './mock-data'

type User = {
  id: string
  email: string
  phone: string
  name: string
  role: 'customer' | 'delivery_partner' | 'admin' | 'super_admin'
  status: 'active' | 'inactive' | 'suspended'
}

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string | null, password: string, phone?: string | null) => Promise<void>
  signUp: (email: string, password: string, name: string, phone: string, role: string) => Promise<void>
  signOut: () => Promise<void>
  updateUser: (updatedUser: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('paani_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string | null, password: string, phone?: string | null) => {
    try {
      // Generate device fingerprint
      const deviceFingerprint = await generateDeviceFingerprint()

      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email || null, 
          phone: phone || null,
          password, 
          deviceFingerprint 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials')
      }

      // Set user from response
      const foundUser: User = {
        id: data.user.id,
        email: data.user.email || '',
        phone: data.user.phone || '',
        name: data.user.name || '',
        role: data.user.role as User['role'],
        status: data.user.isActive ? 'active' : 'inactive',
      }
      setUser(foundUser)
      localStorage.setItem('paani_user', JSON.stringify(foundUser))
      
      // Redirect based on role
      if (foundUser.role === 'admin' || foundUser.role === 'super_admin') {
        router.push('/admin')
      } else if (foundUser.role === 'delivery_partner') {
        router.push('/delivery')
      } else {
        router.push('/customer')
      }
    } catch (error: any) {
      throw new Error(error.message || 'Invalid credentials')
    }
  }

  // Generate device fingerprint
  const generateDeviceFingerprint = async (): Promise<string> => {
    try {
      // Get browser fingerprint components
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillText('Device fingerprint', 2, 2)
      }
      const canvasFingerprint = canvas.toDataURL()

      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvasFingerprint,
        navigator.hardwareConcurrency || '',
        navigator.deviceMemory || '',
      ].join('|')

      // Create hash
      const encoder = new TextEncoder()
      const data = encoder.encode(fingerprint)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (error) {
      // Fallback to simple fingerprint
      return `${navigator.userAgent}-${navigator.language}-${screen.width}x${screen.height}`
    }
  }

  const signUp = async (email: string, password: string, name: string, phone: string, role: string) => {
    try {
      // Generate device fingerprint
      const deviceFingerprint = await generateDeviceFingerprint()

      // Call signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone, role, deviceFingerprint }),
      })

      const data = await response.json()

      if (!response.ok) {
        // If account already exists, redirect to login
        if (data.redirectToLogin) {
          setTimeout(() => {
            router.push('/login')
          }, 2000) // Give time to show error message
          throw new Error(data.error || 'Account already exists. Please login.')
        }
        throw new Error(data.error || 'Failed to create account')
      }

      // Set user from response
      const newUser: User = {
        id: data.user.id,
        email: data.user.email || '',
        phone: data.user.phone || '',
        name: data.user.name || '',
        role: data.user.role as User['role'],
        status: 'active',
      }
      setUser(newUser)
      localStorage.setItem('paani_user', JSON.stringify(newUser))
      
      // Redirect based on role
      if (newUser.role === 'admin') {
        router.push('/admin')
      } else if (newUser.role === 'delivery_partner') {
        router.push('/delivery')
      } else {
        router.push('/customer')
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create account')
    }
  }

  const signOut = async () => {
    setUser(null)
    localStorage.removeItem('paani_user')
    router.push('/login')
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('paani_user', JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateUser }}>
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
