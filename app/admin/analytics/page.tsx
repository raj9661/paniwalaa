'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Droplet, ArrowLeft, TrendingUp, TrendingDown, Users, Package, IndianRupee, Truck, Calendar, BarChart3, DollarSign, Wallet, Minus, Filter } from 'lucide-react'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import Link from 'next/link'

type DateRange = {
  from: Date | null
  to: Date | null
}

export default function AnalyticsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [dateRange, setDateRange] = useState<DateRange>({
    from: (() => {
      const date = new Date()
      date.setDate(date.getDate() - 30)
      return date
    })(),
    to: new Date(),
  })
  const [dateFilter, setDateFilter] = useState<string>('30days')
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    totalDiscounts: 0,
    totalPartnerPayments: 0,
    profit: 0,
    totalOrders: 0,
    newCustomers: 0,
    avgDeliveryTime: 0,
    dailyOrders: [] as Array<{ day: string; count: number }>,
    orderStatusDistribution: {
      delivered: 0,
      inProgress: 0,
      pending: 0,
      cancelled: 0,
    },
    todayRevenue: 0,
    avgOrderValue: 0,
    peakHours: '',
    totalCustomers: 0,
    repeatCustomers: 0,
    repeatCustomersCount: 0,
    avgWalletBalance: 0,
    totalWalletBalance: 0,
    totalPartners: 0,
    activePartners: 0,
    partnerPayments: [] as Array<{ partnerId: string; partnerName: string; totalPaid: number; orderCount: number }>,
    loading: true,
  })

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchAnalyticsData()
    }
  }, [user, dateRange])

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    
    let fromDate = new Date()
    
    switch (value) {
      case '7days':
        fromDate.setDate(today.getDate() - 7)
        break
      case '30days':
        fromDate.setDate(today.getDate() - 30)
        break
      case '3months':
        fromDate.setMonth(today.getMonth() - 3)
        break
      case '6months':
        fromDate.setMonth(today.getMonth() - 6)
        break
      case '1year':
        fromDate.setFullYear(today.getFullYear() - 1)
        break
      case 'custom':
        // Keep current date range for custom
        return
      default:
        fromDate.setDate(today.getDate() - 30)
    }
    
    fromDate.setHours(0, 0, 0, 0) // Start of day
    setDateRange({ from: fromDate, to: today })
  }

  const fetchAnalyticsData = async () => {
    if (!dateRange.from || !dateRange.to) return
    
    try {
      setAnalyticsData(prev => ({ ...prev, loading: true }))
      
      // Fetch all orders
      const ordersResponse = await fetch('/api/orders?limit=10000')
      const ordersData = await ordersResponse.json()
      const orders = ordersData.orders || []

      // Filter orders by date range
      const fromDate = new Date(dateRange.from)
      fromDate.setHours(0, 0, 0, 0)
      const toDate = new Date(dateRange.to)
      toDate.setHours(23, 59, 59, 999)
      
      const recentOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.placedAt)
        return orderDate >= fromDate && orderDate <= toDate
      })

      const deliveredOrders = recentOrders.filter((o: any) => o.orderStatus === 'delivered')
      
      // Calculate total orders
      const totalOrders = recentOrders.length

      // Calculate new customers in date range
      const usersResponse = await fetch('/api/users')
      const usersData = await usersResponse.json()
      const allUsers = usersData.users || []
      const newCustomers = allUsers.filter((u: any) => {
        if (u.role !== 'customer') return false
        const createdAt = new Date(u.createdAt)
        return createdAt >= fromDate && createdAt <= toDate
      }).length

      // Calculate average delivery time
      const deliveryTimes = deliveredOrders
        .filter((o: any) => o.deliveredAt && o.placedAt)
        .map((o: any) => {
          const placed = new Date(o.placedAt).getTime()
          const delivered = new Date(o.deliveredAt).getTime()
          return (delivered - placed) / (1000 * 60) // Convert to minutes
        })
      const avgDeliveryTime = deliveryTimes.length > 0
        ? Math.round(deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length)
        : 0

      // Calculate daily orders
      const dailyOrdersMap = new Map<string, number>()
      recentOrders.forEach((order: any) => {
        const orderDate = new Date(order.placedAt)
        const dayKey = format(orderDate, 'EEE') // Mon, Tue, etc.
        dailyOrdersMap.set(dayKey, (dailyOrdersMap.get(dayKey) || 0) + 1)
      })
      const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const dailyOrders = dayOrder.map(day => ({
        day,
        count: dailyOrdersMap.get(day) || 0,
      }))

      // Calculate order status distribution
      const orderStatusDistribution = {
        delivered: recentOrders.filter((o: any) => o.orderStatus === 'delivered').length,
        inProgress: recentOrders.filter((o: any) => o.orderStatus === 'assigned' || o.orderStatus === 'in_progress').length,
        pending: recentOrders.filter((o: any) => o.orderStatus === 'created' || o.orderStatus === 'pending').length,
        cancelled: recentOrders.filter((o: any) => o.orderStatus === 'cancelled').length,
      }

      // Calculate today's revenue
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)
      const todayOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.placedAt)
        return orderDate >= today && orderDate <= todayEnd && 
               (order.paymentStatus === 'verified' || order.paymentMethod === 'cod')
      })
      const todayRevenue = todayOrders.reduce((sum: number, order: any) => {
        return sum + (parseInt(order.finalTotalCents) || 0)
      }, 0) / 100

      // Calculate average order value
      const avgOrderValue = deliveredOrders.length > 0
        ? deliveredOrders.reduce((sum: number, order: any) => {
            return sum + (parseInt(order.finalTotalCents) || 0)
          }, 0) / deliveredOrders.length / 100
        : 0

      // Calculate peak hours
      const hourCounts = new Map<number, number>()
      recentOrders.forEach((order: any) => {
        const orderDate = new Date(order.placedAt)
        const hour = orderDate.getHours()
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
      })
      let maxCount = 0
      let peakHourStart = 0
      for (let h = 0; h < 24; h++) {
        const count = hourCounts.get(h) || 0
        if (count > maxCount) {
          maxCount = count
          peakHourStart = h
        }
      }
      const peakHours = maxCount > 0 ? `${peakHourStart}-${peakHourStart + 3} ${peakHourStart >= 12 ? 'PM' : 'AM'}` : 'N/A'

      // Calculate customer metrics
      const customers = allUsers.filter((u: any) => u.role === 'customer')
      const totalCustomers = customers.length
      
      // Calculate repeat customers (customers with more than 1 order)
      const customerOrderCounts = new Map<string, number>()
      recentOrders.forEach((order: any) => {
        const userId = order.userId
        customerOrderCounts.set(userId, (customerOrderCounts.get(userId) || 0) + 1)
      })
      const repeatCustomersCount = Array.from(customerOrderCounts.values()).filter(count => count > 1).length
      const repeatCustomers = totalCustomers > 0 ? Math.round((repeatCustomersCount / totalCustomers) * 100) : 0

      // Calculate wallet metrics - fetch wallets for all customers
      let totalWalletBalance = 0
      let walletCount = 0
      for (const customer of customers) {
        try {
          const walletRes = await fetch(`/api/wallet?userId=${customer.id}`)
          if (walletRes.ok) {
            const walletData = await walletRes.json()
            if (walletData.wallet) {
              totalWalletBalance += walletData.wallet.balance || 0
              walletCount++
            }
          }
        } catch (e) {
          // Skip if wallet fetch fails
        }
      }
      const avgWalletBalance = walletCount > 0 ? totalWalletBalance / walletCount : 0

      // Calculate partner metrics
      const partners = allUsers.filter((u: any) => u.role === 'delivery_partner')
      const totalPartners = partners.length
      const activePartners = partners.filter((p: any) => p.isActive && !p.isSuspended).length

      // Calculate total revenue (only from delivered orders with verified payments)
      const totalRevenue = deliveredOrders
        .filter((o: any) => o.paymentStatus === 'verified' || o.paymentMethod === 'cod')
        .reduce((sum: number, order: any) => {
          return sum + (parseInt(order.finalTotalCents) || 0)
        }, 0) / 100

      // Calculate total discounts
      const totalDiscounts = deliveredOrders.reduce((sum: number, order: any) => {
        return sum + (parseInt(order.discountCents) || 0)
      }, 0) / 100

      // Calculate partner payments using actual commission from orders
      const totalPartnerPayments = deliveredOrders
        .filter((o: any) => o.deliveryPersonId)
        .reduce((sum: number, order: any) => {
          const commission = parseInt(order.deliveryPartnerCommissionCents) || 0
          return sum + commission
        }, 0) / 100

      // Calculate profit
      const profit = totalRevenue - totalDiscounts - totalPartnerPayments

      // Calculate partner-wise payments
      const partnerPaymentsMap = new Map<string, { partnerName: string; totalPaid: number; orderCount: number }>()
      
      deliveredOrders
        .filter((o: any) => o.deliveryPersonId)
        .forEach((order: any) => {
          const partnerId = order.deliveryPersonId
          const commission = (parseInt(order.deliveryPartnerCommissionCents) || 0) / 100
          
          if (!partnerPaymentsMap.has(partnerId)) {
            partnerPaymentsMap.set(partnerId, {
              partnerName: `Partner ${partnerId}`,
              totalPaid: 0,
              orderCount: 0,
            })
          }
          
          const partnerData = partnerPaymentsMap.get(partnerId)!
          partnerData.totalPaid += commission
          partnerData.orderCount += 1
        })

      // Fetch partner names
      partners.forEach((partner: any) => {
        if (partnerPaymentsMap.has(partner.id)) {
          const partnerData = partnerPaymentsMap.get(partner.id)!
          partnerData.partnerName = partner.name || `Partner ${partner.id}`
        }
      })

      const partnerPayments = Array.from(partnerPaymentsMap.entries()).map(([partnerId, data]) => ({
        partnerId,
        ...data,
      }))

      setAnalyticsData({
        totalRevenue,
        totalDiscounts,
        totalPartnerPayments,
        profit,
        totalOrders,
        newCustomers,
        avgDeliveryTime,
        dailyOrders,
        orderStatusDistribution,
        todayRevenue,
        avgOrderValue,
        peakHours,
        totalCustomers,
        repeatCustomers,
        repeatCustomersCount,
        avgWalletBalance,
        totalWalletBalance,
        totalPartners,
        activePartners,
        partnerPayments,
        loading: false,
      })
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setAnalyticsData(prev => ({ ...prev, loading: false }))
    }
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
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
                <p className="text-xs text-muted-foreground">Business insights & metrics</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Analytics' }]} className="mb-6" />
        
        {/* Date Filter */}
        <Card className="mb-6 border-2">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Date Range:</span>
              </div>
              
              <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last 1 Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {dateFilter === 'custom' && (
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, 'PPP') : 'From date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.from || undefined}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, from: date || null }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <span className="text-muted-foreground">to</span>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, 'PPP') : 'To date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.to || undefined}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, to: date || null }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="ml-auto text-sm text-muted-foreground">
                {dateRange.from && dateRange.to && (
                  <span>
                    {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
            <TabsTrigger value="partner-payments">Paid to Partners</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-semibold">+12%</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{analyticsData.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {dateRange.from && dateRange.to 
                      ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                      : 'Select date range'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-cyan-600" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground">
                    {analyticsData.totalOrders.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {dateRange.from && dateRange.to 
                      ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                      : 'Select date range'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">New Customers</p>
                  <p className="text-2xl font-bold text-foreground">
                    {analyticsData.newCustomers.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {dateRange.from && dateRange.to 
                      ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                      : 'Select date range'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Truck className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Avg Delivery Time</p>
                  <p className="text-2xl font-bold text-foreground">
                    {analyticsData.avgDeliveryTime > 0 ? `${analyticsData.avgDeliveryTime}m` : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Target: 30 minutes</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Daily Orders
                      {dateRange.from && dateRange.to && (
                        <span className="text-sm font-normal text-muted-foreground">
                          ({format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')})
                        </span>
                      )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.dailyOrders.length > 0 ? (
                      (() => {
                        const maxOrders = Math.max(...analyticsData.dailyOrders.map(d => d.count), 1)
                        return analyticsData.dailyOrders.map(({ day, count }) => {
                          const percentage = (count / maxOrders) * 100
                          return (
                            <div key={day}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-foreground">{day}</span>
                                <span className="text-sm font-bold text-foreground">{count}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          )
                        })
                      })()
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No orders in selected date range</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Order Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      const statusData = [
                        { status: 'Delivered', count: analyticsData.orderStatusDistribution.delivered, color: 'from-green-500 to-emerald-500' },
                        { status: 'In Progress', count: analyticsData.orderStatusDistribution.inProgress, color: 'from-blue-500 to-cyan-500' },
                        { status: 'Pending', count: analyticsData.orderStatusDistribution.pending, color: 'from-yellow-500 to-orange-500' },
                        { status: 'Cancelled', count: analyticsData.orderStatusDistribution.cancelled, color: 'from-red-500 to-pink-500' },
                      ]
                      const total = analyticsData.totalOrders || 1
                      
                      return statusData.map((item) => {
                        const percentage = (item.count / total) * 100
                        return (
                          <div key={item.status}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-foreground">{item.status}</span>
                              <span className="text-sm font-bold text-foreground">
                                {item.count} ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`bg-gradient-to-r ${item.color} h-2 rounded-full transition-all`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Today's Revenue</p>
                  <p className="text-3xl font-bold text-foreground mb-2">
                    ₹{analyticsData.todayRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Avg Order Value</p>
                  <p className="text-3xl font-bold text-foreground mb-2">
                    ₹{analyticsData.avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Peak Hours</p>
                  <p className="text-3xl font-bold text-foreground mb-2">{analyticsData.peakHours}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Total Customers</p>
                  <p className="text-3xl font-bold text-foreground mb-2">
                    {analyticsData.totalCustomers.toLocaleString('en-IN')}
                  </p>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">+{analyticsData.newCustomers} in period</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Repeat Customers</p>
                  <p className="text-3xl font-bold text-foreground mb-2">{analyticsData.repeatCustomers}%</p>
                  <p className="text-sm text-muted-foreground">{analyticsData.repeatCustomersCount} customers</p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Avg Wallet Balance</p>
                  <p className="text-3xl font-bold text-foreground mb-2">
                    ₹{analyticsData.avgWalletBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total: ₹{analyticsData.totalWalletBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="partners" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Total Partners</p>
                  <p className="text-3xl font-bold text-foreground mb-2">
                    {analyticsData.totalPartners.toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-muted-foreground">{analyticsData.activePartners} active now</p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Total Deliveries</p>
                  <p className="text-3xl font-bold text-foreground mb-2">
                    {analyticsData.orderStatusDistribution.delivered.toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed deliveries</p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Total Earnings</p>
                  <p className="text-3xl font-bold text-foreground mb-2">
                    ₹{analyticsData.totalPartnerPayments.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground">Partner payments</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profit-loss" className="space-y-6">
            {analyticsData.loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading profit & loss data...</p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                      <p className="text-2xl font-bold text-foreground">
                        ₹{analyticsData.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {dateRange.from && dateRange.to 
                          ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                          : 'Select date range'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Minus className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex items-center gap-1 text-orange-600">
                          <TrendingDown className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Total Discounts</p>
                      <p className="text-2xl font-bold text-foreground">
                        ₹{analyticsData.totalDiscounts.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {dateRange.from && dateRange.to 
                          ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                          : 'Select date range'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex items-center gap-1 text-blue-600">
                          <TrendingDown className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Partner Payments</p>
                      <p className="text-2xl font-bold text-foreground">
                        ₹{analyticsData.totalPartnerPayments.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {dateRange.from && dateRange.to 
                          ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                          : 'Select date range'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className={`border-2 ${analyticsData.profit >= 0 ? 'border-green-200' : 'border-red-200'}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${analyticsData.profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                          <BarChart3 className={`w-5 h-5 ${analyticsData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        </div>
                        <div className={`flex items-center gap-1 ${analyticsData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {analyticsData.profit >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
                      <p className={`text-2xl font-bold ${analyticsData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{analyticsData.profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {dateRange.from && dateRange.to 
                          ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                          : 'Select date range'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>
                      Profit & Loss Breakdown
                      {dateRange.from && dateRange.to && (
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')})
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-foreground">Total Revenue</p>
                          <p className="text-sm text-muted-foreground">From all delivered orders</p>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                          +₹{analyticsData.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-foreground">Total Discounts</p>
                          <p className="text-sm text-muted-foreground">Promo codes & offers</p>
                        </div>
                        <p className="text-xl font-bold text-orange-600">
                          -₹{analyticsData.totalDiscounts.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-foreground">Partner Payments</p>
                          <p className="text-sm text-muted-foreground">Commission per 20L jar delivered</p>
                        </div>
                        <p className="text-xl font-bold text-blue-600">
                          -₹{analyticsData.totalPartnerPayments.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="border-t-2 pt-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-bold text-lg text-foreground">Net Profit</p>
                            <p className="text-sm text-muted-foreground">Revenue - Discounts - Partner Payments</p>
                          </div>
                          <p className={`text-2xl font-bold ${analyticsData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {analyticsData.profit >= 0 ? '+' : ''}₹{analyticsData.profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="partner-payments" className="space-y-6">
            {analyticsData.loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading partner payments data...</p>
              </div>
            ) : (
              <>
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5" />
                      Total Paid to Partners
                      {dateRange.from && dateRange.to && (
                        <span className="text-sm font-normal text-muted-foreground">
                          ({format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')})
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        ₹{analyticsData.totalPartnerPayments.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Based on commission per 20L jar delivered
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Partner-wise Payment Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analyticsData.partnerPayments.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No partner payments in the selected date range</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {analyticsData.partnerPayments
                          .sort((a, b) => b.totalPaid - a.totalPaid)
                          .map((partner) => (
                            <div key={partner.partnerId} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex-1">
                                <p className="font-semibold text-foreground">{partner.partnerName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {partner.orderCount} {partner.orderCount === 1 ? 'delivery' : 'deliveries'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-foreground">
                                  ₹{partner.totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Avg: ₹{(partner.totalPaid / partner.orderCount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
