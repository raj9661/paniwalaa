'use client'

import { CheckCircle2, XCircle } from 'lucide-react'

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null

  const checks = {
    length: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasLetter: /[a-zA-Z]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }

  const strength = Object.values(checks).filter(Boolean).length
  const strengthLevel = strength === 4 ? 'strong' : strength >= 2 ? 'medium' : 'weak'
  const strengthColor = strength === 4 ? 'text-green-600' : strength >= 2 ? 'text-yellow-600' : 'text-red-600'
  const strengthText = strength === 4 ? 'Strong Password' : strength >= 2 ? 'Medium Password' : 'Weak Password'

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${strengthColor}`}>{strengthText}</span>
      </div>
      <div className="space-y-1 text-xs">
        <div className={`flex items-center gap-2 ${checks.length ? 'text-green-600' : 'text-gray-400'}`}>
          {checks.length ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <XCircle className="w-3 h-3" />
          )}
          <span>At least 8 characters</span>
        </div>
        <div className={`flex items-center gap-2 ${checks.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
          {checks.hasNumber ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <XCircle className="w-3 h-3" />
          )}
          <span>Contains a number</span>
        </div>
        <div className={`flex items-center gap-2 ${checks.hasLetter ? 'text-green-600' : 'text-gray-400'}`}>
          {checks.hasLetter ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <XCircle className="w-3 h-3" />
          )}
          <span>Contains a letter</span>
        </div>
        <div className={`flex items-center gap-2 ${checks.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`}>
          {checks.hasSpecialChar ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <XCircle className="w-3 h-3" />
          )}
          <span>Contains a special character</span>
        </div>
      </div>
    </div>
  )
}

// Helper function to validate password strength
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }

  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }

  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter' }
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' }
  }

  return { valid: true }
}

