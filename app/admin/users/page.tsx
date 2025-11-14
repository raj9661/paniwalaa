'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Droplet, Users, Search, Lock, Unlock, Ban, CheckCircle, Shield, Mail, Phone, Calendar, AlertTriangle, Plus, Power, PowerOff } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import Link from 'next/link'

interface User {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: string
  isActive: boolean
  isSuspended: boolean
  suspensionReason: string | null
  failedLoginAttempts: number
  lockedUntil: string | null
  createdAt: string
  lastLoginAt: string | null
}

export default function UsersManagementPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    type: 'lock' | 'unlock' | 'suspend' | 'unsuspend' | 'activate' | 'deactivate' | null
  }>({ open: false, type: null })
  const [suspendReason, setSuspendReason] = useState('')
  const [createUserDialog, setCreateUserDialog] = useState(false)
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin', // admin or delivery_partner
  })
  const [creatingUser, setCreatingUser] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'super_admin')) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchUsers()
    }
  }, [user, filterRole])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const params = new URLSearchParams()
      if (filterRole) params.append('role', filterRole)
      if (searchQuery) params.append('search', searchQuery)
      params.append('limit', '100')

      const response = await fetch(`/api/users?${params.toString()}`)
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleLock = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockDurationMinutes: 30 * 24 * 60 }), // 30 days
      })

      if (response.ok) {
        alert('Account locked successfully')
        setActionDialog({ open: false, type: null })
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to lock account')
      }
    } catch (error) {
      console.error('Error locking account:', error)
      alert('Failed to lock account')
    }
  }

  const handleUnlock = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}/unlock`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('Account unlocked successfully')
        setActionDialog({ open: false, type: null })
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to unlock account')
      }
    } catch (error) {
      console.error('Error unlocking account:', error)
      alert('Failed to unlock account')
    }
  }

  const handleSuspend = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: suspendReason || 'Account suspended by administrator' }),
      })

      if (response.ok) {
        alert('Account suspended successfully')
        setActionDialog({ open: false, type: null })
        setSuspendReason('')
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to suspend account')
      }
    } catch (error) {
      console.error('Error suspending account:', error)
      alert('Failed to suspend account')
    }
  }

  const handleUnsuspend = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}/unsuspend`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('Account unsuspended successfully')
        setActionDialog({ open: false, type: null })
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to unsuspend account')
      }
    } catch (error) {
      console.error('Error unsuspending account:', error)
      alert('Failed to unsuspend account')
    }
  }

  const openActionDialog = (user: User, type: 'lock' | 'unlock' | 'suspend' | 'unsuspend' | 'activate' | 'deactivate') => {
    // Prevent actions on super admin users
    if (user.role === 'super_admin' && (type === 'lock' || type === 'unlock' || type === 'suspend' || type === 'unsuspend' || type === 'activate' || type === 'deactivate')) {
      alert('Cannot perform this action on super admin accounts')
      return
    }
    setSelectedUser(user)
    setActionDialog({ open: true, type })
  }

  const handleActivate = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}/activate`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('Account activated successfully')
        setActionDialog({ open: false, type: null })
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to activate account')
      }
    } catch (error) {
      console.error('Error activating account:', error)
      alert('Failed to activate account')
    }
  }

  const handleDeactivate = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}/deactivate`, {
        method: 'POST',
      })

      if (response.ok) {
        alert('Account deactivated successfully')
        setActionDialog({ open: false, type: null })
        fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to deactivate account')
      }
    } catch (error) {
      console.error('Error deactivating account:', error)
      alert('Failed to deactivate account')
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingUser(true)

    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUserForm,
          createdBy: user?.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('User created successfully')
        setCreateUserDialog(false)
        setNewUserForm({ name: '', email: '', phone: '', password: '', role: 'admin' })
        fetchUsers()
      } else {
        alert(data.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Failed to create user')
    } finally {
      setCreatingUser(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isLocked = (user: User) => {
    return user.lockedUntil && new Date(user.lockedUntil) > new Date()
  }

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query)
    )
  })

  const getRoleBadge = (role: string) => {
    const variants = {
      customer: 'bg-blue-100 text-blue-700',
      delivery_partner: 'bg-green-100 text-green-700',
      admin: 'bg-purple-100 text-purple-700',
      super_admin: 'bg-red-100 text-red-700',
    }
    return (
      <Badge variant="secondary" className={variants[role as keyof typeof variants] || ''}>
        {role === 'super_admin' ? 'Super Admin' : role === 'delivery_partner' ? 'Delivery Partner' : role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  if (loading || loadingUsers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user || user.role !== 'super_admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">User Management</h1>
                <p className="text-xs text-muted-foreground">Manage user accounts, locks, and suspensions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCreateUserDialog(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create User
              </Button>
              <Link href="/admin">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut()}>Logout</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'User Management' }]} className="mb-6" />
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="delivery_partner">Delivery Partner</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login Info</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm">{u.name || 'N/A'}</p>
                            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                              {u.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {u.email}
                                </div>
                              )}
                              {u.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {u.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getRoleBadge(u.role)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {!u.isActive && (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                Inactive
                              </Badge>
                            )}
                            {u.isSuspended && (
                              <Badge variant="secondary" className="bg-red-100 text-red-700">
                                <Ban className="w-3 h-3 mr-1" />
                                Suspended
                              </Badge>
                            )}
                            {isLocked(u) && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                <Lock className="w-3 h-3 mr-1" />
                                Locked
                              </Badge>
                            )}
                            {u.failedLoginAttempts >= 3 && !isLocked(u) && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {u.failedLoginAttempts} failed attempts
                              </Badge>
                            )}
                            {u.isActive && !u.isSuspended && !isLocked(u) && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}
                            {u.suspensionReason && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Reason: {u.suspensionReason}
                              </p>
                            )}
                            {isLocked(u) && u.lockedUntil && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Until: {formatDate(u.lockedUntil)}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Created: {formatDate(u.createdAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Last login: {formatDate(u.lastLoginAt)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {/* Only show lock/unlock for non-super-admin users */}
                            {u.role !== 'super_admin' && (
                              isLocked(u) ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openActionDialog(u, 'unlock')}
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  <Unlock className="w-3 h-3 mr-1" />
                                  Unlock
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openActionDialog(u, 'lock')}
                                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                >
                                  <Lock className="w-3 h-3 mr-1" />
                                  Lock
                                </Button>
                              )
                            )}
                            {/* Only show suspend/unsuspend for non-super-admin users */}
                            {u.role !== 'super_admin' && (
                              u.isSuspended ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openActionDialog(u, 'unsuspend')}
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Unsuspend
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openActionDialog(u, 'suspend')}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Ban className="w-3 h-3 mr-1" />
                                  Suspend
                                </Button>
                              )
                            )}
                            {/* Only show activate/deactivate for non-super-admin users */}
                            {u.role !== 'super_admin' && (
                              u.isActive ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openActionDialog(u, 'deactivate')}
                                  className="text-gray-600 border-gray-200 hover:bg-gray-50"
                                >
                                  <PowerOff className="w-3 h-3 mr-1" />
                                  Deactivate
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openActionDialog(u, 'activate')}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  <Power className="w-3 h-3 mr-1" />
                                  Activate
                                </Button>
                              )
                            )}
                            {u.role === 'super_admin' && (
                              <span className="text-xs text-muted-foreground">Protected</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lock/Unlock Dialog */}
      <AlertDialog open={actionDialog.open && (actionDialog.type === 'lock' || actionDialog.type === 'unlock')} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === 'lock' ? 'Lock Account' : 'Unlock Account'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.type === 'lock' ? (
                <>
                  Are you sure you want to lock <strong>{selectedUser?.name || selectedUser?.email}</strong>'s account?
                  The account will be locked for 30 days and cannot login until unlocked by a super admin.
                </>
              ) : (
                <>
                  Are you sure you want to unlock <strong>{selectedUser?.name || selectedUser?.email}</strong>'s account?
                  The user will be able to login again.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={actionDialog.type === 'lock' ? handleLock : handleUnlock}
              className={actionDialog.type === 'lock' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {actionDialog.type === 'lock' ? 'Lock Account' : 'Unlock Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend/Unsuspend Dialog */}
      <Dialog open={actionDialog.open && (actionDialog.type === 'suspend' || actionDialog.type === 'unsuspend')} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'suspend' ? 'Suspend Account' : 'Unsuspend Account'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'suspend' ? (
                <>
                  Suspend <strong>{selectedUser?.name || selectedUser?.email}</strong>'s account.
                  Suspended accounts cannot login until unsuspended.
                </>
              ) : (
                <>
                  Unsuspend <strong>{selectedUser?.name || selectedUser?.email}</strong>'s account.
                  The user will be able to login again.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {actionDialog.type === 'suspend' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Suspension Reason</Label>
              <Textarea
                id="reason"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter reason for suspension..."
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, type: null })}>
              Cancel
            </Button>
            <Button
              onClick={actionDialog.type === 'suspend' ? handleSuspend : handleUnsuspend}
              className={actionDialog.type === 'suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {actionDialog.type === 'suspend' ? 'Suspend Account' : 'Unsuspend Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate/Deactivate Dialog */}
      <AlertDialog open={actionDialog.open && (actionDialog.type === 'activate' || actionDialog.type === 'deactivate')} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === 'activate' ? 'Activate Account' : 'Deactivate Account'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.type === 'activate' ? (
                <>
                  Are you sure you want to activate <strong>{selectedUser?.name || selectedUser?.email}</strong>'s account?
                  The user will be able to login and use the system.
                </>
              ) : (
                <>
                  Are you sure you want to deactivate <strong>{selectedUser?.name || selectedUser?.email}</strong>'s account?
                  The user will not be able to login until the account is reactivated.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={actionDialog.type === 'activate' ? handleActivate : handleDeactivate}
              className={actionDialog.type === 'activate' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}
            >
              {actionDialog.type === 'activate' ? 'Activate Account' : 'Deactivate Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <Dialog open={createUserDialog} onOpenChange={setCreateUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new admin or delivery partner account
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={newUserForm.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setNewUserForm({ ...newUserForm, phone: value })
                }}
                placeholder="9876543210"
                maxLength={10}
                required
              />
              <p className="text-xs text-muted-foreground">10 digits only</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <select
                id="role"
                value={newUserForm.role}
                onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="admin">Admin</option>
                <option value="delivery_partner">Delivery Partner</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                placeholder="Enter password"
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters, alphanumeric with special characters
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateUserDialog(false)
                  setNewUserForm({ name: '', email: '', phone: '', password: '', role: 'admin' })
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creatingUser}>
                {creatingUser ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

