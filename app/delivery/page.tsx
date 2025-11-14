'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Droplet, Package, TrendingUp, MapPin, Phone, CheckCircle2, Navigation, IndianRupee, Clock, User, Star } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { NotificationsPanel } from '@/components/notifications-panel'

// Mock data
const mockAssignedOrders = [
  { 
    id: 'ORD-002', 
    customer: 'Priya Gupta', 
    phone: '+91 98765 43211',
    address: 'B-42, Sector 15, Laxmi Nagar, Delhi - 110092', 
    quantity: 1, 
    amount: 60,
    distance: '1.2 km',
    time: '5 mins ago',
    status: 'picked'
  },
  { 
    id: 'ORD-006', 
    customer: 'Vikram Singh', 
    phone: '+91 98765 43215',
    address: 'C-18, Block C, Laxmi Nagar, Delhi - 110092', 
    quantity: 2, 
    amount: 120,
    distance: '0.8 km',
    time: '8 mins ago',
    status: 'assigned'
  },
]

const mockAvailableOrders = [
  { 
    id: 'ORD-007', 
    address: 'D-25, Market Road, Laxmi Nagar', 
    quantity: 1, 
    amount: 60,
    distance: '1.5 km',
    earnings: 30,
    time: '2 mins ago'
  },
  { 
    id: 'ORD-008', 
    address: 'A-10, Block A, Laxmi Nagar', 
    quantity: 3, 
    amount: 180,
    distance: '2.1 km',
    earnings: 45,
    time: '4 mins ago'
  },
]

const mockCompletedOrders = [
  { 
    id: 'ORD-003', 
    customer: 'Amit Verma',
    address: 'Block C, Laxmi Nagar', 
    quantity: 3, 
    amount: 180,
    earnings: 45,
    completedAt: '15 mins ago',
    rating: 5
  },
  { 
    id: 'ORD-001', 
    customer: 'Rahul Sharma',
    address: 'Block A, Laxmi Nagar', 
    quantity: 2, 
    amount: 120,
    earnings: 30,
    completedAt: '1 hour ago',
    rating: 5
  },
]

