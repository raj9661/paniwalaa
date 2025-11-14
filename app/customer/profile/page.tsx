'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer/customer-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Phone, Mail, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function ProfilePage() {
  const { user, loading, updateUser } = useAuth()
  const router = useRouter()
  const [newPhoneNumber, setNewPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteSuccessDialogOpen, setDeleteSuccessDialogOpen] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'customer')) {
      router.push('/login')
      return
    }
  }, [user, loading, router])

  const validatePhoneNumber = (phone: string) => {
    if (!phone) {
      setPhoneError('Phone number is required')
      return false
    }
    if (!/^\d{10}$/.test(phone)) {
      setPhoneError('Phone number must be exactly 10 digits (numbers only)')
      return false
    }
    if (phone === user?.phone) {
      setPhoneError('New phone number must be different from current phone number')
      return false
    }
    setPhoneError('')
    return true
  }

  const handleSendOTP = async () => {
    if (!user) return

    setError('')
    setSuccess('')

    if (!validatePhoneNumber(newPhoneNumber)) {
      return
    }

    setSendingOtp(true)

    try {
      const response = await fetch('/api/users/change-phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          newPhoneNumber: newPhoneNumber.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send verification code')
        return
      }

      setSuccess('Verification code sent to your email address')
      setOtpSent(true)
      setOtpCode('')
    } catch (err) {
      setError('Failed to send verification code. Please try again.')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    setDeletingAccount(true)
    setError('')

    try {
      const response = await fetch('/api/users/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to delete account')
        setDeleteDialogOpen(false)
        return
      }

      // Show success dialog
      setDeleteDialogOpen(false)
      setDeleteSuccessDialogOpen(true)
      
      // Sign out user after 5 seconds
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          router.push('/login')
        }
      }, 5000)
    } catch (err) {
      setError('Failed to delete account. Please try again.')
      setDeleteDialogOpen(false)
    } finally {
      setDeletingAccount(false)
    }
  }

  const handleVerifyAndUpdate = async () => {
    if (!user) return

    setError('')
    setSuccess('')

    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code')
      return
    }

    setVerifying(true)

    try {
      const response = await fetch('/api/users/change-phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          code: otpCode.trim(),
          newPhoneNumber: newPhoneNumber.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update phone number')
        return
      }

      setSuccess('Phone number updated successfully!')
      setOtpSent(false)
      setNewPhoneNumber('')
      setOtpCode('')
      
      // Update user in auth context
      if (updateUser && data.user) {
        updateUser(data.user)
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('')
        // Refresh page to show updated phone number
        window.location.reload()
      }, 2000)
    } catch (err) {
      setError('Failed to update phone number. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader cartItemCount={0} onCartClick={() => {}} />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader cartItemCount={0} onCartClick={() => {}} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">My Profile</h1>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Account Information */}
          <Card className="mb-6 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
              <CardDescription>View your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground">Full Name</Label>
                <p className="text-lg font-semibold text-foreground mt-1">{user?.name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <p className="text-lg font-semibold text-foreground mt-1">{user?.email || 'Not set'}</p>
                {!user?.email && (
                  <p className="text-xs text-red-600 mt-1">
                    Email is required to change phone number. Please add an email to your account.
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <p className="text-lg font-semibold text-foreground mt-1">{user?.phone || 'Not set'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Change Phone Number */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Change Phone Number
              </CardTitle>
              <CardDescription>
                Update your phone number. A verification code will be sent to your email address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newPhone">New Phone Number</Label>
                <Input
                  id="newPhone"
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={newPhoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setNewPhoneNumber(value)
                    setPhoneError('')
                    setError('')
                  }}
                  disabled={otpSent || sendingOtp || verifying}
                  className={phoneError ? 'border-red-500' : ''}
                />
                {phoneError && (
                  <p className="text-sm text-red-600 mt-1">{phoneError}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Enter a 10-digit phone number (numbers only)
                </p>
              </div>

              {!otpSent ? (
                <Button
                  onClick={handleSendOTP}
                  disabled={!newPhoneNumber || sendingOtp || !user?.email}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  {sendingOtp ? 'Sending...' : 'Send Verification Code'}
                </Button>
              ) : (
                <>
                  <div>
                    <Label htmlFor="otpCode">Verification Code</Label>
                    <Input
                      id="otpCode"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otpCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setOtpCode(value)
                        setError('')
                      }}
                      disabled={verifying}
                      className="text-center text-2xl tracking-widest font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the 6-digit code sent to your email address
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleVerifyAndUpdate}
                      disabled={!otpCode || otpCode.length !== 6 || verifying}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    >
                      {verifying ? 'Verifying...' : 'Verify & Update'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOtpSent(false)
                        setOtpCode('')
                        setError('')
                        setSuccess('')
                      }}
                      disabled={verifying}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}

              {!user?.email && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    You need to have an email address associated with your account to change your phone number.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-2 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, it will be deactivated for 30 days. 
                If you log in again within 30 days, your account will be automatically reactivated. 
                If you don't log in within 30 days, your account will be permanently deleted.
              </p>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete My Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will deactivate your account for 30 days. If you log in again within 30 days, 
              your account will be automatically reactivated. If you don't log in within 30 days, 
              your account will be permanently deleted.
              <br /><br />
              This action cannot be undone after 30 days. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAccount}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingAccount ? 'Deleting...' : 'Yes, Delete My Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Success Dialog */}
      <AlertDialog open={deleteSuccessDialogOpen} onOpenChange={setDeleteSuccessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Account Deletion Scheduled
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Your account has been deactivated and is scheduled for deletion in 30 days.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-blue-900">Important Information:</p>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                  <li>Your account is deactivated for 30 days</li>
                  <li>If you log in again within 30 days, your account will be automatically reactivated</li>
                  <li>If you don't log in within 30 days, your account will be permanently deleted</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                You will be redirected to the login page in a few seconds.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setDeleteSuccessDialogOpen(false)
                router.push('/login')
              }}
              className="w-full"
            >
              Go to Login Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

