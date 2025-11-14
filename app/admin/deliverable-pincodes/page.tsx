'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Plus, Edit, Trash2, CheckCircle2, XCircle, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

type DeliverablePincode = {
  id: string
  pincode: string
  areaName?: string
  city?: string
  state?: string
  isActive: boolean
  deliveryChargeCents?: number
  estimatedDeliveryMinutes?: number
  notes?: string
  darkStoreId?: string
  darkStore?: {
    id: string
    name: string
    address: string
  }
  createdAt: string
}

export default function DeliverablePincodesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [pincodes, setPincodes] = useState<DeliverablePincode[]>([])
  const [loadingPincodes, setLoadingPincodes] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingPincode, setEditingPincode] = useState<DeliverablePincode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [darkStores, setDarkStores] = useState<Array<{ id: string; name: string; address: string }>>([])
  const [fieldErrors, setFieldErrors] = useState<{
    pincode?: string
    darkStoreId?: string
  }>({})
  const [formData, setFormData] = useState({
    pincode: '',
    areaName: '',
    city: '',
    state: '',
    isActive: true,
    deliveryChargeCents: '',
    estimatedDeliveryMinutes: '',
    notes: '',
    darkStoreId: '',
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== 'super_admin')) {
      router.push('/admin')
      return
    }
    if (user?.role === 'super_admin') {
      fetchPincodes()
      fetchDarkStores()
    }
  }, [user, loading, router])

  const fetchDarkStores = async () => {
    try {
      const response = await fetch('/api/dark-stores?activeOnly=true')
      const data = await response.json()
      if (response.ok) {
        setDarkStores(data.darkStores || [])
      }
    } catch (err) {
      console.error('Error fetching dark stores:', err)
    }
  }

  const fetchPincodes = async () => {
    try {
      setLoadingPincodes(true)
      const response = await fetch('/api/deliverable-pincodes')
      const data = await response.json()
      if (response.ok) {
        setPincodes(data.pincodes || [])
      } else {
        setError(data.error || 'Failed to fetch deliverable pincodes')
      }
    } catch (err) {
      setError('Failed to fetch deliverable pincodes')
    } finally {
      setLoadingPincodes(false)
    }
  }

  const handleAddPincode = () => {
    setEditingPincode(null)
    setFormData({
      pincode: '',
      areaName: '',
      city: '',
      state: '',
      isActive: true,
      deliveryChargeCents: '',
      estimatedDeliveryMinutes: '',
      notes: '',
      darkStoreId: '',
    })
    setError('')
    setSuccess('')
    setFieldErrors({})
    setShowDialog(true)
  }

  const handleEditPincode = (pincode: DeliverablePincode) => {
    setEditingPincode(pincode)
    setFormData({
      pincode: pincode.pincode,
      areaName: pincode.areaName || '',
      city: pincode.city || '',
      state: pincode.state || '',
      isActive: pincode.isActive,
      darkStoreId: pincode.darkStoreId || '',
      deliveryChargeCents: pincode.deliveryChargeCents ? (pincode.deliveryChargeCents / 100).toString() : '',
      estimatedDeliveryMinutes: pincode.estimatedDeliveryMinutes?.toString() || '',
      notes: pincode.notes || '',
    })
    setError('')
    setSuccess('')
    setFieldErrors({})
    setShowDialog(true)
  }

  const validateField = (field: 'pincode' | 'darkStoreId', value: string) => {
    const errors = { ...fieldErrors }
    
    if (field === 'pincode') {
      if (!value) {
        errors.pincode = 'Pincode is required'
      } else if (!/^\d{6}$/.test(value)) {
        errors.pincode = 'Pincode must be exactly 6 digits'
      } else {
        delete errors.pincode
      }
    }
    
    if (field === 'darkStoreId') {
      if (!value) {
        errors.darkStoreId = 'Dark store is required'
      } else {
        delete errors.darkStoreId
      }
    }
    
    setFieldErrors(errors)
  }

  const isFormValid = () => {
    return (
      formData.pincode.length === 6 &&
      /^\d{6}$/.test(formData.pincode) &&
      !!formData.darkStoreId &&
      Object.keys(fieldErrors).length === 0
    )
  }

  const handleSavePincode = async () => {
    // Validate all fields
    validateField('pincode', formData.pincode)
    validateField('darkStoreId', formData.darkStoreId)
    
    if (!isFormValid()) {
      setError('Please fix the errors in the form')
      return
    }

    try {
      setError('')
      setSuccess('')

      const payload = {
        pincode: formData.pincode,
        areaName: formData.areaName || null,
        city: formData.city || null,
        state: formData.state || null,
        isActive: formData.isActive,
        deliveryChargeCents: formData.deliveryChargeCents ? Math.round(parseFloat(formData.deliveryChargeCents) * 100) : null,
        estimatedDeliveryMinutes: formData.estimatedDeliveryMinutes ? parseInt(formData.estimatedDeliveryMinutes) : null,
        notes: formData.notes || null,
        darkStoreId: formData.darkStoreId || null,
        createdBy: user?.id,
      }

      const url = editingPincode
        ? `/api/deliverable-pincodes/${editingPincode.id}`
        : '/api/deliverable-pincodes'
      const method = editingPincode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save deliverable pincode')
        return
      }

      setSuccess(editingPincode ? 'Pincode updated successfully' : 'Pincode added successfully')
      setShowDialog(false)
      fetchPincodes()
    } catch (err) {
      setError('Failed to save deliverable pincode')
    }
  }

  const handleDeletePincode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deliverable pincode?')) {
      return
    }

    try {
      const response = await fetch(`/api/deliverable-pincodes/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to delete deliverable pincode')
        return
      }

      setSuccess('Pincode deleted successfully')
      fetchPincodes()
    } catch (err) {
      setError('Failed to delete deliverable pincode')
    }
  }

  const filteredPincodes = pincodes.filter((pc) =>
    pc.pincode.includes(searchQuery) ||
    pc.areaName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pc.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pc.state?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading || loadingPincodes) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumb items={[{ label: 'Deliverable Pincodes' }]} className="mb-6" />
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Deliverable Pincodes</h1>
            <p className="text-muted-foreground">Manage pincodes where delivery is available</p>
          </div>
          <Button
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 gap-2"
            onClick={handleAddPincode}
          >
            <Plus className="w-4 h-4" />
            Add Pincode
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by pincode, area, city, or state..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPincodes.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No pincodes found matching your search' : 'No deliverable pincodes added yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Pincode</th>
                      <th className="text-left p-3 font-semibold">Area</th>
                      <th className="text-left p-3 font-semibold">City</th>
                      <th className="text-left p-3 font-semibold">State</th>
                      <th className="text-left p-3 font-semibold">Dark Store</th>
                      <th className="text-left p-3 font-semibold">Delivery Charge</th>
                      <th className="text-left p-3 font-semibold">Est. Time</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPincodes.map((pc) => (
                      <tr key={pc.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono font-semibold">{pc.pincode}</td>
                        <td className="p-3">{pc.areaName || '-'}</td>
                        <td className="p-3">{pc.city || '-'}</td>
                        <td className="p-3">{pc.state || '-'}</td>
                        <td className="p-3">
                          {pc.darkStore ? (
                            <div>
                              <div className="font-medium">{pc.darkStore.name}</div>
                              <div className="text-xs text-muted-foreground">{pc.darkStore.address}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not assigned</span>
                          )}
                        </td>
                        <td className="p-3">
                          {pc.deliveryChargeCents
                            ? `₹${(pc.deliveryChargeCents / 100).toFixed(2)}`
                            : 'Standard'}
                        </td>
                        <td className="p-3">
                          {pc.estimatedDeliveryMinutes
                            ? `${pc.estimatedDeliveryMinutes} min`
                            : '-'}
                        </td>
                        <td className="p-3">
                          {pc.isActive ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600">
                              <XCircle className="w-4 h-4" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditPincode(pc)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => handleDeletePincode(pc.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPincode ? 'Edit Deliverable Pincode' : 'Add New Deliverable Pincode'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    placeholder="110092"
                    value={formData.pincode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setFormData({ ...formData, pincode: value })
                      if (fieldErrors.pincode) {
                        validateField('pincode', value)
                      }
                    }}
                    onBlur={() => validateField('pincode', formData.pincode)}
                    disabled={!!editingPincode}
                    required
                    className={fieldErrors.pincode ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                  />
                  {fieldErrors.pincode ? (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.pincode}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">6-digit pincode</p>
                  )}
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="areaName">Area Name</Label>
                  <Input
                    id="areaName"
                    placeholder="Laxmi Nagar"
                    value={formData.areaName}
                    onChange={(e) => setFormData({ ...formData, areaName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Delhi"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="Delhi"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="darkStoreId">Dark Store *</Label>
                <select
                  id="darkStoreId"
                  value={formData.darkStoreId}
                  onChange={(e) => {
                    setFormData({ ...formData, darkStoreId: e.target.value })
                    if (fieldErrors.darkStoreId) {
                      validateField('darkStoreId', e.target.value)
                    }
                  }}
                  onBlur={() => validateField('darkStoreId', formData.darkStoreId)}
                  className={`w-full h-10 px-3 rounded-md border bg-background ${
                    fieldErrors.darkStoreId 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : 'border-input'
                  }`}
                  required
                >
                  <option value="">Select a dark store</option>
                  {darkStores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} - {store.address}
                    </option>
                  ))}
                </select>
                {fieldErrors.darkStoreId ? (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.darkStoreId}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Select the dark store that will serve this pincode
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliveryChargeCents">Delivery Charge (₹)</Label>
                  <Input
                    id="deliveryChargeCents"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.deliveryChargeCents}
                    onChange={(e) => setFormData({ ...formData, deliveryChargeCents: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave empty for standard charge</p>
                </div>
                <div>
                  <Label htmlFor="estimatedDeliveryMinutes">Estimated Delivery (minutes)</Label>
                  <Input
                    id="estimatedDeliveryMinutes"
                    type="number"
                    placeholder="30"
                    value={formData.estimatedDeliveryMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedDeliveryMinutes: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  placeholder="Additional notes about this pincode..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSavePincode}
                  disabled={!isFormValid()}
                >
                  {editingPincode ? 'Update Pincode' : 'Add Pincode'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