export default function DeliveryPartnerDashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(true)
  const [activeTab, setActiveTab] = useState('assigned')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'delivery_partner')) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleAcceptOrder = (orderId: string) => {
    console.log(`[v0] Accepted order: ${orderId}`)
    // Handle order acceptance
  }

  const handleMarkDelivered = (orderId: string) => {
    console.log(`[v0] Marked delivered: ${orderId}`)
    // Handle mark as delivered
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Delivery Partner Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Paniwalaa Delivery</h1>
                <p className="text-xs text-muted-foreground">Partner Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationsPanel />
              <div className="flex items-center gap-2">
                <Switch 
                  id="online-status" 
                  checked={isOnline}
                  onCheckedChange={setIsOnline}
                />
                <Label htmlFor="online-status" className="cursor-pointer">
                  <Badge 
                    variant="secondary" 
                    className={isOnline 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                    }
                  >
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </Label>
              </div>
              <Button 
                onClick={() => signOut()}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 gap-2"
              >
                <Star className="w-4 h-4 text-white" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Orders Today</p>
              <p className="text-3xl font-bold text-foreground">8</p>
              <p className="text-xs text-green-600 mt-2">+2 from yesterday</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-emerald-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Earnings Today</p>
              <p className="text-3xl font-bold text-foreground">₹240</p>
              <p className="text-xs text-green-600 mt-2">Average: ₹30/order</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                  Excellent
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Rating</p>
              <p className="text-3xl font-bold text-foreground">4.8</p>
              <p className="text-xs text-muted-foreground mt-2">From 45 deliveries</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                  Fast
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Avg. Delivery Time</p>
              <p className="text-3xl font-bold text-foreground">22m</p>
              <p className="text-xs text-muted-foreground mt-2">Target: 30 minutes</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border-2">
            <TabsTrigger value="assigned" className="gap-2">
              <Package className="w-4 h-4" />
              My Orders ({mockAssignedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="available" className="gap-2">
              <Navigation className="w-4 h-4" />
              Available ({mockAvailableOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </TabsTrigger>
          </TabsList>

          {/* Assigned Orders Tab */}
          <TabsContent value="assigned" className="space-y-4">
            {mockAssignedOrders.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold text-foreground mb-2">No Active Orders</p>
                  <p className="text-sm text-muted-foreground">Check the Available tab to accept new orders</p>
                </CardContent>
              </Card>
            ) : (
              mockAssignedOrders.map((order) => (
                <Card key={order.id} className="border-2 border-blue-100">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xl font-bold text-foreground">{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.time}</p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={order.status === 'picked' 
                          ? 'bg-blue-100 text-blue-700 border-blue-200' 
                          : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }
                      >
                        {order.status === 'picked' ? 'Picked Up' : 'Assigned'}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border-2 border-blue-100">
                        <div className="flex items-start gap-3 mb-3">
                          <User className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{order.customer}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <a href={`tel:${order.phone}`} className="text-sm text-blue-600 hover:underline">
                                {order.phone}
                              </a>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-foreground leading-relaxed">{order.address}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                                {order.distance} away
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                        <div>
                          <p className="text-sm text-muted-foreground">Order Value</p>
                          <p className="text-2xl font-bold text-foreground">₹{order.amount}</p>
                          <p className="text-xs text-muted-foreground">{order.quantity} jar{order.quantity > 1 ? 's' : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Your Earning</p>
                          <p className="text-2xl font-bold text-green-600">₹{order.amount / 2}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          className="flex-1 gap-2"
                          onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(order.address)}`, '_blank')}
                        >
                          <Navigation className="w-4 h-4" />
                          Navigate
                        </Button>
                        {order.status === 'picked' && (
                          <Button 
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 gap-2"
                            onClick={() => handleMarkDelivered(order.id)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Mark Delivered
                          </Button>
                        )}
                        {order.status === 'assigned' && (
                          <Button 
                            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 gap-2"
                          >
                            <Package className="w-4 h-4" />
                            Mark Picked Up
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Available Orders Tab */}
          <TabsContent value="available" className="space-y-4">
            {!isOnline ? (
              <Card className="border-2 border-yellow-100 bg-yellow-50">
                <CardContent className="p-8 text-center">
                  <p className="text-lg font-semibold text-foreground mb-2">You are offline</p>
                  <p className="text-sm text-muted-foreground mb-4">Turn on your availability to see new orders</p>
                  <Button 
                    onClick={() => setIsOnline(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    Go Online
                  </Button>
                </CardContent>
              </Card>
            ) : mockAvailableOrders.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <Navigation className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold text-foreground mb-2">No Available Orders</p>
                  <p className="text-sm text-muted-foreground">New orders will appear here automatically</p>
                </CardContent>
              </Card>
            ) : (
              mockAvailableOrders.map((order) => (
                <Card key={order.id} className="border-2 hover:border-green-200 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xl font-bold text-foreground">{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.time}</p>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                        New Order
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-100">
                        <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-foreground font-medium leading-relaxed">{order.address}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs">
                              {order.distance} away
                            </Badge>
                            <span className="text-xs text-muted-foreground">{order.quantity} jar{order.quantity > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Order Value</p>
                          <p className="text-xl font-bold text-foreground">₹{order.amount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">You'll Earn</p>
                          <p className="text-2xl font-bold text-green-600">₹{order.earnings}</p>
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 gap-2 py-6"
                        onClick={() => handleAcceptOrder(order.id)}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Accept Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Completed Orders Tab */}
          <TabsContent value="completed" className="space-y-4">
            {mockCompletedOrders.map((order) => (
              <Card key={order.id} className="border-2">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-lg font-bold text-foreground">{order.id}</p>
                          <p className="text-sm text-muted-foreground">{order.completedAt}</p>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                          Delivered
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm text-foreground font-medium">{order.customer}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-foreground">{order.address}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <p className="text-sm text-foreground font-medium">{order.rating} stars</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-8 md:gap-12">
                      <div className="text-center md:text-right">
                        <p className="text-sm text-muted-foreground mb-1">Items</p>
                        <p className="text-xl font-bold text-foreground">{order.quantity}</p>
                      </div>
                      <div className="text-center md:text-right">
                        <p className="text-sm text-muted-foreground mb-1">Order Value</p>
                        <p className="text-xl font-bold text-foreground">₹{order.amount}</p>
                      </div>
                      <div className="text-center md:text-right">
                        <p className="text-sm text-muted-foreground mb-1">You Earned</p>
                        <p className="text-xl font-bold text-green-600">₹{order.earnings}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
