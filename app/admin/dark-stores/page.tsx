'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Warehouse, Plus, Edit, Trash2, Package, AlertTriangle, 
  CheckCircle2, XCircle, Search, Users, MapPin, TrendingDown 
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
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

type DarkStore = {
  id: string
  name: string
  address: string
  pincode?: string
  latitude?: number
  longitude?: number
  phone?: string
  email?: string
  ownerName: string
  ownerPhone: string
  ownerEmail?: string
  ownerAddress?: string
  paymentModel: string
  rentAmountCents?: string
  perJarRateCents: string
  ownerSelfDelivery: boolean
  managerId?: string
  deliveryRadiusKm: number
  isActive: boolean
  notes?: string
  createdAt: string
  updatedAt: string
  // Product-specific inventory summary
  totalCurrentStock?: number
  totalMaxCapacity?: number
  isLowStock?: boolean
  stockPercentage?: number
  products?: Array<{
    id: string
    productId: string
    currentStock: number
    maxStockCapacity: number
    lowStockThreshold: number
    isLowStock: boolean
    product: {
      id: string
      title: string
      productType: string
    }
  }>
  lowStockProducts?: Array<{
    productTitle: string
    currentStock: number
    threshold: number
  }>
}

export default function DarkStoresPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [darkStores, setDarkStores] = useState<DarkStore[]>([])
  const [loadingStores, setLoadingStores] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingStore, setEditingStore] = useState<DarkStore | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; storeId: string | null }>({
    open: false,
    storeId: null,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [admins, setAdmins] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [deliveryPartners, setDeliveryPartners] = useState<Array<{ id: string; name: string; email: string; phone: string }>>([])
  const [ownerUserSearch, setOwnerUserSearch] = useState('')
  const [showOwnerUserDropdown, setShowOwnerUserDropdown] = useState(false)
  const [ownerUser, setOwnerUser] = useState<{ id: string; name: string; email: string; phone: string } | null>(null)
  const ownerUserDropdownRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    pincode: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerAddress: '',
    ownerUserId: '',
    paymentModel: 'per_jar',
    rentAmountCents: '',
    perJarRateCents: '5',
    ownerSelfDelivery: false,
    managerId: '',
    deliveryRadiusKm: '3',
    isActive: true,
    notes: '',
  })

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/admin')
      return
    }
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchDarkStores()
      fetchAdmins()
      fetchDeliveryPartners()
    }
  }, [user, loading, router])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ownerUserDropdownRef.current && !ownerUserDropdownRef.current.contains(event.target as Node)) {
        setShowOwnerUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/users?role=admin&role=super_admin')
      const data = await response.json()
      if (response.ok) {
        setAdmins(data.users || [])
      }
    } catch (err) {
      console.error('Error fetching admins:', err)
    }
  }

  const fetchDeliveryPartners = async () => {
    try {
      const response = await fetch('/api/users?role=delivery_partner')
      const data = await response.json()
      if (response.ok) {
        setDeliveryPartners(data.users || [])
      }
    } catch (err) {
      console.error('Error fetching delivery partners:', err)
    }
  }

  const fetchDarkStores = async () => {
    try {
      setLoadingStores(true)
      setError('')
      const response = await fetch('/api/dark-stores')
      const data = await response.json()
      if (response.ok) {
        setDarkStores(data.darkStores || [])
      } else {
        console.error('Error fetching dark stores:', data)
        setError(data.error || 'Failed to fetch dark stores')
      }
    } catch (err: any) {
      console.error('Error fetching dark stores:', err)
      setError(err.message || 'Failed to fetch dark stores')
    } finally {
      setLoadingStores(false)
    }
  }

  const handleAddStore = () => {
    setEditingStore(null)
    setOwnerUser(null)
    setOwnerUserSearch('')
    setFormData({
      name: '',
      address: '',
      pincode: '',
      latitude: '',
      longitude: '',
      phone: '',
      email: '',
      ownerName: '',
      ownerPhone: '',
      ownerEmail: '',
      ownerAddress: '',
      paymentModel: 'per_jar',
      rentAmountCents: '',
      perJarRateCents: '5',
      ownerSelfDelivery: false,
      managerId: '',
      deliveryRadiusKm: '3',
      isActive: true,
      notes: '',
      ownerUserId: '',
    })
    setError('')
    setSuccess('')
    setShowDialog(true)
  }

  const handleEditStore = async (store: DarkStore) => {
    setEditingStore(store)
    
    // Fetch owner user details if ownerUserId exists
    let ownerUserData = null
    if (store.ownerUserId) {
      try {
        const response = await fetch(`/api/users/${store.ownerUserId}`)
        const data = await response.json()
        if (response.ok && data.id) {
          // API returns user data directly, not wrapped in 'user' property
          ownerUserData = {
            id: data.id,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
          }
          setOwnerUser(ownerUserData)
          // Set the search field to show the linked owner
          setOwnerUserSearch(`${ownerUserData.name} (${ownerUserData.phone || ownerUserData.email})`)
        } else {
          console.error('Failed to fetch owner user:', data)
          setOwnerUser(null)
          setOwnerUserSearch('')
        }
      } catch (err) {
        console.error('Error fetching owner user:', err)
        setOwnerUser(null)
        setOwnerUserSearch('')
      }
    } else {
      setOwnerUser(null)
      setOwnerUserSearch('')
    }
    
    setFormData({
      name: store.name,
      address: store.address,
      pincode: store.pincode || '',
      latitude: store.latitude?.toString() || '',
      longitude: store.longitude?.toString() || '',
      phone: store.phone || '',
      email: store.email || '',
      ownerName: store.ownerName,
      ownerPhone: store.ownerPhone,
      ownerEmail: store.ownerEmail || '',
      ownerAddress: store.ownerAddress || '',
      ownerUserId: store.ownerUserId || '',
      paymentModel: store.paymentModel,
      rentAmountCents: store.rentAmountCents ? (Number(store.rentAmountCents) / 100).toString() : '',
      perJarRateCents: (Number(store.perJarRateCents) / 100).toString(),
      ownerSelfDelivery: store.ownerSelfDelivery,
      managerId: store.managerId || '',
      deliveryRadiusKm: store.deliveryRadiusKm.toString(),
      isActive: store.isActive,
      notes: store.notes || '',
    })
    setError('')
    setSuccess('')
    setShowDialog(true)
  }

  const handleSaveStore = async () => {
    if (saving) return // Prevent multiple clicks
    
    if (!formData.name || !formData.address || !formData.pincode || !formData.ownerName || !formData.ownerPhone) {
      setError('Please fill in all required fields')
      return
    }

    if (!/^\d{6}$/.test(formData.pincode)) {
      setError('Pincode must be exactly 6 digits')
      return
    }

    // Validate owner phone number (10 digits only)
    const ownerPhoneDigits = formData.ownerPhone.replace(/\D/g, '')
    if (ownerPhoneDigits.length !== 10) {
      setError('Owner phone number must be exactly 10 digits')
      return
    }

    // Validate store phone number if provided (10 digits only)
    if (formData.phone) {
      const storePhoneDigits = formData.phone.replace(/\D/g, '')
      if (storePhoneDigits.length !== 10) {
        setError('Store phone number must be exactly 10 digits')
        return
      }
    }

    if (formData.paymentModel === 'rent' && !formData.rentAmountCents) {
      setError('Rent amount is required when payment model is rent')
      return
    }

    try {
      setError('')
      setSuccess('')
      setSaving(true)

      // Use ownerUser.id if available, otherwise use formData.ownerUserId
      const finalOwnerUserId = ownerUser?.id || formData.ownerUserId || null

      const payload = {
        name: formData.name,
        address: formData.address,
        pincode: formData.pincode,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        phone: formData.phone ? formData.phone.replace(/\D/g, '') : null,
        email: formData.email || null,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone.replace(/\D/g, ''),
        ownerEmail: formData.ownerEmail || null,
        ownerAddress: formData.ownerAddress || null,
        ownerUserId: finalOwnerUserId,
        paymentModel: formData.paymentModel,
        rentAmountCents: formData.paymentModel === 'rent' && formData.rentAmountCents 
          ? Math.round(parseFloat(formData.rentAmountCents) * 100) 
          : null,
        perJarRateCents: Math.round(parseFloat(formData.perJarRateCents) * 100),
        ownerSelfDelivery: formData.ownerSelfDelivery,
        managerId: formData.managerId || null,
        deliveryRadiusKm: parseFloat(formData.deliveryRadiusKm),
        isActive: formData.isActive,
        notes: formData.notes || null,
        createdBy: user?.id,
      }

      const url = editingStore
        ? `/api/dark-stores/${editingStore.id}`
        : '/api/dark-stores'
      const method = editingStore ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save dark store')
        setSaving(false)
        return
      }

      setSuccess(editingStore ? 'Dark store updated successfully' : 'Dark store created successfully')
      setShowDialog(false)
      setEditingStore(null)
      setOwnerUser(null)
      setOwnerUserSearch('')
      fetchDarkStores()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error saving dark store:', err)
      setError(err.message || 'Failed to save dark store')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStore = async () => {
    if (!deleteDialog.storeId) return

    try {
      const response = await fetch(`/api/dark-stores/${deleteDialog.storeId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to delete dark store')
        return
      }

      setSuccess('Dark store deleted successfully')
      setDeleteDialog({ open: false, storeId: null })
      fetchDarkStores()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to delete dark store')
    }
  }

  const filteredStores = darkStores.filter((store) => {
    const query = searchQuery.toLowerCase()
    return (
      store.name.toLowerCase().includes(query) ||
      store.address.toLowerCase().includes(query) ||
      store.ownerName.toLowerCase().includes(query) ||
      store.ownerPhone.includes(query)
    )
  })

  const lowStockCount = darkStores.filter((store) => store.isLowStock).length

  if (loading || loadingStores) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Dark Stores' }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dark Stores</h1>
          <p className="text-muted-foreground mt-1">Manage dark store locations and inventory</p>
        </div>
        <Button onClick={handleAddStore}>
          <Plus className="w-4 h-4 mr-2" />
          Add Dark Store
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>{lowStockCount}</strong> dark store{lowStockCount > 1 ? 's' : ''} {lowStockCount > 1 ? 'have' : 'has'} low stock
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search dark stores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStores.length === 0 ? (
            <div className="text-center py-12">
              <Warehouse className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No dark stores found matching your search' : 'No dark stores added yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStores.map((store) => (
                <Card key={store.id} className={store.isLowStock ? 'border-yellow-300 bg-yellow-50' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{store.name}</CardTitle>
                        <CardDescription className="mt-1">{store.address}</CardDescription>
                      </div>
                      {store.isLowStock && (
                        <Badge variant="destructive" className="ml-2">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          Low Stock
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Owner:</span>
                        <span className="font-medium">{store.ownerName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{store.ownerPhone}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Payment Model:</span>
                        <Badge variant="outline">
                          {store.paymentModel === 'rent' ? 'Rent' : 'Per Jar'}
                        </Badge>
                      </div>
                      {store.ownerSelfDelivery && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs">Owner Self-Delivery</span>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        {store.products && store.products.length > 0 ? (
                          <>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-muted-foreground">Total Stock:</span>
                              <span className="font-semibold">
                                {store.totalCurrentStock || 0} / {store.totalMaxCapacity || 0}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  store.isLowStock
                                    ? 'bg-yellow-500'
                                    : store.stockPercentage && store.stockPercentage > 80
                                    ? 'bg-green-500'
                                    : 'bg-blue-500'
                                }`}
                                style={{ width: `${store.stockPercentage || 0}%` }}
                              />
                            </div>
                            <div className="text-xs text-muted-foreground mt-2 space-y-1">
                              {store.products.map((p) => (
                                <div key={p.id} className="flex justify-between">
                                  <span>{p.product.title}:</span>
                                  <span className={p.isLowStock ? 'text-yellow-600 font-medium' : ''}>
                                    {p.currentStock}/{p.maxStockCapacity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-xs text-muted-foreground">No products added yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Add products in Manage page</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-muted-foreground">Status:</span>
                        {store.isActive ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/admin/dark-stores/${store.id}`)}
                        >
                          <Package className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStore(store)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setDeleteDialog({ open: true, storeId: store.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStore ? 'Edit Dark Store' : 'Add New Dark Store'}
            </DialogTitle>
            <DialogDescription>
              {editingStore ? 'Update dark store information' : 'Create a new dark store location'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Store Name *</Label>
                <Input
                  id="name"
                  placeholder="Laxmi Nagar Dark Store"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="isActive">Status</Label>
                <select
                  id="isActive"
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                placeholder="Full address of the dark store"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                placeholder="110092"
                value={formData.pincode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setFormData({ ...formData, pincode: value })
                }}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">6-digit pincode where the dark store is located</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="28.6139"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="77.2090"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Store Phone</Label>
                <Input
                  id="phone"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setFormData({ ...formData, phone: value })
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">10 digits only (numbers only)</p>
              </div>
              <div>
                <Label htmlFor="email">Store Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="store@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Owner Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ownerName">Owner Name *</Label>
                  <Input
                    id="ownerName"
                    placeholder="John Doe"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ownerPhone">Owner Phone *</Label>
                  <Input
                    id="ownerPhone"
                    placeholder="9876543210"
                    value={formData.ownerPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setFormData({ ...formData, ownerPhone: value })
                    }}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">10 digits only (numbers only)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="ownerEmail">Owner Email</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    placeholder="owner@example.com"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ownerAddress">Owner Address</Label>
                  <Input
                    id="ownerAddress"
                    placeholder="Owner's address"
                    value={formData.ownerAddress}
                    onChange={(e) => setFormData({ ...formData, ownerAddress: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Payment & Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentModel">Payment Model *</Label>
                  <select
                    id="paymentModel"
                    value={formData.paymentModel}
                    onChange={(e) => setFormData({ ...formData, paymentModel: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="per_jar">Per Jar (₹5 per jar)</option>
                    <option value="rent">Monthly Rent</option>
                  </select>
                </div>
                {formData.paymentModel === 'rent' ? (
                  <div>
                    <Label htmlFor="rentAmountCents">Monthly Rent (₹) *</Label>
                    <Input
                      id="rentAmountCents"
                      type="number"
                      placeholder="50000"
                      value={formData.rentAmountCents}
                      onChange={(e) => setFormData({ ...formData, rentAmountCents: e.target.value })}
                      required={formData.paymentModel === 'rent'}
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="perJarRateCents">Per Jar Rate (₹) *</Label>
                    <Input
                      id="perJarRateCents"
                      type="number"
                      step="0.01"
                      placeholder="5.00"
                      value={formData.perJarRateCents}
                      onChange={(e) => setFormData({ ...formData, perJarRateCents: e.target.value })}
                      required
                    />
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.ownerSelfDelivery}
                    onChange={(e) => {
                      setFormData({ ...formData, ownerSelfDelivery: e.target.checked })
                      if (!e.target.checked) {
                        setOwnerUser(null)
                        setFormData(prev => ({ ...prev, ownerUserId: '' }))
                      }
                    }}
                    className="rounded"
                  />
                  <span>Owner can self-deliver (will receive extra commission)</span>
                </label>
                
                {formData.ownerSelfDelivery && (
                  <div className="border border-blue-200 bg-blue-50 rounded-md p-4">
                    <p className="text-sm text-blue-800 mb-3">
                      <strong>How it works:</strong> When owner self-delivery is enabled, the owner must be registered as a delivery partner. 
                      Orders will be automatically assigned to the owner, and they will receive:
                    </p>
                    <ul className="text-sm text-blue-800 list-disc list-inside space-y-1 mb-3">
                      <li>Regular delivery commission (₹10 per 20L jar)</li>
                      <li>Extra commission for self-delivery (₹10 per jar, configurable)</li>
                      <li>Per jar rate (₹5 per jar, if payment model is "per jar")</li>
                      <li><strong>Total: ₹25 per 20L jar delivered</strong></li>
                    </ul>
                    <div className="relative">
                      <Label htmlFor="ownerUserId">Link Owner to Delivery Partner Account</Label>
                      <div className="relative">
                        <Input
                          id="ownerUserId"
                          placeholder="Search by name, phone, or email..."
                          value={ownerUser ? `${ownerUser.name} (${ownerUser.phone || ownerUser.email})` : ownerUserSearch}
                          onChange={(e) => {
                            const newValue = e.target.value
                            setOwnerUserSearch(newValue)
                            setShowOwnerUserDropdown(true)
                            // If user clears the input or changes it, clear the linked owner
                            if (!newValue) {
                              setOwnerUser(null)
                              setFormData(prev => ({ ...prev, ownerUserId: '' }))
                            } else if (ownerUser && !newValue.includes(ownerUser.name)) {
                              // If user is typing something different from the linked owner, clear it
                              setOwnerUser(null)
                              setFormData(prev => ({ ...prev, ownerUserId: '' }))
                            }
                          }}
                          onFocus={() => {
                            // When focusing, if owner is linked, show their info
                            if (ownerUser) {
                              setOwnerUserSearch(`${ownerUser.name} (${ownerUser.phone || ownerUser.email})`)
                            }
                            setShowOwnerUserDropdown(true)
                          }}
                          className="w-full"
                        />
                        {showOwnerUserDropdown && ownerUserSearch && (
                          <div ref={ownerUserDropdownRef} className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {deliveryPartners
                              .filter(dp => 
                                dp.name?.toLowerCase().includes(ownerUserSearch.toLowerCase()) ||
                                dp.phone?.includes(ownerUserSearch) ||
                                dp.email?.toLowerCase().includes(ownerUserSearch.toLowerCase())
                              )
                              .slice(0, 10)
                              .map((dp) => (
                                <div
                                  key={dp.id}
                                  className="p-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => {
                                    setOwnerUser(dp)
                                    setFormData(prev => ({ ...prev, ownerUserId: dp.id }))
                                    setOwnerUserSearch('')
                                    setShowOwnerUserDropdown(false)
                                  }}
                                >
                                  <div className="font-medium">{dp.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {dp.phone} {dp.email ? `| ${dp.email}` : ''}
                                  </div>
                                </div>
                              ))}
                            {deliveryPartners.filter(dp => 
                              dp.name?.toLowerCase().includes(ownerUserSearch.toLowerCase()) ||
                              dp.phone?.includes(ownerUserSearch) ||
                              dp.email?.toLowerCase().includes(ownerUserSearch.toLowerCase())
                            ).length === 0 && (
                              <div className="p-2 text-sm text-muted-foreground">
                                No delivery partner found. The owner needs to be registered as a delivery partner first.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {ownerUser && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-800">
                            <strong>Linked:</strong> {ownerUser.name} ({ownerUser.phone || ownerUser.email})
                          </p>
                        </div>
                      )}
                      {!ownerUser && formData.ownerSelfDelivery && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Search and select the owner's delivery partner account. If not found, create a delivery partner account first with the owner's phone/email.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="deliveryRadiusKm">Delivery Radius (km) *</Label>
                  <Input
                    id="deliveryRadiusKm"
                    type="number"
                    step="0.1"
                    placeholder="3.0"
                    value={formData.deliveryRadiusKm}
                    onChange={(e) => setFormData({ ...formData, deliveryRadiusKm: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Management</h3>
              <div>
                <Label htmlFor="managerId">Manager (Admin/Super Admin)</Label>
                <select
                  id="managerId"
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select a manager</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.name} ({admin.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this dark store"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStore} disabled={saving}>
              {saving ? 'Saving...' : editingStore ? 'Update' : 'Create'} Dark Store
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, storeId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dark Store</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this dark store? This action cannot be undone.
              Dark stores with existing orders or pincodes cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStore} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

