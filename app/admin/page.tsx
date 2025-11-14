'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Droplet, Users, Package, TrendingUp, Search, MoreVertical, CheckCircle2, XCircle, Truck, IndianRupee, MapPin, Phone, Mail, BarChart3, FileText, Bell, MessageSquare, AlertCircle, Settings, Send, Shield, Tag, Navigation, CreditCard, ChevronDown, LayoutGrid, MessageCircle, Eye, X, AlertTriangle, Warehouse } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { NotificationsPanel } from '@/components/notifications-panel'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import Link from 'next/link'


export default function AdminDashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [popupStats, setPopupStats] = useState({ active: 0, total: 0 })
  const [notificationStats, setNotificationStats] = useState({ unread: 0, total: 0 })
  const [orders, setOrders] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [waivingFloorCharge, setWaivingFloorCharge] = useState(false)
  const [partners, setPartners] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeCustomers: 0,
    revenueToday: 0,
    activePartners: 0,
  })
  const [loadingData, setLoadingData] = useState(true)
  const [lowStockStores, setLowStockStores] = useState<any[]>([])

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchPopupStats()
      fetchNotificationStats()
      fetchDashboardData()
      fetchLowStockStores()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true)
      
      // Fetch orders
      const ordersRes = await fetch('/api/orders?limit=10')
      const ordersData = await ordersRes.json()
      if (ordersRes.ok) {
        setOrders(ordersData.orders || [])
        setStats(prev => ({ ...prev, totalOrders: ordersData.pagination?.total || 0 }))
      }

      // Fetch users (customers and delivery partners)
      const usersRes = await fetch('/api/users')
      const usersData = await usersRes.json()
      if (usersRes.ok) {
        const allUsers = usersData.users || []
        const customersList = allUsers.filter((u: any) => u.role === 'customer' && u.isActive && !u.isSuspended)
        const partnersList = allUsers.filter((u: any) => u.role === 'delivery_partner' && u.isActive && !u.isSuspended)
        
        setCustomers(customersList.slice(0, 10))
        setPartners(partnersList.slice(0, 10))
        setStats(prev => ({
          ...prev,
          activeCustomers: customersList.length,
          activePartners: partnersList.length,
        }))
      }

      // Calculate revenue today
      if (ordersData.orders) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayOrders = ordersData.orders.filter((o: any) => {
          const orderDate = new Date(o.placedAt)
          return orderDate >= today && (o.paymentStatus === 'paid' || o.paymentStatus === 'verified' || o.paymentMethod === 'cod')
        })
        const revenue = todayOrders.reduce((sum: number, o: any) => {
          return sum + (Number(o.finalTotalCents) / 100)
        }, 0)
        setStats(prev => ({ ...prev, revenueToday: revenue }))
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const fetchLowStockStores = async () => {
    try {
      const response = await fetch('/api/dark-stores?includeLowStock=true')
      const data = await response.json()
      if (response.ok) {
        setLowStockStores(data.darkStores || [])
      }
    } catch (error) {
      console.error('Error fetching low stock stores:', error)
    }
  }

  const fetchPopupStats = async () => {
    try {
      const response = await fetch('/api/popups')
      const data = await response.json()
      const popups = data.popups || []
      setPopupStats({
        active: popups.filter((p: any) => p.isActive).length,
        total: popups.length,
      })
    } catch (error) {
      console.error('Error fetching popup stats:', error)
    }
  }

  const fetchNotificationStats = async () => {
    try {
      const response = await fetch('/api/notifications?adminView=true')
      const data = await response.json()
      const notifications = data.notifications || []
      setNotificationStats({
        unread: notifications.filter((n: any) => !n.isRead).length,
        total: notifications.length,
      })
    } catch (error) {
      console.error('Error fetching notification stats:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Pending' },
      assigned: { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Assigned' },
      delivered: { variant: 'secondary' as const, className: 'bg-green-100 text-green-700 border-green-200', label: 'Delivered' },
      cancelled: { variant: 'secondary' as const, className: 'bg-red-100 text-red-700 border-red-200', label: 'Cancelled' },
    }
    const config = variants[status as keyof typeof variants]
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>
  }

  if (loading) {
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
      {/* Admin Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Paniwalaa Admin</h1>
                <p className="text-xs text-muted-foreground">Dashboard & Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Content Management Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden sm:inline">Content</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/admin/products" className="flex items-center gap-2 cursor-pointer">
                      <Package className="w-4 h-4" />
                      Products
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/blogs" className="flex items-center gap-2 cursor-pointer">
                      <FileText className="w-4 h-4" />
                      Blogs & SEO
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/popups" className="flex items-center gap-2 cursor-pointer relative">
                      <MessageSquare className="w-4 h-4" />
                      Popups
                      {popupStats.active > 0 && (
                        <span className="ml-auto w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                          {popupStats.active}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/notifications" className="flex items-center gap-2 cursor-pointer relative">
                      <Bell className="w-4 h-4" />
                      Notifications
                      {notificationStats.unread > 0 && (
                        <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {notificationStats.unread}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Communication Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Communication</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/admin/email-settings" className="flex items-center gap-2 cursor-pointer">
                      <Mail className="w-4 h-4" />
                      Email Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/send-email" className="flex items-center gap-2 cursor-pointer">
                      <Send className="w-4 h-4" />
                      Send Email
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/contact-submissions" className="flex items-center gap-2 cursor-pointer">
                      <Mail className="w-4 h-4" />
                      Contact Submissions
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Settings */}
              <Link href="/admin/settings">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </Link>

              {/* Security & Users Dropdown (Admin & Super Admin) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">Security</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/admin/login-logs" className="flex items-center gap-2 cursor-pointer">
                      <Shield className="w-4 h-4" />
                      Login Logs
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === 'super_admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/users" className="flex items-center gap-2 cursor-pointer">
                        <Users className="w-4 h-4" />
                        User Management
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Business Dropdown (Super Admin) */}
              {user?.role === 'super_admin' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="hidden sm:inline">Business</span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/admin/dark-stores" className="flex items-center gap-2 cursor-pointer">
                        <Warehouse className="w-4 h-4" />
                        Dark Stores
                        {lowStockStores.length > 0 && (
                          <span className="ml-auto w-5 h-5 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center">
                            {lowStockStores.length}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/promo-codes" className="flex items-center gap-2 cursor-pointer">
                        <Tag className="w-4 h-4" />
                        Promo Codes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/deliverable-pincodes" className="flex items-center gap-2 cursor-pointer">
                        <Navigation className="w-4 h-4" />
                        Deliverable Pincodes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/payment-verification" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="w-4 h-4" />
                        Payment Verification
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Analytics */}
              <Link href="/admin/analytics">
                <Button variant="outline" size="sm" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </Button>
              </Link>

              {/* Notifications Panel */}
              <NotificationsPanel />

              {/* Logout */}
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Low Stock Alert */}
        {lowStockStores.length > 0 && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="flex items-center justify-between">
                <div>
                  <strong>{lowStockStores.length}</strong> dark store{lowStockStores.length > 1 ? 's' : ''} {lowStockStores.length > 1 ? 'have' : 'has'} low stock:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {lowStockStores.slice(0, 5).map((store) => {
                      // Get low stock products for this store
                      const lowStockProducts = store.products?.filter((p: any) => p.isLowStock) || []
                      return (
                        <li key={store.id}>
                          <strong>{store.name}</strong>
                          {lowStockProducts.length > 0 ? (
                            <span>
                              {' '}- {lowStockProducts.map((p: any, idx: number) => (
                                <span key={p.productId}>
                                  {idx > 0 && ', '}
                                  {p.product?.title || 'Product'}: {p.currentStock} / {p.maxStockCapacity} (Threshold: {p.lowStockThreshold})
                                </span>
                              ))}
                            </span>
                          ) : (
                            <span> - {store.totalCurrentStock || 0} / {store.totalMaxCapacity || 0} total stock</span>
                          )}
                        </li>
                      )
                    })}
                    {lowStockStores.length > 5 && (
                      <li className="text-sm">...and {lowStockStores.length - 5} more</li>
                    )}
                  </ul>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin/dark-stores')}
                  className="ml-4"
                >
                  Manage Dark Stores
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalOrders}</p>
              <p className="text-xs text-muted-foreground mt-2">All time orders</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-cyan-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-cyan-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Active Customers</p>
              <p className="text-3xl font-bold text-foreground">{stats.activeCustomers}</p>
              <p className="text-xs text-muted-foreground mt-2">Active accounts</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-green-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Revenue Today</p>
              <p className="text-3xl font-bold text-foreground">₹{stats.revenueToday.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">Today's earnings</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-purple-600" />
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">Online</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Active Partners</p>
              <p className="text-3xl font-bold text-foreground">{stats.activePartners}</p>
              <p className="text-xs text-muted-foreground mt-2">Delivery partners</p>
            </CardContent>
          </Card>
        </div>

        {/* Popup & Notification Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/admin/popups">
            <Card className="border-2 border-orange-100 hover:border-orange-200 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-orange-600" />
                  </div>
                  {popupStats.active > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      {popupStats.active} Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Popups</p>
                <p className="text-3xl font-bold text-foreground">{popupStats.total}</p>
                <p className="text-xs text-muted-foreground mt-2">{popupStats.active} currently active</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/notifications">
            <Card className="border-2 border-pink-100 hover:border-pink-200 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-6 h-6 text-pink-600" />
                  </div>
                  {notificationStats.unread > 0 && (
                    <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                      {notificationStats.unread} Unread
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-1">Total Notifications</p>
                <p className="text-3xl font-bold text-foreground">{notificationStats.total}</p>
                <p className="text-xs text-muted-foreground mt-2">{notificationStats.unread} unread</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-white border-2">
            <TabsTrigger value="orders" className="gap-2">
              <Package className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="partners" className="gap-2">
              <Truck className="w-4 h-4" />
              Delivery Partners
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-2xl">Recent Orders</CardTitle>
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search orders..." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingData ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No orders yet</p>
                    </div>
                  ) : (
                    orders
                      .filter((order: any) => {
                        if (!searchQuery) return true
                        const query = searchQuery.toLowerCase()
                        return (
                          order.order_number?.toLowerCase().includes(query) ||
                          order.customer?.name?.toLowerCase().includes(query) ||
                          order.address?.line1?.toLowerCase().includes(query)
                        )
                      })
                      .map((order: any) => {
                        const timeAgo = order.placedAt 
                          ? new Date(order.placedAt).toLocaleString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                          : 'N/A'
                        
                        return (
                          <Card key={order.id} className="border-2">
                            <CardContent className="p-4">
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <p className="font-bold text-foreground text-lg">{order.order_number || `#${order.id}`}</p>
                                      <p className="text-sm text-muted-foreground">{timeAgo}</p>
                                    </div>
                                    {getStatusBadge(order.orderStatus)}
                                  </div>
                                  
                                  <div className="grid sm:grid-cols-2 gap-3 mt-3">
                                    <div className="flex items-start gap-2">
                                      <Users className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground">{order.customer?.name || 'N/A'}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {order.address?.line1 || 'N/A'}, Floor {order.address?.floor || 0}, {order.address?.pincode || ''}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {order.deliveryPersonId && (
                                      <div className="flex items-start gap-2">
                                        <Truck className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0">
                                          <p className="text-sm font-medium text-foreground">Assigned</p>
                                          <p className="text-xs text-muted-foreground">Delivery Partner</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 lg:flex-col lg:items-end">
                                  <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Amount</p>
                                    <p className="text-xl font-bold text-foreground">₹{(Number(order.finalTotalCents) / 100).toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">{order.qty} items</p>
                                    {Number(order.floorChargeCents) > 0 && (
                                      <p className="text-xs text-blue-600 mt-1">
                                        Floor: ₹{(Number(order.floorChargeCents) / 100).toFixed(2)}
                                        {Number(order.floorChargeWaivedCents || 0) > 0 && (
                                          <span className="text-green-600 ml-1">
                                            (Waived: ₹{(Number(order.floorChargeWaivedCents) / 100).toFixed(2)})
                                          </span>
                                        )}
                                      </p>
                                    )}
                                    {Number(order.deliveryPartnerCommissionCents || 0) > 0 && (
                                      <p className="text-xs text-orange-600 mt-1">
                                        Commission: ₹{(Number(order.deliveryPartnerCommissionCents) / 100).toFixed(2)}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedOrder(order)
                                      setShowOrderDialog(true)
                                    }}
                                    className="gap-2"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-2xl">Customer Management</CardTitle>
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search customers..." className="pl-10" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingData ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading customers...</p>
                    </div>
                  ) : customers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No customers yet</p>
                    </div>
                  ) : (
                    customers.map((customer: any) => (
                    <Card key={customer.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-bold text-foreground text-lg">{customer.name}</p>
                                  <p className="text-xs text-muted-foreground">{customer.id}</p>
                                </div>
                              </div>
                              
                              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <p className="text-sm text-foreground">{customer.phone}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <p className="text-sm text-foreground truncate">{customer.email}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-6 md:gap-8">
                            <div>
                              <p className="text-sm text-muted-foreground">Status</p>
                              <p className={`text-lg font-bold ${customer.isSuspended ? 'text-red-600' : customer.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                                {customer.isSuspended ? 'Suspended' : customer.isActive ? 'Active' : 'Inactive'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Joined</p>
                              <p className="text-lg font-bold text-foreground">
                                {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Partners Tab */}
          <TabsContent value="partners" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-2xl">Delivery Partners</CardTitle>
                  <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                    Add New Partner
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingData ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading partners...</p>
                    </div>
                  ) : partners.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No delivery partners yet</p>
                    </div>
                  ) : (
                    partners.map((partner: any) => (
                    <Card key={partner.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Truck className="w-6 h-6 text-green-600" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-bold text-foreground text-lg">{partner.name}</p>
                                  <p className="text-xs text-muted-foreground">{partner.id}</p>
                                </div>
                                <Badge 
                                  variant="secondary" 
                                  className={partner.status === 'active' 
                                    ? 'bg-green-100 text-green-700 border-green-200' 
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                  }
                                >
                                  {partner.status === 'active' ? 'Active' : 'Offline'}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-2">
                                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <p className="text-sm text-foreground">{partner.phone}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-6 md:gap-8">
                            <div>
                              <p className="text-sm text-muted-foreground">Status</p>
                              <p className={`text-lg font-bold ${partner.isSuspended ? 'text-red-600' : partner.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                                {partner.isSuspended ? 'Suspended' : partner.isActive ? 'Active' : 'Inactive'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Joined</p>
                              <p className="text-lg font-bold text-foreground">
                                {partner.createdAt ? new Date(partner.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order_number || `#${selectedOrder?.id}`}</DialogTitle>
            <DialogDescription>
              View and manage order details including floor charges
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Customer</Label>
                  <p className="font-semibold">{selectedOrder.customer?.name || selectedOrder.user?.name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer?.email || selectedOrder.user?.email || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer?.phone || selectedOrder.user?.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Delivery Address</Label>
                  <p className="font-semibold">{selectedOrder.address?.line1 || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">
                    Floor {selectedOrder.address?.floor || 0}, Pincode: {selectedOrder.address?.pincode || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Order Items</Label>
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{selectedOrder.product?.title || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {selectedOrder.qty}</p>
                    </div>
                    <p className="font-semibold">
                      ₹{((Number(selectedOrder.product?.priceCents || 0) / 100) * selectedOrder.qty).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Billing Breakdown */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Billing Breakdown</Label>
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">₹{(Number(selectedOrder.baseTotalCents) / 100).toFixed(2)}</span>
                  </div>
                  
                  {Number(selectedOrder.securityDepositCents || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Security Deposit</span>
                      <span className="font-semibold">₹{(Number(selectedOrder.securityDepositCents) / 100).toFixed(2)}</span>
                    </div>
                  )}

                  {Number(selectedOrder.floorChargeCents || 0) > 0 && (
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Floor Charge (Floor {selectedOrder.address?.floor || 0})</span>
                        <span className="font-semibold text-blue-600">₹{(Number(selectedOrder.floorChargeCents) / 100).toFixed(2)}</span>
                      </div>
                      {Number(selectedOrder.floorChargeWaivedCents || 0) > 0 && (
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-green-600">Floor Charge Waived (Discount)</span>
                          <span className="font-semibold text-green-600">-₹{(Number(selectedOrder.floorChargeWaivedCents) / 100).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(selectedOrder.floorChargeWaivedCents || 0) < Number(selectedOrder.floorChargeCents || 0) && (
                        <div className="mt-3 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const remainingCharge = (Number(selectedOrder.floorChargeCents) - Number(selectedOrder.floorChargeWaivedCents || 0)) / 100
                              if (!confirm(`Waive remaining floor charge of ₹${remainingCharge.toFixed(2)}? This will reduce the order total.`)) {
                                return
                              }
                              setWaivingFloorCharge(true)
                              try {
                                const response = await fetch(`/api/orders/${selectedOrder.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    floorChargeWaivedCents: Number(selectedOrder.floorChargeCents),
                                    updatedBy: user?.id,
                                  }),
                                })
                                if (response.ok) {
                                  const data = await response.json()
                                  setSelectedOrder(data.order)
                                  // Refresh orders list
                                  fetchDashboardData()
                                  alert('Floor charge waived successfully!')
                                } else {
                                  const error = await response.json()
                                  alert(error.error || 'Failed to waive floor charge')
                                }
                              } catch (error) {
                                console.error('Error waiving floor charge:', error)
                                alert('Failed to waive floor charge')
                              } finally {
                                setWaivingFloorCharge(false)
                              }
                            }}
                            disabled={waivingFloorCharge}
                            className="w-full gap-2"
                          >
                            <X className="w-4 h-4" />
                            {waivingFloorCharge ? 'Waiving...' : `Waive Remaining Floor Charge (₹${((Number(selectedOrder.floorChargeCents) - Number(selectedOrder.floorChargeWaivedCents || 0)) / 100).toFixed(2)})`}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {Number(selectedOrder.discountCents || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-semibold text-green-600">-₹{(Number(selectedOrder.discountCents) / 100).toFixed(2)}</span>
                    </div>
                  )}

                  {Number(selectedOrder.deliveryPartnerCommissionCents || 0) > 0 && (
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery Partner Commission</span>
                        <span className="font-semibold text-orange-600">₹{(Number(selectedOrder.deliveryPartnerCommissionCents) / 100).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Commission paid to delivery partner: ₹{selectedOrder.deliveryPartnerCommissionCents ? (Number(selectedOrder.deliveryPartnerCommissionCents) / 100 / selectedOrder.qty).toFixed(2) : '0.00'} per 20L jar (₹{selectedOrder.deliveryPartnerCommissionCents ? (Number(selectedOrder.deliveryPartnerCommissionCents) / 100).toFixed(2) : '0.00'} total for {selectedOrder.qty} jar{selectedOrder.qty > 1 ? 's' : ''})
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-2 mt-2 flex justify-between">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-lg">₹{(Number(selectedOrder.finalTotalCents) / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Payment Information</Label>
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-semibold">{selectedOrder.paymentMethod?.toUpperCase() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Status</span>
                    <Badge variant={selectedOrder.paymentStatus === 'paid' || selectedOrder.paymentStatus === 'verified' ? 'default' : 'secondary'}>
                      {selectedOrder.paymentStatus || 'N/A'}
                    </Badge>
                  </div>
                  {selectedOrder.utrNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">UTR Number</span>
                      <span className="font-semibold">{selectedOrder.utrNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
