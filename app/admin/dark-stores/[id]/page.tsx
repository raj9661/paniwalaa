'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Warehouse, Package, AlertTriangle, TrendingDown, TrendingUp,
  Plus, Edit, ArrowLeft, Users, MapPin, History, CheckCircle2, XCircle
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

type DarkStore = {
  id: string
  name: string
  address: string
  currentInventory: number
  maxStockCapacity: number
  lowStockThreshold: number
  isLowStock?: boolean
  stockPercentage?: number
}

type InventoryTransaction = {
  id: string
  type: string
  quantity: number
  stockBefore: number
  stockAfter: number
  reason?: string
  productId?: string
  product?: {
    id: string
    title: string
    productType: string
  }
  createdAt: string
}

type DeliveryPartnerAssignment = {
  id: string
  deliveryPartnerId: string
  pincodes: string[]
  partner?: {
    id: string
    name: string
    email: string
    phone: string
  }
}

type LinkedPincode = {
  id: string
  pincode: string
  areaName?: string
  city?: string
  state?: string
  isActive: boolean
}

type DarkStoreProduct = {
  id: string
  productId: string
  currentStock: number
  maxStockCapacity: number
  lowStockThreshold: number
  isLowStock: boolean
  stockPercentage: number
  product: {
    id: string
    title: string
    productType: string
    imageUrl?: string
  }
}

