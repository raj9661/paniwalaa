'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Droplet, Plus, Edit, Trash2, Eye, AlertCircle, CheckCircle, Info, Gift } from 'lucide-react'
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

interface Popup {
  id: string
  title: string
  content: string
  type: string
  position: string
  isActive: boolean
  showOnAllPages: boolean
  targetPages: string | null
  targetRoles: string | null
  startDate: string | null
  endDate: string | null
  showOnce: boolean
  buttonText: string | null
  buttonLink: string | null
  imageUrl: string | null
  views: string
  dismissals: string
  createdAt: string
}

export default function AdminPopupsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [popups, setPopups] = useState<Popup[]>([])
  const [loadingPopups, setLoadingPopups] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; popupId: string | null }>({
    open: false,
    popupId: null,
  })
  const [editDialog, setEditDialog] = useState<{ open: boolean; popup: Popup | null }>({
    open: false,
    popup: null,
  })
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    position: 'center',
    isActive: true,
    showOnAllPages: true,
    targetPages: [] as string[],
    targetRoles: ['all'] as string[],
    startDate: '',
    endDate: '',
    showOnce: false,
    buttonText: '',
    buttonLink: '',
    imageUrl: '',
  })

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchPopups()
    }
  }, [user])

  const fetchPopups = async () => {
    try {
      setLoadingPopups(true)
      const response = await fetch('/api/popups')
      const data = await response.json()
      setPopups(data.popups || [])
    } catch (error) {
      console.error('Error fetching popups:', error)
    } finally {
      setLoadingPopups(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editDialog.popup ? `/api/popups/${editDialog.popup.id}` : '/api/popups'
      const method = editDialog.popup ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: user?.id,
        }),
      })

      if (response.ok) {
        setEditDialog({ open: false, popup: null })
        fetchPopups()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save popup')
      }
    } catch (error) {
      console.error('Error saving popup:', error)
      alert('Failed to save popup')
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.popupId) return

    try {
      const response = await fetch(`/api/popups/${deleteDialog.popupId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPopups(popups.filter((p) => p.id !== deleteDialog.popupId))
        setDeleteDialog({ open: false, popupId: null })
      } else {
        alert('Failed to delete popup')
      }
    } catch (error) {
      console.error('Error deleting popup:', error)
      alert('Failed to delete popup')
    }
  }

  const openEditDialog = (popup: Popup | null) => {
    if (popup) {
      const parsedRoles = popup.targetRoles ? JSON.parse(popup.targetRoles) : ['all']
      // Ensure we have a single role selected (take first if multiple)
      const selectedRole = Array.isArray(parsedRoles) && parsedRoles.length > 0 ? [parsedRoles[0]] : ['all']
      
      setFormData({
        title: popup.title,
        content: popup.content,
        type: popup.type,
        position: popup.position,
        isActive: popup.isActive,
        showOnAllPages: popup.showOnAllPages,
        targetPages: popup.targetPages ? JSON.parse(popup.targetPages) : [],
        targetRoles: selectedRole,
        startDate: popup.startDate ? new Date(popup.startDate).toISOString().slice(0, 16) : '',
        endDate: popup.endDate ? new Date(popup.endDate).toISOString().slice(0, 16) : '',
        showOnce: popup.showOnce,
        buttonText: popup.buttonText || '',
        buttonLink: popup.buttonLink || '',
        imageUrl: popup.imageUrl || '',
      })
    }
    setEditDialog({ open: true, popup })
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'info',
      position: 'center',
      isActive: true,
      showOnAllPages: true,
      targetPages: [],
      targetRoles: ['all'],
      startDate: '',
      endDate: '',
      showOnce: false,
      buttonText: '',
      buttonLink: '',
      imageUrl: '',
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
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
      promotion: 'bg-purple-100 text-purple-700 border-purple-200',
    }
    return <Badge variant="secondary" className={variants[type as keyof typeof variants] || variants.info}>{type}</Badge>
  }

  if (loading || loadingPopups) {
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
                <h1 className="text-2xl font-bold text-foreground">Popup Management</h1>
                <p className="text-xs text-muted-foreground">Manage user popups</p>
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
        <Breadcrumb items={[{ label: 'Popups' }]} className="mb-6" />
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Popups</h2>
          <Button
            onClick={() => {
              resetForm()
              openEditDialog(null)
            }}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 gap-2"
          >
            <Plus className="w-4 h-4" />
            New Popup
          </Button>
        </div>

        <div className="grid gap-4">
          {popups.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No popups created yet</p>
                <Button
                  onClick={() => {
                    resetForm()
                    openEditDialog(null)
                  }}
                  className="mt-4"
                  variant="outline"
                >
                  Create your first popup
                </Button>
              </CardContent>
            </Card>
          ) : (
            popups.map((popup) => (
              <Card key={popup.id} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {getTypeIcon(popup.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg">{popup.title}</h3>
                          {getTypeBadge(popup.type)}
                          {popup.isActive ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2" dangerouslySetInnerHTML={{ __html: popup.content }} />
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span>Position: {popup.position}</span>
                          <span>Views: {parseInt(popup.views || '0').toLocaleString()}</span>
                          <span>Dismissals: {parseInt(popup.dismissals || '0').toLocaleString()}</span>
                          {popup.showOnAllPages ? (
                            <span>All Pages</span>
                          ) : (
                            <span>Specific Pages</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(popup)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => setDeleteDialog({ open: true, popupId: popup.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, popup: null })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog.popup ? 'Edit Popup' : 'Create New Popup'}</DialogTitle>
            <DialogDescription>Configure popup settings and targeting</DialogDescription>
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
              <Label htmlFor="content">Content (HTML) *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={5}
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
                  <option value="promotion">Promotion</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <select
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Roles *</Label>
              <div className="space-y-2 p-3 border rounded-md bg-gray-50">
                <Label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                  <input
                    type="radio"
                    name="targetRoles"
                    value="all"
                    checked={formData.targetRoles[0] === 'all'}
                    onChange={() => setFormData({ ...formData, targetRoles: ['all'] })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="font-medium">All Users</span>
                </Label>
                <Label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                  <input
                    type="radio"
                    name="targetRoles"
                    value="customer"
                    checked={formData.targetRoles[0] === 'customer'}
                    onChange={() => setFormData({ ...formData, targetRoles: ['customer'] })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="font-medium">Customers Only</span>
                </Label>
                <Label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                  <input
                    type="radio"
                    name="targetRoles"
                    value="delivery_partner"
                    checked={formData.targetRoles[0] === 'delivery_partner'}
                    onChange={() => setFormData({ ...formData, targetRoles: ['delivery_partner'] })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="font-medium">Delivery Partners Only</span>
                </Label>
                <Label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                  <input
                    type="radio"
                    name="targetRoles"
                    value="admin"
                    checked={formData.targetRoles[0] === 'admin'}
                    onChange={() => setFormData({ ...formData, targetRoles: ['admin'] })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="font-medium">Admins Only</span>
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">Select which user roles should see this popup</p>
            </div>

            <div className="space-y-2">
              <Label>
                <input
                  type="checkbox"
                  checked={formData.showOnAllPages}
                  onChange={(e) => setFormData({ ...formData, showOnAllPages: e.target.checked })}
                  className="mr-2"
                />
                Show on all pages
              </Label>
            </div>

            {!formData.showOnAllPages && (
              <div className="space-y-2">
                <Label htmlFor="targetPages">Target Pages (comma-separated paths)</Label>
                <Input
                  id="targetPages"
                  value={formData.targetPages.join(', ')}
                  onChange={(e) => setFormData({ ...formData, targetPages: e.target.value.split(',').map(p => p.trim()) })}
                  placeholder="/customer, /admin"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buttonText">Button Text</Label>
              <Input
                id="buttonText"
                value={formData.buttonText}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buttonLink">Button Link</Label>
              <Input
                id="buttonLink"
                value={formData.buttonLink}
                onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                placeholder="/customer/orders"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center gap-4">
              <Label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                Active
              </Label>
              <Label>
                <input
                  type="checkbox"
                  checked={formData.showOnce}
                  onChange={(e) => setFormData({ ...formData, showOnce: e.target.checked })}
                  className="mr-2"
                />
                Show once per user
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialog({ open: false, popup: null })}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-500">
                {editDialog.popup ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, popupId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the popup.
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

