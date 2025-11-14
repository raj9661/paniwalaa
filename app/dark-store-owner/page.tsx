'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Warehouse, Package, TrendingUp, IndianRupee, Clock, 
  CheckCircle2, AlertTriangle, User, Phone, MapPin,
  Truck, DollarSign, Calendar
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

type EarningsData = {
  deliveryEarnings: {
    total: number
    today: number
    thisMonth: number
    orders: Array<{
      id: string
      orderId: string
      product: {
        id: string
        title: string
        productType: string
      }
      qty: number
      commission: number
      customer: string
      customerPhone: string
      deliveredAt: string
    }>
  }
  darkStoreEarnings: {
    total: number
    today: number
    thisMonth: number
    orders: Array<{
      id: string
      orderId: string
      darkStore: {
        id: string
        name: string
      }
      product: {
        id: string
        title: string
        productType: string
      }
      qty: number
      earnings: number
      perJarRate: number
      customer: string
      customerPhone: string
      deliveredAt: string
    }>
  }
  totalEarnings: number
  darkStores: Array<{
    id: string
    name: string
    paymentModel: string
    perJarRate: number
  }>
}

export default function DarkStoreOwnerDashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null)
  const [loadingEarnings, setLoadingEarnings] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState<'today' | 'month' | 'all'>('all')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      fetchEarnings()
    }
  }, [user, loading, router])

  const fetchEarnings = async () => {
    if (!user?.id) return
    
    try {
      setLoadingEarnings(true)
      const response = await fetch(`/api/dark-store-owner/earnings?userId=${user.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setEarningsData(data)
      } else {
        console.error('Error fetching earnings:', data.error)
      }
    } catch (error) {
      console.error('Error fetching earnings:', error)
    } finally {
      setLoadingEarnings(false)
    }
  }

  if (loading || loadingEarnings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isDeliveryPartner = user.role === 'delivery_partner'
  const hasDarkStores = earningsData && earningsData.darkStores.length > 0

  // Calculate earnings based on date range
  const getEarningsForRange = () => {
    if (!earningsData) return { delivery: 0, darkStore: 0, total: 0 }
    
    switch (dateRange) {
      case 'today':
        return {
          delivery: earningsData.deliveryEarnings.today,
          darkStore: earningsData.darkStoreEarnings.today,
          total: earningsData.deliveryEarnings.today + earningsData.darkStoreEarnings.today,
        }
      case 'month':
        return {
          delivery: earningsData.deliveryEarnings.thisMonth,
          darkStore: earningsData.darkStoreEarnings.thisMonth,
          total: earningsData.deliveryEarnings.thisMonth + earningsData.darkStoreEarnings.thisMonth,
        }
      default:
        return {
          delivery: earningsData.deliveryEarnings.total,
          darkStore: earningsData.darkStoreEarnings.total,
          total: earningsData.totalEarnings,
        }
    }
  }

  const rangeEarnings = getEarningsForRange()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dark Store Owner Dashboard</h1>
                <p className="text-xs text-muted-foreground">
                  {user.name || user.email} {isDeliveryPartner && '(Delivery Partner)'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push('/')}>
                Home
              </Button>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!hasDarkStores ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <Warehouse className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Dark Stores Found</h2>
              <p className="text-muted-foreground mb-4">
                You don't own any dark stores yet. Please contact the administrator to link your account to a dark store.
              </p>
              <Button onClick={() => router.push('/')}>
                Go to Home
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Date Range Selector */}
            <div className="mb-6 flex justify-end">
              <div className="flex gap-2 bg-white rounded-lg p-1 border">
                <Button
                  variant={dateRange === 'today' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDateRange('today')}
                >
                  Today
                </Button>
                <Button
                  variant={dateRange === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDateRange('month')}
                >
                  This Month
                </Button>
                <Button
                  variant={dateRange === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDateRange('all')}
                >
                  All Time
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-2 border-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-foreground">₹{rangeEarnings.total.toFixed(2)}</p>
                  <p className="text-xs text-blue-600 mt-2">
                    {dateRange === 'today' ? 'Today' : dateRange === 'month' ? 'This Month' : 'All Time'}
                  </p>
                </CardContent>
              </Card>

              {isDeliveryPartner && (
                <Card className="border-2 border-green-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Truck className="w-6 h-6 text-green-600" />
                      </div>
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Delivery Earnings</p>
                    <p className="text-3xl font-bold text-foreground">₹{rangeEarnings.delivery.toFixed(2)}</p>
                    <p className="text-xs text-green-600 mt-2">
                      {earningsData?.deliveryEarnings.orders.length || 0} orders delivered
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="border-2 border-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Warehouse className="w-6 h-6 text-purple-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Dark Store Earnings</p>
                  <p className="text-3xl font-bold text-foreground">₹{rangeEarnings.darkStore.toFixed(2)}</p>
                  <p className="text-xs text-purple-600 mt-2">
                    {earningsData?.darkStoreEarnings.orders.length || 0} orders fulfilled
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-orange-600" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-foreground">
                    {(earningsData?.deliveryEarnings.orders.length || 0) + (earningsData?.darkStoreEarnings.orders.length || 0)}
                  </p>
                  <p className="text-xs text-orange-600 mt-2">All completed orders</p>
                </CardContent>
              </Card>
            </div>

            {/* Dark Stores List */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>My Dark Stores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {earningsData?.darkStores.map((store) => (
                    <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Warehouse className="w-8 h-8 text-blue-600" />
                        <div>
                          <h3 className="font-semibold">{store.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Payment Model: {store.paymentModel === 'per_jar' ? 'Per Jar' : 'Monthly Rent'}
                            {store.paymentModel === 'per_jar' && ` (₹${store.perJarRate}/jar)`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/admin/dark-stores/${store.id}`)}
                      >
                        Manage Store
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Orders */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {isDeliveryPartner && (
                  <TabsTrigger value="delivery">Delivery Orders</TabsTrigger>
                )}
                <TabsTrigger value="darkstore">Dark Store Orders</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Delivery Earnings Breakdown */}
                  {isDeliveryPartner && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Truck className="w-5 h-5" />
                          Delivery Earnings Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Today:</span>
                            <span className="font-semibold">₹{earningsData?.deliveryEarnings.today.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">This Month:</span>
                            <span className="font-semibold">₹{earningsData?.deliveryEarnings.thisMonth.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="flex justify-between items-center border-t pt-2">
                            <span className="font-semibold">Total:</span>
                            <span className="text-2xl font-bold text-green-600">
                              ₹{earningsData?.deliveryEarnings.total.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {earningsData?.deliveryEarnings.orders.length || 0} orders delivered
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Dark Store Earnings Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Warehouse className="w-5 h-5" />
                        Dark Store Earnings Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Today:</span>
                          <span className="font-semibold">₹{earningsData?.darkStoreEarnings.today.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">This Month:</span>
                          <span className="font-semibold">₹{earningsData?.darkStoreEarnings.thisMonth.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="font-semibold">Total:</span>
                          <span className="text-2xl font-bold text-purple-600">
                            ₹{earningsData?.darkStoreEarnings.total.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {earningsData?.darkStoreEarnings.orders.length || 0} orders fulfilled
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {isDeliveryPartner && (
                <TabsContent value="delivery" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Delivery Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {earningsData?.deliveryEarnings.orders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No delivery orders yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {earningsData?.deliveryEarnings.orders.map((order) => (
                            <div key={order.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline">{order.orderId}</Badge>
                                    <span className="text-sm text-muted-foreground">
                                      {new Date(order.deliveredAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="font-semibold">{order.product.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Quantity: {order.qty} | Customer: {order.customer}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-600">
                                    ₹{order.commission.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Commission</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              <TabsContent value="darkstore" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Dark Store Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {earningsData?.darkStoreEarnings.orders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Warehouse className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No orders fulfilled from your dark store yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {earningsData?.darkStoreEarnings.orders.map((order) => (
                          <div key={order.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline">{order.orderId}</Badge>
                                  <Badge variant="secondary">{order.darkStore.name}</Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(order.deliveredAt).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <p className="font-semibold">{order.product.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  Quantity: {order.qty} | Customer: {order.customer}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Rate: ₹{order.perJarRate}/jar
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-purple-600">
                                  ₹{order.earnings.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">Earnings</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}

