'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Droplet, Plus, Trash2, Bell, CheckCircle, AlertCircle, Info, Gift, XCircle } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth-context'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  targetType: string
  targetRoles: string | null
  targetUserIds: string | null
  userId: string | null
  isRead: boolean
  link: string | null
  imageUrl: string | null
  priority: string
  expiresAt: string | null
  createdAt: string
  readAt: string | null
}

export default function AdminNotificationsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; notificationId: string | null }>({
    open: false,
    notificationId: null,
  })
  const [createDialog, setCreateDialog] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; name: string | null; email: string | null; phone: string | null; role: string }>>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all',
    targetRoles: [] as string[],
    targetUserIds: [] as string[],
    userId: '',
    link: '',
    imageUrl: '',
    priority: 'normal',
    expiresAt: '',
  })

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchNotifications()
    }
  }, [user])

  useEffect(() => {
    if (createDialog && formData.targetType === 'user' && user?.role) {
      // Fetch users when dialog opens and target type is 'user'
      fetchUsers()
    }
  }, [createDialog, formData.targetType])

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      const response = await fetch('/api/notifications?adminView=true')
      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const params = new URLSearchParams()
      if (userSearch) params.append('search', userSearch)
      params.append('limit', '50')
      
      const response = await fetch(`/api/users?${params.toString()}`)
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (formData.targetType === 'user' && createDialog) {
      const timeoutId = setTimeout(() => {
        fetchUsers()
      }, 300) // Debounce search
      return () => clearTimeout(timeoutId)
    }
  }, [userSearch, formData.targetType, createDialog])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserDropdown])

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true
    const search = userSearch.toLowerCase()
    return (
      (u.name?.toLowerCase().includes(search)) ||
      (u.email?.toLowerCase().includes(search)) ||
      (u.phone?.includes(search)) ||
      (u.id.includes(search))
    )
  })

  const selectedUser = users.find(u => u.id === formData.userId)

  const handleUserSelect = (userId: string) => {
    setFormData({ ...formData, userId })
    setShowUserDropdown(false)
    setUserSearch('')
    // Ensure the selected user is in the users list for display
    if (!users.find(u => u.id === userId)) {
      fetchUsers() // Refetch to get the selected user
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: user?.id,
        }),
      })

      if (response.ok) {
        setCreateDialog(false)
        resetForm()
        fetchNotifications()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create notification')
      }
    } catch (error) {
      console.error('Error creating notification:', error)
      alert('Failed to create notification')
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.notificationId) return

    try {
      const response = await fetch(`/api/notifications/${deleteDialog.notificationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotifications(notifications.filter((n) => n.id !== deleteDialog.notificationId))
        setDeleteDialog({ open: false, notificationId: null })
      } else {
        alert('Failed to delete notification')
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      alert('Failed to delete notification')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      targetType: 'all',
      targetRoles: [],
      targetUserIds: [],
      userId: '',
      link: '',
      imageUrl: '',
      priority: 'normal',
      expiresAt: '',
    })
    setUserSearch('')
    setShowUserDropdown(false)
    setUsers([])
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'promotion':
        return <Gift className="w-5 h-5 text-purple-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getTypeBadge = (type: string) => {
    const variants = {
      info: 'bg-blue-100 text-blue-700 border-blue-200',
      success: 'bg-green-100 text-green-700 border-green-200',
      warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      error: 'bg-red-100 text-red-700 border-red-200',
      promotion: 'bg-purple-100 text-purple-700 border-purple-200',
    }
    return <Badge variant="secondary" className={variants[type as keyof typeof variants] || variants.info}>{type}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'bg-gray-100 text-gray-700',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    }
    return <Badge variant="secondary" className={variants[priority as keyof typeof variants] || variants.normal}>{priority}</Badge>
  }

  if (loading || loadingNotifications) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
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
                <h1 className="text-2xl font-bold text-foreground">Notification Management</h1>
                <p className="text-xs text-muted-foreground">Send notifications to users</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut()}>Logout</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Notifications' }]} className="mb-6" />
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Notifications</h2>
          <Button
            onClick={() => {
              resetForm()
              setCreateDialog(true)
            }}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 gap-2"
          >
            <Plus className="w-4 h-4" />
            Send Notification
          </Button>
        </div>

        <div className="grid gap-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications sent yet</p>
                <Button
                  onClick={() => {
                    resetForm()
                    setCreateDialog(true)
                  }}
                  className="mt-4"
                  variant="outline"
                >
                  Send your first notification
                </Button>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card key={notification.id} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {getTypeIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-bold text-lg">{notification.title}</h3>
                          {getTypeBadge(notification.type)}
                          {getPriorityBadge(notification.priority)}
                          {notification.isRead && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700">Read</Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground mb-2">{notification.message}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span>Target: {notification.targetType}</span>
                          {notification.targetRoles && (
                            <span>Roles: {JSON.parse(notification.targetRoles).join(', ')}</span>
                          )}
                          <span>Created: {new Date(notification.createdAt).toLocaleDateString()}</span>
                          {notification.expiresAt && (
                            <span>Expires: {new Date(notification.expiresAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => setDeleteDialog({ open: true, notificationId: notification.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={(open) => {
        setCreateDialog(open)
        if (!open) {
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>Create and send a notification to users</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="promotion">Promotion</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetType">Target Type</Label>
              <select
                id="targetType"
                value={formData.targetType}
                onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="all">All Users</option>
                <option value="role">By Role</option>
                <option value="user">Specific User</option>
              </select>
            </div>

            {formData.targetType === 'role' && (
              <div className="space-y-2">
                <Label htmlFor="targetRoles">Target Roles (comma-separated)</Label>
                <Input
                  id="targetRoles"
                  value={formData.targetRoles.join(', ')}
                  onChange={(e) => setFormData({ ...formData, targetRoles: e.target.value.split(',').map(r => r.trim()) })}
                  placeholder="customer, delivery_partner, admin"
                />
              </div>
            )}

            {formData.targetType === 'user' && (
              <div className="space-y-2">
                <Label htmlFor="userId">Select User *</Label>
                <div className="relative" ref={userDropdownRef}>
                  <Input
                    id="userId"
                    value={formData.userId && selectedUser 
                      ? `${selectedUser.name || 'Unknown'} (${selectedUser.email || selectedUser.phone || selectedUser.id})`
                      : userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value)
                      setShowUserDropdown(true)
                      if (!e.target.value) {
                        setFormData({ ...formData, userId: '' })
                      }
                    }}
                    onFocus={() => {
                      setShowUserDropdown(true)
                      if (!users.length) fetchUsers()
                      // Clear the display value to show search
                      if (formData.userId && selectedUser) {
                        setUserSearch('')
                      }
                    }}
                    placeholder={formData.userId ? "Click to change user..." : "Search by name, email, phone, or ID..."}
                    required
                    className="w-full"
                  />
                  {showUserDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {loadingUsers ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">Loading users...</div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">No users found</div>
                      ) : (
                        filteredUsers.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => handleUserSelect(u.id)}
                            className={`p-3 cursor-pointer hover:bg-gray-100 border-b border-gray-100 ${
                              formData.userId === u.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="font-medium text-sm">{u.name || 'Unknown User'}</div>
                            <div className="text-xs text-muted-foreground">
                              {u.email && <span>{u.email}</span>}
                              {u.email && u.phone && <span> • </span>}
                              {u.phone && <span>{u.phone}</span>}
                              {!u.email && !u.phone && <span>ID: {u.id}</span>}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              <Badge variant="secondary" className="text-xs">{u.role}</Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {formData.userId && selectedUser && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm font-medium text-blue-900">Selected: {selectedUser.name || 'Unknown User'}</p>
                    <p className="text-xs text-blue-700">
                      {selectedUser.email} {selectedUser.phone && `• ${selectedUser.phone}`}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">User ID: {formData.userId}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Search and select a user from the dropdown</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="link">Link (optional)</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="/customer/orders"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expires At (optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-500">
                Send Notification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, notificationId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