export default function DarkStoreDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const storeId = params.id as string

  const [darkStore, setDarkStore] = useState<DarkStore | null>(null)
  const [loadingStore, setLoadingStore] = useState(true)
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartnerAssignment[]>([])
  const [linkedPincodes, setLinkedPincodes] = useState<LinkedPincode[]>([])
  const [darkStoreProducts, setDarkStoreProducts] = useState<DarkStoreProduct[]>([])
  const [showInventoryDialog, setShowInventoryDialog] = useState(false)
  const [showPartnerDialog, setShowPartnerDialog] = useState(false)
  const [showAddProductDialog, setShowAddProductDialog] = useState(false)
  const [selectedProductForStock, setSelectedProductForStock] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [products, setProducts] = useState<Array<{ id: string; title: string; productType: string }>>([])
  const [inventoryForm, setInventoryForm] = useState({
    type: 'stock_in',
    productId: '',
    quantity: '',
    reason: '',
  })
  const [productForm, setProductForm] = useState({
    productId: '',
    maxStockCapacity: '',
    lowStockThreshold: '',
    currentStock: '0',
  })
  const [availablePartners, setAvailablePartners] = useState<Array<{ id: string; name: string; email: string; phone: string }>>([])
  const [availablePincodes, setAvailablePincodes] = useState<Array<{ id: string; pincode: string; areaName?: string }>>([])
  const [partnerForm, setPartnerForm] = useState({
    deliveryPartnerId: '',
    pincodes: [] as string[],
  })

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/admin')
      return
    }
    if (user && storeId) {
      fetchDarkStore()
      fetchInventory()
      fetchDeliveryPartners()
      fetchAvailablePartners()
      fetchAvailablePincodes()
      fetchLinkedPincodes()
      fetchProducts()
      fetchDarkStoreProducts()
    }
  }, [user, loading, router, storeId])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100')
      const data = await response.json()
      if (response.ok) {
        setProducts(data.products || [])
      }
    } catch (err) {
      console.error('Error fetching products:', err)
    }
  }

  const fetchDarkStore = async () => {
    try {
      setLoadingStore(true)
      const response = await fetch(`/api/dark-stores/${storeId}`)
      const data = await response.json()
      if (response.ok) {
        setDarkStore(data)
      } else {
        setError(data.error || 'Failed to fetch dark store')
      }
    } catch (err) {
      setError('Failed to fetch dark store')
    } finally {
      setLoadingStore(false)
    }
  }

  const fetchInventory = async () => {
    try {
      const response = await fetch(`/api/dark-stores/${storeId}/inventory?limit=50`)
      const data = await response.json()
      if (response.ok) {
        setTransactions(data.transactions || [])
      }
    } catch (err) {
      console.error('Error fetching inventory:', err)
    }
  }

  const fetchDarkStoreProducts = async () => {
    try {
      const response = await fetch(`/api/dark-stores/${storeId}/products`)
      const data = await response.json()
      if (response.ok) {
        setDarkStoreProducts(data.products || [])
      }
    } catch (err) {
      console.error('Error fetching dark store products:', err)
    }
  }

  const handleAddProduct = async () => {
    if (!productForm.productId || !productForm.maxStockCapacity || !productForm.lowStockThreshold) {
      setError('Please fill all required fields')
      return
    }

    if (parseInt(productForm.currentStock) > parseInt(productForm.maxStockCapacity)) {
      setError('Current stock cannot exceed max stock capacity')
      return
    }

    if (parseInt(productForm.lowStockThreshold) > parseInt(productForm.maxStockCapacity)) {
      setError('Low stock threshold cannot exceed max stock capacity')
      return
    }

    try {
      setError('')
      const response = await fetch(`/api/dark-stores/${storeId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productForm.productId,
          maxStockCapacity: parseInt(productForm.maxStockCapacity),
          lowStockThreshold: parseInt(productForm.lowStockThreshold),
          currentStock: parseInt(productForm.currentStock) || 0,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to add product')
        return
      }

      setSuccess('Product added successfully')
      setShowAddProductDialog(false)
      setProductForm({ productId: '', maxStockCapacity: '', lowStockThreshold: '', currentStock: '0' })
      fetchDarkStoreProducts()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to add product')
    }
  }

  const handleUpdateStock = (productId: string) => {
    setSelectedProductForStock(productId)
    setInventoryForm({ type: 'stock_in', productId, quantity: '', reason: '' })
    setShowInventoryDialog(true)
  }

  const fetchDeliveryPartners = async () => {
    try {
      const response = await fetch(`/api/dark-stores/${storeId}/delivery-partners`)
      const data = await response.json()
      if (response.ok) {
        setDeliveryPartners(data.assignments || [])
      }
    } catch (err) {
      console.error('Error fetching delivery partners:', err)
    }
  }

  const fetchAvailablePartners = async () => {
    try {
      const response = await fetch('/api/users?role=delivery_partner')
      const data = await response.json()
      if (response.ok) {
        setAvailablePartners(data.users || [])
      }
    } catch (err) {
      console.error('Error fetching delivery partners:', err)
    }
  }

  const fetchAvailablePincodes = async () => {
    try {
      const response = await fetch('/api/deliverable-pincodes?limit=1000')
      const data = await response.json()
      if (response.ok) {
        // Filter pincodes linked to this dark store
        const linkedPincodes = (data.pincodes || []).filter(
          (p: any) => p.darkStoreId === storeId
        )
        setAvailablePincodes(linkedPincodes)
      }
    } catch (err) {
      console.error('Error fetching pincodes:', err)
    }
  }

  const fetchLinkedPincodes = async () => {
    try {
      const response = await fetch('/api/deliverable-pincodes?limit=1000')
      const data = await response.json()
      if (response.ok) {
        // Filter pincodes linked to this dark store
        const linked = (data.pincodes || []).filter(
          (p: any) => p.darkStoreId === storeId
        )
        setLinkedPincodes(linked)
      }
    } catch (err) {
      console.error('Error fetching linked pincodes:', err)
    }
  }

  const handleInventoryUpdate = async () => {
    if (!inventoryForm.quantity || parseInt(inventoryForm.quantity) <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    if (inventoryForm.type === 'stock_in' && !inventoryForm.productId) {
      setError('Please select a product')
      return
    }

    try {
      setError('')
      const response = await fetch(`/api/dark-stores/${storeId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: inventoryForm.type,
          productId: inventoryForm.productId || null,
          quantity: parseInt(inventoryForm.quantity),
          reason: inventoryForm.reason || null,
          createdBy: user?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update inventory')
        return
      }

      setSuccess('Inventory updated successfully')
      setShowInventoryDialog(false)
      setInventoryForm({ type: 'stock_in', productId: '', quantity: '', reason: '' })
      setSelectedProductForStock(null)
      fetchDarkStore()
      fetchInventory()
      fetchDarkStoreProducts()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to update inventory')
    }
  }

  const handleAssignPartner = async () => {
    if (!partnerForm.deliveryPartnerId) {
      setError('Please select a delivery partner')
      return
    }

    try {
      setError('')
      const response = await fetch(`/api/dark-stores/${storeId}/delivery-partners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryPartnerId: partnerForm.deliveryPartnerId,
          pincodes: partnerForm.pincodes,
          assignedBy: user?.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to assign delivery partner')
        return
      }

      setSuccess('Delivery partner assigned successfully')
      setShowPartnerDialog(false)
      setPartnerForm({ deliveryPartnerId: '', pincodes: [] })
      fetchDeliveryPartners()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to assign delivery partner')
    }
  }

  if (loading || loadingStore) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!darkStore) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertDescription>Dark store not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumb items={[
        { label: 'Admin', href: '/admin' },
        { label: 'Dark Stores', href: '/admin/dark-stores' },
        { label: darkStore.name }
      ]} />

      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/admin/dark-stores')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{darkStore.name}</h1>
          <p className="text-muted-foreground mt-1">{darkStore.address}</p>
        </div>
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

      {darkStoreProducts.some(p => p.isLowStock) && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Low Stock Alert:</strong> The following products are running low:
            <ul className="list-disc list-inside mt-2 space-y-1">
              {darkStoreProducts.filter(p => p.isLowStock).map(p => (
                <li key={p.id}>
                  <strong>{p.product.title}</strong>: {p.currentStock} / {p.maxStockCapacity} (Threshold: {p.lowStockThreshold})
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Product-Specific Inventory */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Inventory</CardTitle>
              <CardDescription>Manage inventory for each product in this dark store</CardDescription>
            </div>
            <Button onClick={() => setShowAddProductDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {darkStoreProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No products added to this dark store yet</p>
              {products.length === 0 ? (
                <div className="border border-yellow-200 bg-yellow-50 rounded-md p-4">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>No products available!</strong> You need to add products first before adding them to dark stores.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/admin/products')}
                  >
                    Go to Products Page
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowAddProductDialog(true)}>
                  Add First Product
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {darkStoreProducts.map((dsp) => (
                <div key={dsp.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{dsp.product.title}</h3>
                        <Badge variant="secondary">{dsp.product.productType}</Badge>
                        {dsp.isLowStock && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Current Stock</div>
                          <div className="text-2xl font-bold">{dsp.currentStock}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Max Capacity</div>
                          <div className="text-2xl font-bold">{dsp.maxStockCapacity}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Low Stock Threshold</div>
                          <div className="text-2xl font-bold text-yellow-600">{dsp.lowStockThreshold}</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Stock Level</span>
                          <span className="text-sm text-muted-foreground">
                            {dsp.stockPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              dsp.isLowStock
                                ? 'bg-yellow-500'
                                : dsp.stockPercentage > 80
                                ? 'bg-green-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${dsp.stockPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStock(dsp.productId)}
                    >
                      Update Stock
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Linked Pincodes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Linked Pincodes
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/admin/deliverable-pincodes')}
              >
                Manage Pincodes
              </Button>
            </div>
            <CardDescription>
              Pincodes that are served by this dark store
            </CardDescription>
          </CardHeader>
          <CardContent>
            {linkedPincodes.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No pincodes linked to this dark store</p>
                <p className="text-sm text-muted-foreground mb-4">
                  To link pincodes, go to <strong>Deliverable Pincodes</strong> and select this dark store when creating or editing a pincode.
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/deliverable-pincodes')}
                >
                  Go to Deliverable Pincodes
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {linkedPincodes.map((pincode) => (
                  <div key={pincode.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium font-mono">{pincode.pincode}</div>
                      {(pincode.areaName || pincode.city) && (
                        <div className="text-sm text-muted-foreground">
                          {pincode.areaName || ''} {pincode.city ? (pincode.areaName ? ', ' : '') + pincode.city : ''}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {pincode.isActive ? (
                        <Badge variant="default" className="bg-green-500">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Partners */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Delivery Partners
              </CardTitle>
              <Button size="sm" onClick={() => setShowPartnerDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Assign Partner
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {deliveryPartners.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No delivery partners assigned</p>
            ) : (
              <div className="space-y-3">
                {deliveryPartners.map((assignment) => (
                  <div key={assignment.id} className="p-3 border rounded-lg">
                    <div className="font-medium">
                      {assignment.partner?.name || 'Unknown Partner'}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {assignment.partner?.phone} | {assignment.partner?.email}
                    </div>
                    {assignment.pincodes && assignment.pincodes.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1">Assigned Pincodes:</div>
                        <div className="flex flex-wrap gap-1">
                          {assignment.pincodes.map((pincode, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {pincode}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent Inventory Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 10).map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {txn.type === 'stock_in' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className="font-medium capitalize">{txn.type.replace('_', ' ')}</span>
                        {txn.product && (
                          <Badge variant="secondary" className="text-xs">
                            {txn.product.title}
                          </Badge>
                        )}
                        <Badge variant="outline">{Math.abs(txn.quantity)} jars</Badge>
                      </div>
                      {txn.reason && (
                        <p className="text-sm text-muted-foreground mt-1">{txn.reason}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(txn.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {txn.stockBefore} → {txn.stockAfter}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Partners */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Delivery Partners
              </CardTitle>
              <Button size="sm" onClick={() => setShowPartnerDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Assign Partner
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {deliveryPartners.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No delivery partners assigned</p>
            ) : (
              <div className="space-y-3">
                {deliveryPartners.map((assignment) => (
                  <div key={assignment.id} className="p-3 border rounded-lg">
                    <div className="font-medium">
                      {assignment.partner?.name || 'Unknown Partner'}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {assignment.partner?.phone} | {assignment.partner?.email}
                    </div>
                    {assignment.pincodes && assignment.pincodes.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1">Assigned Pincodes:</div>
                        <div className="flex flex-wrap gap-1">
                          {assignment.pincodes.map((pincode, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {pincode}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Update Dialog */}
      <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Transaction Type</Label>
              <select
                id="type"
                value={inventoryForm.type}
                onChange={(e) => setInventoryForm({ ...inventoryForm, type: e.target.value, productId: e.target.value === 'stock_in' ? inventoryForm.productId : '' })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="stock_in">Stock In (Add)</option>
                <option value="stock_out">Stock Out (Remove)</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
            <div>
              <Label htmlFor="productId">Product *</Label>
              {selectedProductForStock ? (
                <div className="p-3 border rounded-md bg-gray-50">
                  <p className="font-medium">
                    {darkStoreProducts.find(p => p.productId === selectedProductForStock)?.product.title || 'Selected Product'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Stock: {darkStoreProducts.find(p => p.productId === selectedProductForStock)?.currentStock || 0} / {darkStoreProducts.find(p => p.productId === selectedProductForStock)?.maxStockCapacity || 0}
                  </p>
                </div>
              ) : (
                <select
                  id="productId"
                  value={inventoryForm.productId}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, productId: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  required
                >
                  <option value="">Select a product</option>
                  {darkStoreProducts.map((dsp) => (
                    <option key={dsp.productId} value={dsp.productId}>
                      {dsp.product.title} ({dsp.product.productType}) - Stock: {dsp.currentStock}/{dsp.maxStockCapacity}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-muted-foreground mt-1">Product is required for all inventory transactions</p>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="100"
                value={inventoryForm.quantity}
                onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason/Notes</Label>
              <Textarea
                id="reason"
                placeholder="Reason for this inventory change"
                value={inventoryForm.reason}
                onChange={(e) => setInventoryForm({ ...inventoryForm, reason: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowInventoryDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleInventoryUpdate}
              disabled={!inventoryForm.productId || darkStoreProducts.length === 0}
            >
              Update Inventory
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product to Dark Store</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="border border-yellow-200 bg-yellow-50 rounded-md p-4">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>No products available!</strong> You need to add products first before adding them to dark stores.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddProductDialog(false)
                    router.push('/admin/products')
                  }}
                  className="w-full"
                >
                  Go to Products Page
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="addProductId">Product *</Label>
                  <select
                    id="addProductId"
                    value={productForm.productId}
                    onChange={(e) => setProductForm({ ...productForm, productId: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    required
                  >
                    <option value="">Select a product</option>
                    {products
                      .filter(p => !darkStoreProducts.some(dsp => dsp.productId === p.id))
                      .map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.title} ({product.productType})
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">Select which product to add to this dark store</p>
                </div>
                <div>
                  <Label htmlFor="maxStockCapacity">Max Stock Capacity *</Label>
                  <Input
                    id="maxStockCapacity"
                    type="number"
                    placeholder="1000"
                    value={productForm.maxStockCapacity}
                    onChange={(e) => setProductForm({ ...productForm, maxStockCapacity: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Maximum number of units that can be stored</p>
                </div>
                <div>
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold *</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    placeholder="100"
                    value={productForm.lowStockThreshold}
                    onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Alert when stock goes below this number</p>
                </div>
                <div>
                  <Label htmlFor="currentStock">Initial Stock (Optional)</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    placeholder="0"
                    value={productForm.currentStock}
                    onChange={(e) => setProductForm({ ...productForm, currentStock: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Initial stock quantity (default: 0)</p>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={handleAddProduct}
                    disabled={!productForm.productId || !productForm.maxStockCapacity || !productForm.lowStockThreshold}
                  >
                    Add Product
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAddProductDialog(false)
                      setProductForm({ productId: '', maxStockCapacity: '', lowStockThreshold: '', currentStock: '0' })
                      setError('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Delivery Partner Dialog */}
      <Dialog open={showPartnerDialog} onOpenChange={setShowPartnerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Delivery Partner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deliveryPartnerId">Delivery Partner *</Label>
              <select
                id="deliveryPartnerId"
                value={partnerForm.deliveryPartnerId}
                onChange={(e) => setPartnerForm({ ...partnerForm, deliveryPartnerId: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Select a delivery partner</option>
                {availablePartners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name} - {partner.phone}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Assign Pincodes (Optional)</Label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-3 mt-2">
                {availablePincodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pincodes linked to this dark store</p>
                ) : (
                  <div className="space-y-2">
                    {availablePincodes.map((pincode) => (
                      <label key={pincode.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={partnerForm.pincodes.includes(pincode.pincode)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPartnerForm({
                                ...partnerForm,
                                pincodes: [...partnerForm.pincodes, pincode.pincode],
                              })
                            } else {
                              setPartnerForm({
                                ...partnerForm,
                                pincodes: partnerForm.pincodes.filter((p) => p !== pincode.pincode),
                              })
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {pincode.pincode} {pincode.areaName && `- ${pincode.areaName}`}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Select which pincodes this partner can deliver to from this dark store
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowPartnerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignPartner}>
              Assign Partner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

