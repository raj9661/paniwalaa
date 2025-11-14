'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CheckCircle2, XCircle, Search, Clock, AlertCircle, QrCode, Banknote } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Order = {
  id: string
  orderNumber?: string
  user: {
    id: string
    name: string | null
    email: string | null
  }
  product: {
    title: string
  }
  address: {
    line1: string
    pincode: string
  }
  finalTotalCents: number | string
  paymentMethod: string
  paymentStatus: string
  utrNumber: string | null
  paymentVerified: boolean
  paymentVerifiedBy: string | null
  paymentVerifiedAt: string | null
  placedAt: string
}

export default function PaymentVerificationPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'unverified' | 'verified' | 'failed'>('unverified')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/admin')
      return
    }
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchOrders()
    }
  }, [user, loading, router, filterStatus])

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true)
      const response = await fetch('/api/orders')
      const data = await response.json()
      
      if (response.ok) {
        let filtered = data.orders || []
        
        // Filter by payment method (UPI only) and status
        filtered = filtered.filter((order: any) => {
          const matchesMethod = order.paymentMethod === 'upi'
          const matchesStatus = 
            filterStatus === 'all' ||
            (filterStatus === 'unverified' && order.paymentStatus === 'unverified' && !order.paymentVerified) ||
            (filterStatus === 'verified' && order.paymentVerified) ||
            (filterStatus === 'failed' && order.paymentStatus === 'failed')
          return matchesMethod && matchesStatus
        })
        
        setOrders(filtered)
      } else {
        setError(data.error || 'Failed to fetch orders')
      }
    } catch (err) {
      setError('Failed to fetch orders')
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleVerifyPayment = async (verified: boolean) => {
    if (!selectedOrder || !user) return

    setVerifying(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verified,
          verifiedBy: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to verify payment')
        return
      }

      setSuccess(verified ? 'Payment verified successfully' : 'Payment rejected')
      setShowVerifyDialog(false)
      setSelectedOrder(null)
      fetchOrders()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to verify payment')
    } finally {
      setVerifying(false)
    }
  }

  const getStatusBadge = (order: Order) => {
    if (order.paymentVerified) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      )
    }
    if (order.paymentStatus === 'failed') {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        Pending Verification
      </Badge>
    )
  }

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      order.id.toLowerCase().includes(query) ||
      order.user.name?.toLowerCase().includes(query) ||
      order.user.email?.toLowerCase().includes(query) ||
      order.utrNumber?.toLowerCase().includes(query) ||
      order.address.pincode.includes(query)
    )
  })

  if (loading || loadingOrders) {
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
        <Breadcrumb items={[{ label: 'Payment Verification' }]} className="mb-6" />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Payment Verification</h1>
          <p className="text-muted-foreground">Verify UPI payments by checking UTR numbers</p>
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

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterStatus === 'unverified' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('unverified')}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={filterStatus === 'verified' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('verified')}
                  >
                    Verified
                  </Button>
                  <Button
                    variant={filterStatus === 'failed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('failed')}
                  >
                    Failed
                  </Button>
                </div>
              </div>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID, customer, UTR, or pincode..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filterStatus === 'unverified'
                  ? 'No pending payment verifications'
                  : 'No orders found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="border-2">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-foreground mb-1">
                            Order #{order.id.slice(-8)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Placed on {new Date(order.placedAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                        </div>
                        {getStatusBadge(order)}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-1">Customer</p>
                          <p className="text-sm text-muted-foreground">
                            {order.user.name || 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground">{order.user.email}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-1">Product</p>
                          <p className="text-sm text-muted-foreground">{order.product.title}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-1">Delivery Address</p>
                          <p className="text-sm text-muted-foreground">
                            {order.address.line1}, Pincode: {order.address.pincode}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-1">Amount</p>
                          <p className="text-lg font-bold text-foreground">
                            ₹{(Number(order.finalTotalCents) / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <QrCode className="w-4 h-4 text-purple-600" />
                          <p className="text-sm font-semibold text-foreground">UPI Payment Details</p>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">UTR Number</p>
                            <p className="text-sm font-mono font-semibold text-purple-700">
                              {order.utrNumber || 'Not provided'}
                            </p>
                          </div>
                          {order.paymentVerifiedAt && (
                            <div>
                              <p className="text-xs text-muted-foreground">Verified At</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.paymentVerifiedAt).toLocaleString('en-IN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {!order.paymentVerified && order.paymentStatus !== 'failed' && (
                      <div className="flex flex-col gap-2 lg:min-w-[200px]">
                        <Button
                          className="bg-green-600 hover:bg-green-700 gap-2"
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowVerifyDialog(true)
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Verify Payment
                        </Button>
                        <Button
                          variant="destructive"
                          className="gap-2"
                          onClick={() => {
                            setSelectedOrder(order)
                            if (confirm('Are you sure you want to reject this payment?')) {
                              handleVerifyPayment(false)
                            }
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                          Reject Payment
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Verify Payment Dialog */}
        <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify Payment</DialogTitle>
              <DialogDescription>
                Please verify the UTR number matches the payment received in your UPI account.
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Order ID</p>
                    <p className="text-sm text-muted-foreground">#{selectedOrder.id.slice(-8)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Amount</p>
                    <p className="text-lg font-bold text-foreground">
                      ₹{(Number(selectedOrder.finalTotalCents) / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">UTR Number</p>
                    <p className="text-sm font-mono font-semibold text-purple-700">
                      {selectedOrder.utrNumber || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Customer</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.user.name} ({selectedOrder.user.email})
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                    onClick={() => handleVerifyPayment(true)}
                    disabled={verifying}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {verifying ? 'Verifying...' : 'Verify Payment'}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => handleVerifyPayment(false)}
                    disabled={verifying}
                  >
                    <XCircle className="w-4 h-4" />
                    {verifying ? 'Rejecting...' : 'Reject Payment'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

