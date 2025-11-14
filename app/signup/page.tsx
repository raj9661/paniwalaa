'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PasswordStrength, validatePasswordStrength } from '@/components/password-strength'
import { Droplet } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('customer')
  const [loading, setLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [nameError, setNameError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const handleNameChange = (value: string) => {
    // Only allow letters and spaces
    const cleanedValue = value.replace(/[^a-zA-Z\s]/g, '')
    setName(cleanedValue)
    setNameError('')
    
    if (cleanedValue && cleanedValue.trim().length < 2) {
      setNameError('Name must be at least 2 characters long')
    }
  }

  const handlePhoneChange = (value: string) => {
    // Only allow numeric digits
    const cleanedValue = value.replace(/\D/g, '').slice(0, 10)
    setPhone(cleanedValue)
    setPhoneError('')
    
    if (cleanedValue && cleanedValue.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits')
    }
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setPasswordError('')
    
    if (value) {
      const validation = validatePasswordStrength(value)
      if (!validation.valid) {
        setPasswordError(validation.message || '')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate name
    if (!name || name.trim().length < 2) {
      setNameError('Name must be at least 2 characters long and contain only letters')
      return
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      setNameError('Name must contain only letters and spaces')
      return
    }

    // Validate phone
    if (!phone || phone.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits')
      return
    }
    if (!/^\d{10}$/.test(phone)) {
      setPhoneError('Phone number must contain only numbers')
      return
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.message || 'Password does not meet requirements')
      return
    }

    setLoading(true)
    setPasswordError('')
    setNameError('')
    setPhoneError('')

    try {
      await signUp(email, password, name.trim(), phone, role)
    } catch (err: any) {
      console.error('Signup error:', err)
      // If account exists, error message will be shown and user will be redirected
      if (err.message?.includes('already exists') || err.message?.includes('login') || err.message?.includes('Please login')) {
        // User will be redirected to login page by auth context
        setPasswordError(err.message || 'Account already exists. Redirecting to login...')
        // Redirect will happen automatically after 2 seconds
      } else {
        // Show the actual error message from the API
        setPasswordError(err.message || 'Failed to create account. Please check all fields and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Droplet className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join Paniwalaa and get water delivered fast</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Error Display */}
            {passwordError && passwordError.includes('Failed to create account') && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-600 font-medium">{passwordError}</p>
                <p className="text-xs text-red-500 mt-1">
                  Please check:
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>All fields are filled correctly</li>
                    <li>Name contains only letters</li>
                    <li>Phone number is exactly 10 digits</li>
                    <li>Email is valid</li>
                    <li>Password meets all requirements</li>
                    <li>Account doesn't already exist</li>
                  </ul>
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Rajesh Kumar"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className={nameError ? 'border-red-500' : ''}
              />
              {nameError && (
                <p className="text-sm text-red-600">{nameError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Only letters and spaces allowed
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                required
                maxLength={10}
                className={phoneError ? 'border-red-500' : ''}
              />
              {phoneError && (
                <p className="text-sm text-red-600">{phoneError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be exactly 10 digits (numbers only)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter a strong password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                className={passwordError ? 'border-red-500' : ''}
              />
              {password && <PasswordStrength password={password} />}
              {passwordError && (
                <p className="text-sm text-red-600 mt-1">{passwordError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters with letters, numbers, and special characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">I want to</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Order Water</SelectItem>
                  <SelectItem value="delivery_partner">Deliver Orders</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
