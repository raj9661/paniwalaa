'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { Droplet, Tag, Plus, Edit, Trash2, Search, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import Link from 'next/link'

interface PromoCode {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: number | string  // Can be number or string (from BigInt)
  minOrderAmountCents: number | string | null  // Can be number or string (from BigInt)
  maxDiscountCents: number | string | null  // Can be number or string (from BigInt)
  maxUses: number | null
  usedCount: number
  maxUsesPerUser: number | null
  validFrom: string
  validUntil: string
  isActive: boolean
  applicableRoles: string | null
}

export default function PromoCodesPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loadingCodes, setLoadingCodes] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null })
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmountCents: '',
    maxDiscountCents: '',
    maxUses: '',
    maxUsesPerUser: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
    applicableRoles: '',
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== 'super_admin')) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchPromoCodes()
    }
  }, [user])

  const fetchPromoCodes = async () => {
    try {
      setLoadingCodes(true)
      const response = await fetch('/api/promo-codes?limit=100')
      const data = await response.json()
      setPromoCodes(data.promoCodes || [])
    } catch (error) {
      console.error('Error fetching promo codes:', error)
    } finally {
      setLoadingCodes(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingCode ? `/api/promo-codes/${editingCode.id}` : '/api/promo-codes'
      const method = editingCode ? 'PUT' : 'POST'

      // Convert discount value to cents for fixed discounts, keep as-is for percentage
      const discountValue = formData.discountType === 'fixed'
        ? parseFloat(formData.discountValue) * 100  // Convert ₹5 to 500 paise
        : parseFloat(formData.discountValue)        // Keep percentage as-is (e.g., 20 for 20%)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          discountValue: discountValue,
          minOrderAmountCents: formData.minOrderAmountCents ? parseFloat(formData.minOrderAmountCents) * 100 : null,
          maxDiscountCents: formData.maxDiscountCents ? parseFloat(formData.maxDiscountCents) * 100 : null,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          maxUsesPerUser: formData.maxUsesPerUser ? parseInt(formData.maxUsesPerUser) : null,
          createdBy: user?.id,
        }),
      })

      if (response.ok) {
        alert(editingCode ? 'Promo code updated successfully' : 'Promo code created successfully')
        setDialogOpen(false)
        resetForm()
        fetchPromoCodes()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save promo code')
      }
    } catch (error) {
      console.error('Error saving promo code:', error)
      alert('Failed to save promo code')
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.id) return

    try {
      const response = await fetch(`/api/promo-codes/${deleteDialog.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Promo code deleted successfully')
        setDeleteDialog({ open: false, id: null })
        fetchPromoCodes()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete promo code')
      }
    } catch (error) {
      console.error('Error deleting promo code:', error)
      alert('Failed to delete promo code')
    }
  }

  const openEditDialog = (code: PromoCode) => {
    setEditingCode(code)
    // Convert discount value from cents to rupees for fixed discounts, keep as-is for percentage
    const discountValue = code.discountType === 'fixed'
      ? (Number(code.discountValue) / 100).toString()  // Convert 500 paise to ₹5
      : code.discountValue.toString()          // Keep percentage as-is (e.g., 20 for 20%)
    
    setFormData({
      code: code.code,
      description: code.description || '',
      discountType: code.discountType,
      discountValue: discountValue,
      minOrderAmountCents: code.minOrderAmountCents ? (code.minOrderAmountCents / 100).toString() : '',
      maxDiscountCents: code.maxDiscountCents ? (code.maxDiscountCents / 100).toString() : '',
      maxUses: code.maxUses?.toString() || '',
      maxUsesPerUser: code.maxUsesPerUser?.toString() || '',
      validFrom: new Date(code.validFrom).toISOString().slice(0, 16),
      validUntil: new Date(code.validUntil).toISOString().slice(0, 16),
      isActive: code.isActive,
      applicableRoles: code.applicableRoles || '',
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderAmountCents: '',
      maxDiscountCents: '',
      maxUses: '',
      maxUsesPerUser: '',
      validFrom: '',
      validUntil: '',
      isActive: true,
      applicableRoles: '',
    })
    setEditingCode(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  const filteredCodes = promoCodes.filter((code) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return code.code.toLowerCase().includes(query) || 
           code.description?.toLowerCase().includes(query)
  })

  if (loading || loadingCodes) {
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
                <h1 className="text-2xl font-bold text-foreground">Promo Codes</h1>
                <p className="text-xs text-muted-foreground">Manage discount codes and offers</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  resetForm()
                  setDialogOpen(true)
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Promo Code
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
        <Breadcrumb items={[{ label: 'Promo Codes' }]} className="mb-6" />
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search promo codes..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Promo Codes List */}
        {filteredCodes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No promo codes found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCodes.map((code) => (
              <Card key={code.id} className={!code.isActive || isExpired(code.validUntil) ? 'opacity-60' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{code.code}</h3>
                        {code.isActive ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                        {isExpired(code.validUntil) && (
                          <Badge variant="secondary" className="bg-red-100 text-red-700">
                            Expired
                          </Badge>
                        )}
                      </div>
                      {code.description && (
                        <p className="text-sm text-muted-foreground mb-3">{code.description}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Discount</p>
                          <p className="font-semibold">
                            {code.discountType === 'percentage' 
                              ? `${code.discountValue}%`
                              : `₹${Number(code.discountValue) / 100}`
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Min Order</p>
                          <p className="font-semibold">
                            {code.minOrderAmountCents ? `₹${Number(code.minOrderAmountCents) / 100}` : 'No minimum'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Usage</p>
                          <p className="font-semibold">
                            {code.usedCount} / {code.maxUses || '∞'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Valid Until</p>
                          <p className="font-semibold">{formatDate(code.validUntil)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(code)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => setDeleteDialog({ open: true, id: code.id })}
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
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCode ? 'Edit Promo Code' : 'Create Promo Code'}</DialogTitle>
            <DialogDescription>
              {editingCode ? 'Update promo code details' : 'Create a new discount promo code'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Promo Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                  required
                  disabled={!!editingCode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type *</Label>
                <select
                  id="discountType"
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter promo code description..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  Discount Value * ({formData.discountType === 'percentage' ? '%' : '₹'})
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                  required
                  min={formData.discountType === 'percentage' ? 1 : 0}
                  max={formData.discountType === 'percentage' ? 100 : undefined}
                />
              </div>
              {formData.discountType === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="maxDiscountCents">Max Discount (₹)</Label>
                  <Input
                    id="maxDiscountCents"
                    type="number"
                    value={formData.maxDiscountCents}
                    onChange={(e) => setFormData({ ...formData, maxDiscountCents: e.target.value })}
                    placeholder="500"
                    min="0"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minOrderAmountCents">Minimum Order Amount (₹)</Label>
                <Input
                  id="minOrderAmountCents"
                  type="number"
                  value={formData.minOrderAmountCents}
                  onChange={(e) => setFormData({ ...formData, minOrderAmountCents: e.target.value })}
                  placeholder="1000"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUses">Maximum Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  placeholder="100"
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUsesPerUser">Max Uses Per User</Label>
                <Input
                  id="maxUsesPerUser"
                  type="number"
                  value={formData.maxUsesPerUser}
                  onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                  placeholder="1"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicableRoles">Applicable Roles</Label>
                <Input
                  id="applicableRoles"
                  value={formData.applicableRoles}
                  onChange={(e) => setFormData({ ...formData, applicableRoles: e.target.value })}
                  placeholder="customer, delivery_partner"
                />
                <p className="text-xs text-muted-foreground">Comma-separated: customer, delivery_partner</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From *</Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Valid Until *</Label>
                <Input
                  id="validUntil"
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setDialogOpen(false)
                resetForm()
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCode ? 'Update' : 'Create'} Promo Code
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, id: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the promo code.
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

