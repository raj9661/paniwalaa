'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Droplet, Plus, Edit, Trash2, Package, IndianRupee } from 'lucide-react'
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
import { ImageUpload } from '@/components/image-upload'
import { useAuth } from '@/lib/auth-context'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import Link from 'next/link'

interface Product {
  id: string
  title: string
  description: string | null
  productType: string
  imageUrl: string | null
  priceCents: string
  securityDepositCents: string | null
  isAvailable: boolean
  isOneTimePurchase: boolean
  volumeMl: number | null
  brand: string | null
  createdAt: string
}

export default function AdminProductsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: string | null }>({
    open: false,
    productId: null,
  })
  const [editDialog, setEditDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  })
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    productType: '20L_jar',
    imageUrl: '',
    priceCents: '',
    securityDepositCents: '',
    isAvailable: true,
    isOneTimePurchase: false,
    volumeMl: '',
    brand: '',
  })

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchProducts()
    }
  }, [user])

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const response = await fetch('/api/products?limit=100')
      if (!response.ok) {
        const error = await response.json()
        console.error('Error fetching products:', error)
        alert(error.error || 'Failed to fetch products')
        return
      }
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      alert('Failed to fetch products. Please try again.')
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editDialog.product ? `/api/products/${editDialog.product.id}` : '/api/products'
      const method = editDialog.product ? 'PUT' : 'POST'

      // Convert price to cents (paise)
      const priceCents = Math.round(parseFloat(formData.priceCents) * 100)
      const securityDepositCents = formData.securityDepositCents
        ? Math.round(parseFloat(formData.securityDepositCents) * 100)
        : null

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          priceCents,
          securityDepositCents: formData.isOneTimePurchase ? null : securityDepositCents,
          volumeMl: formData.volumeMl ? parseInt(formData.volumeMl) : null,
        }),
      })

      if (response.ok) {
        setEditDialog({ open: false, product: null })
        fetchProducts()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save product')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Failed to save product')
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.productId) return

    try {
      const response = await fetch(`/api/products/${deleteDialog.productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== deleteDialog.productId))
        setDeleteDialog({ open: false, productId: null })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  const openEditDialog = (product: Product | null) => {
    if (product) {
      setFormData({
        title: product.title,
        description: product.description || '',
        productType: product.productType,
        imageUrl: product.imageUrl || '',
        priceCents: (parseInt(product.priceCents) / 100).toString(),
        securityDepositCents: product.securityDepositCents
          ? (parseInt(product.securityDepositCents) / 100).toString()
          : '',
        isAvailable: product.isAvailable,
        isOneTimePurchase: product.isOneTimePurchase || false,
        volumeMl: product.volumeMl?.toString() || '',
        brand: product.brand || '',
      })
    }
    setEditDialog({ open: true, product })
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      productType: '20L_jar',
      imageUrl: '',
      priceCents: '',
      securityDepositCents: '',
      isAvailable: true,
      isOneTimePurchase: false,
      volumeMl: '',
      brand: '',
    })
  }

  const getProductTypeLabel = (type: string) => {
    const labels = {
      '20L_jar': '20L Jar',
      '10L_jar': '10L Jar',
      'water_dispenser': 'Water Dispenser',
    }
    return labels[type as keyof typeof labels] || type
  }

  const getProductTypeBadge = (type: string) => {
    const variants = {
      '20L_jar': 'bg-blue-100 text-blue-700 border-blue-200',
      '10L_jar': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'water_dispenser': 'bg-purple-100 text-purple-700 border-purple-200',
    }
    return (
      <Badge variant="secondary" className={variants[type as keyof typeof variants] || ''}>
        {getProductTypeLabel(type)}
      </Badge>
    )
  }

  if (loading || loadingProducts) {
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
                <h1 className="text-2xl font-bold text-foreground">Product Management</h1>
                <p className="text-xs text-muted-foreground">Manage products and inventory</p>
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
        <Breadcrumb items={[{ label: 'Products' }]} className="mb-6" />
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Products</h2>
          <Button
            onClick={() => {
              resetForm()
              openEditDialog(null)
            }}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 gap-2"
          >
            <Plus className="w-4 h-4" />
            New Product
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No products created yet</p>
                <Button
                  onClick={() => {
                    resetForm()
                    openEditDialog(null)
                  }}
                  className="mt-4"
                  variant="outline"
                >
                  Create your first product
                </Button>
              </CardContent>
            </Card>
          ) : (
            products.map((product) => (
              <Card key={product.id} className="border-2 overflow-hidden">
                {product.imageUrl && (
                  <div className="aspect-square bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{product.title}</h3>
                      {product.brand && (
                        <p className="text-sm text-muted-foreground">{product.brand}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {getProductTypeBadge(product.productType)}
                    {product.isAvailable ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">Available</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">Unavailable</Badge>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                  )}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price:</span>
                      <span className="font-bold text-lg">
                        ₹{parseInt(product.priceCents) / 100}
                      </span>
                    </div>
                    {product.securityDepositCents && !product.isOneTimePurchase && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Security Deposit:</span>
                        <span className="font-semibold text-foreground">
                          ₹{parseInt(product.securityDepositCents) / 100}
                        </span>
                      </div>
                    )}
                    {product.isOneTimePurchase && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Purchase Type:</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          One-time Purchase
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(product)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => setDeleteDialog({ open: true, productId: product.id })}
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

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, product: null })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDialog.product ? 'Edit Product' : 'Create New Product'}</DialogTitle>
            <DialogDescription>Add product details and pricing</DialogDescription>
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productType">Product Type *</Label>
                <select
                  id="productType"
                  value={formData.productType}
                  onChange={(e) => {
                    const newType = e.target.value
                    setFormData({
                      ...formData,
                      productType: newType,
                      volumeMl: newType === '20L_jar' ? '20000' : newType === '10L_jar' ? '10000' : '',
                    })
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="20L_jar">20L Jar</option>
                  <option value="10L_jar">10L Jar</option>
                  <option value="water_dispenser">Water Dispenser</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g., Bisleri, Aquafina"
                />
              </div>
            </div>

            <ImageUpload
              label="Product Image"
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceCents">Price (₹) *</Label>
                <Input
                  id="priceCents"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.priceCents}
                  onChange={(e) => setFormData({ ...formData, priceCents: e.target.value })}
                  placeholder="60.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="securityDepositCents">Security Deposit (₹)</Label>
                <Input
                  id="securityDepositCents"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.securityDepositCents}
                  onChange={(e) => setFormData({ ...formData, securityDepositCents: e.target.value })}
                  placeholder="500.00"
                  disabled={formData.isOneTimePurchase}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.isOneTimePurchase 
                    ? 'Not required for one-time purchase products' 
                    : 'Required for jars and dispensers (unless one-time purchase)'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                <input
                  type="checkbox"
                  checked={formData.isOneTimePurchase}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      isOneTimePurchase: e.target.checked,
                      securityDepositCents: e.target.checked ? '' : formData.securityDepositCents
                    })
                  }}
                  className="mr-2"
                />
                One-time Purchase (No security deposit required)
              </Label>
              <p className="text-xs text-muted-foreground">
                Check this if the product is sold permanently and doesn't require a security deposit
              </p>
            </div>

            {formData.productType !== 'water_dispenser' && (
              <div className="space-y-2">
                <Label htmlFor="volumeMl">Volume (ml)</Label>
                <Input
                  id="volumeMl"
                  type="number"
                  value={formData.volumeMl}
                  onChange={(e) => setFormData({ ...formData, volumeMl: e.target.value })}
                  placeholder="20000"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="mr-2"
                />
                Available for purchase
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialog({ open: false, product: null })}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-500">
                {editDialog.product ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, productId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product.
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

