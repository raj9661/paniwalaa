'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer/customer-header'
import { ProductGrid } from '@/components/customer/product-grid'
import { CartSheet } from '@/components/customer/cart-sheet'
import { Footer } from '@/components/footer'
export type CartItem = {
  product: {
    id: string
    title: string
    description: string | null
    priceCents: number
    imageUrl: string | null
    productType: string
    isOneTimePurchase?: boolean
    securityDepositCents?: string | null
  }
  quantity: number
}

export default function CustomerPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [products, setProducts] = useState<CartItem['product'][]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'customer')) {
      router.push('/login')
      return
    }

    if (user) {
      fetchProducts()
    }
  }, [user, loading, router])

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const response = await fetch('/api/products')
      const data = await response.json()
      
      if (response.ok) {
        setProducts(data.products || [])
      }
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoadingProducts(false)
    }
  }

  const addToCart = (product: CartItem['product']) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    setCartOpen(true)
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId))
    } else {
      setCart(prev =>
        prev.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      )
    }
  }

  const clearCart = () => {
    setCart([])
  }

  const cartTotal = cart.reduce((sum, item) => {
    const price = (Number(item.product.priceCents) / 100) * item.quantity
    // Add security deposit only if product is not one-time purchase
    const securityDeposit = item.product.securityDepositCents && !item.product.isOneTimePurchase
      ? (Number(item.product.securityDepositCents) / 100) * item.quantity
      : 0
    return sum + price + securityDeposit
  }, 0)

  if (loading || loadingProducts) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader 
        cartItemCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setCartOpen(true)}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Order Water</h1>
          <p className="text-muted-foreground">Choose from our premium selection of 20L water jars</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products available at the moment</p>
          </div>
        ) : (
          <ProductGrid products={products} onAddToCart={addToCart} />
        )}
      </main>

      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        cart={cart}
        updateQuantity={updateQuantity}
        clearCart={clearCart}
        cartTotal={cartTotal}
      />
      
      <Footer />
    </div>
  )
}
