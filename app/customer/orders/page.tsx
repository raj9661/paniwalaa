'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer/customer-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, Clock, CheckCircle, XCircle, Truck, MapPin } from 'lucide-react'

type Order = {
  id: string
  order_number: string
  items: Array<{ product: any; quantity: number }>
  address: any
  total: number
  payment_method: string
  special_instructions: string
  status: string
  created_at: string
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  assigned: { label: 'Assigned', icon: Truck, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  picked_up: { label: 'Picked Up', icon: Package, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  out_for_delivery: { label: 'Out for Delivery', icon: Truck, color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
}

export default function OrdersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    if (!loading && (!user || user.role !== 'customer')) {
      router.push('/login')
      return
    }

    // Load orders from localStorage
    const storedOrders = localStorage.getItem('customer_orders')
    if (storedOrders) {
      setOrders(JSON.parse(storedOrders))
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader cartItemCount={0} onCartClick={() => {}} />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader cartItemCount={0} onCartClick={() => {}} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your water delivery orders</p>
        </div>

        {orders.length === 0 ? (
          <Card className="border-2">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6">Start ordering water to see your order history</p>
              <Button
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                onClick={() => router.push('/customer')}
              >
                Order Now
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status as keyof typeof statusConfig]
              const StatusIcon = status.icon
              
              return (
                <Card key={order.id} className="border-2 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Order #{order.order_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Badge className={status.color}>
                        <StatusIcon className="w-4 h-4 mr-1" />
                        {status.label}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Items */}
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-3">Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <img
                                  src={item.product.image_url || '/placeholder.svg'}
                                  alt={item.product.name}
                                  className="w-10 h-10 object-contain"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {item.product.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Qty: {item.quantity} × ₹{item.product.price}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Address */}
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Delivery Address
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="font-medium text-sm text-foreground">{order.address.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {order.address.address_line}, {order.address.area}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.address.city} - {order.address.pincode}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-2xl font-bold text-foreground">₹{order.total.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Payment</p>
                        <p className="text-sm font-semibold text-foreground capitalize">
                          {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
