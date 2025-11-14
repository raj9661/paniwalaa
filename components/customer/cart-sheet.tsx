'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Minus, Plus, Trash2, ShoppingCart, MapPin, Plus as PlusIcon } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type CartItem = {
  product: {
    id: string
    title: string
    description: string | null
    priceCents: number | string
    imageUrl: string | null
    productType: string
    isOneTimePurchase?: boolean
    securityDepositCents?: string | null
  }
  quantity: number
}

type CartSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: CartItem[]
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  cartTotal: number
}

export function CartSheet({
  open,
  onOpenChange,
  cart,
  updateQuantity,
  clearCart,
  cartTotal,
}: CartSheetProps) {
  const router = useRouter()
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddress, setSelectedAddress] = useState('')
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [newAddress, setNewAddress] = useState({
    label: '',
    address_line: '',
    landmark: '',
    area: 'Laxmi Nagar',
    city: 'Delhi',
    pincode: '',
  })
  const [pincodeError, setPincodeError] = useState('')
  const [checkingPincode, setCheckingPincode] = useState(false)
  const deliveryFee = 0

  // Load addresses from localStorage
  useEffect(() => {
    const storedAddresses = localStorage.getItem('customer_addresses')
    if (storedAddresses) {
      const parsed = JSON.parse(storedAddresses)
      setAddresses(parsed)
      if (parsed.length > 0) {
        const defaultAddress = parsed.find((a: any) => a.is_default) || parsed[0]
        setSelectedAddress(defaultAddress.id)
      }
    } else {
      // No addresses found
    }
  }, [])

  const handleCheckout = () => {
    if (cart.length === 0) return
    
    const selectedAddr = addresses.find(a => a.id === selectedAddress)
    if (!selectedAddr) {
      alert('Please select a delivery address')
      return
    }
    
    // Store order in localStorage for the checkout page
    localStorage.setItem('checkout_cart', JSON.stringify({
      cart,
      address: selectedAddr,
      total: cartTotal + deliveryFee
    }))
    
    router.push('/customer/checkout')
    onOpenChange(false)
  }

  const checkPincode = async (pincode: string) => {
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      setPincodeError('Please enter a valid 6-digit pincode')
      return false
    }

    setCheckingPincode(true)
    setPincodeError('')

    try {
      const response = await fetch('/api/deliverable-pincodes/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode }),
      })

      const data = await response.json()

      if (!data.deliverable) {
        setPincodeError(data.message || 'We do not deliver to this pincode.')
        setCheckingPincode(false)
        return false
      }

      setPincodeError('')
      setCheckingPincode(false)
      return true
    } catch (error) {
      console.error('Error checking pincode:', error)
      setPincodeError('Unable to verify pincode. Please try again.')
      setCheckingPincode(false)
      return false
    }
  }

  const handleSaveAddress = async () => {
    const isDeliverable = await checkPincode(newAddress.pincode)
    if (!isDeliverable) {
      return
    }

    const addressToSave = {
      id: Date.now().toString(),
      ...newAddress,
      is_default: addresses.length === 0,
    }

    const updated = [...addresses, addressToSave]
    setAddresses(updated)
    localStorage.setItem('customer_addresses', JSON.stringify(updated))
    setSelectedAddress(addressToSave.id)

    setShowAddressDialog(false)
    setNewAddress({
      label: '',
      address_line: '',
      landmark: '',
      area: 'Laxmi Nagar',
      city: 'Delhi',
      pincode: '',
    })
    setPincodeError('')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Your Cart ({cart.length} items)
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mb-6">Add some water jars to get started</p>
            <Button onClick={() => onOpenChange(false)}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-4 p-4 border rounded-lg">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <img
                      src={item.product.imageUrl || "/placeholder.svg"}
                      alt={item.product.title}
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate">{item.product.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.product.productType}</p>
                    <p className="text-lg font-bold text-foreground mt-1">₹{(Number(item.product.priceCents) / 100).toFixed(2)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.product.id, 0)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Delivery Address</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddressDialog(true)}
                    className="h-7 px-2 text-xs gap-1"
                  >
                    <PlusIcon className="w-3 h-3" />
                    Add
                  </Button>
                </div>
                <Select value={selectedAddress} onValueChange={setSelectedAddress}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.map((address) => (
                      <SelectItem key={address.id} value={address.id}>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">{address.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {address.address_line}, {address.area}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">
                    ₹{cart.reduce((sum, item) => sum + (Number(item.product.priceCents) / 100) * item.quantity, 0).toFixed(2)}
                  </span>
                </div>
                {cart.map((item) => {
                  const securityDeposit = item.product.securityDepositCents && !item.product.isOneTimePurchase
                    ? (Number(item.product.securityDepositCents) / 100) * item.quantity
                    : 0
                  return securityDeposit > 0 ? (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Security Deposit ({item.product.title})</span>
                      <span className="font-semibold">₹{securityDeposit.toFixed(2)}</span>
                    </div>
                  ) : null
                })}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>₹{(cartTotal + deliveryFee).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 py-6"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearCart}
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>

      {/* Add Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="label">Address Label</Label>
              <Input
                id="label"
                placeholder="e.g., Home, Work"
                value={newAddress.label}
                onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address_line">Address Line</Label>
              <Input
                id="address_line"
                placeholder="Flat/House No., Building"
                value={newAddress.address_line}
                onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="landmark">Landmark (Optional)</Label>
              <Input
                id="landmark"
                placeholder="Nearby landmark"
                value={newAddress.landmark}
                onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  value={newAddress.area}
                  onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  placeholder="110092"
                  value={newAddress.pincode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setNewAddress({ ...newAddress, pincode: value })
                    setPincodeError('')
                  }}
                  onBlur={() => {
                    if (newAddress.pincode && newAddress.pincode.length === 6) {
                      checkPincode(newAddress.pincode)
                    }
                  }}
                  className={pincodeError ? 'border-red-500' : ''}
                />
                {pincodeError && (
                  <p className="text-xs text-red-600 mt-1">{pincodeError}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
              />
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={handleSaveAddress}
                disabled={!newAddress.label || !newAddress.address_line || !newAddress.pincode || checkingPincode || !!pincodeError}
              >
                Save
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddressDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
