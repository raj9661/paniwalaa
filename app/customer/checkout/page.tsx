'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer/customer-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, Wallet, CreditCard, Banknote, CheckCircle2, ArrowLeft, Tag, X, Plus, QrCode } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type CheckoutData = {
  cart: Array<{ product: any; quantity: number }>
  address: any
  total: number
}

export default function CheckoutPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoCodeError, setPromoCodeError] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string
    discountCents: number
    discountAmount: number
  } | null>(null)
  const [validatingPromo, setValidatingPromo] = useState(false)
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showAddressDialog, setShowAddressDialog] = useState(false)
  const [newAddress, setNewAddress] = useState({
    label: '',
    address_line: '',
    landmark: '',
    area: 'Laxmi Nagar',
    city: 'Delhi',
    pincode: '',
    floor: 0,
  })
  const [pincodeError, setPincodeError] = useState('')
  const [checkingPincode, setCheckingPincode] = useState(false)
  const [utrNumber, setUtrNumber] = useState('')
  const [upiId, setUpiId] = useState('')
  const [floorNumber, setFloorNumber] = useState<number>(0)
  const [siteSettings, setSiteSettings] = useState<any>(null)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'customer')) {
      router.push('/login')
      return
    }

    const data = localStorage.getItem('checkout_cart')
    if (data) {
      setCheckoutData(JSON.parse(data))
    } else {
      router.push('/customer')
    }

    // Load addresses from localStorage
    const storedAddresses = localStorage.getItem('customer_addresses')
    if (storedAddresses) {
      const parsedAddresses = JSON.parse(storedAddresses)
      setAddresses(parsedAddresses)
      if (parsedAddresses.length > 0) {
        const defaultAddress = parsedAddresses.find((a: any) => a.is_default) || parsedAddresses[0]
        setSelectedAddressId(defaultAddress.id)
        // Update checkout data with selected address
        if (data) {
          const checkout = JSON.parse(data)
          checkout.address = defaultAddress
          setCheckoutData(checkout)
          localStorage.setItem('checkout_cart', JSON.stringify(checkout))
        }
      }
    }

    // Fetch site settings (UPI ID and floor charge settings)
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        const settings = data.settings || data
        if (settings.upiId) {
          setUpiId(settings.upiId)
        }
        setSiteSettings(settings)
      })
      .catch(err => console.error('Error fetching site settings:', err))
  }, [user, loading, router])

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoCodeError('Please enter a promo code')
      return
    }

    if (!checkoutData) return

    setValidatingPromo(true)
    setPromoCodeError('')

    try {
      const orderAmountCents = Math.round(checkoutData.total * 100)
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode.trim(),
          orderAmountCents,
          userId: user?.id,
          role: user?.role,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setAppliedPromo({
          code: data.promoCode.code,
          discountCents: data.discountCents,
          discountAmount: data.discountAmount,
        })
        setPromoCodeError('')
      } else {
        setPromoCodeError(data.error || 'Invalid promo code')
        setAppliedPromo(null)
      }
    } catch (error) {
      console.error('Error validating promo code:', error)
      setPromoCodeError('Failed to validate promo code')
      setAppliedPromo(null)
    } finally {
      setValidatingPromo(false)
    }
  }

  const handleRemovePromoCode = () => {
    setPromoCode('')
    setAppliedPromo(null)
    setPromoCodeError('')
  }

  const handlePlaceOrder = async () => {
    if (!checkoutData || !user) return

    if (paymentMethod === 'upi' && !utrNumber.trim()) {
      return
    }

    setIsPlacingOrder(true)

    try {
      const selectedAddress = addresses.find(a => a.id === selectedAddressId) || checkoutData.address
      const discount = appliedPromo ? appliedPromo.discountAmount : 0
      const totalWithFloorCharge = checkoutData.total + floorCharge
      const finalTotal = Math.max(0, totalWithFloorCharge - discount)

      // For now, we'll use the first product in cart
      // In a real app, you'd handle multiple products differently
      const firstItem = checkoutData.cart[0]
      if (!firstItem) {
        throw new Error('Cart is empty')
      }

      // Calculate security deposit (only if product is not one-time purchase)
      const securityDepositCents = firstItem.product.isOneTimePurchase || !firstItem.product.securityDepositCents
        ? null
        : Math.round((Number(firstItem.product.securityDepositCents) / 100) * firstItem.quantity * 100)

      const orderData = {
        userId: user.id,
        addressId: selectedAddress.id, // This should be a database address ID
        productId: firstItem.product.id,
        qty: firstItem.quantity,
        securityDepositCents: securityDepositCents,
        floorChargeCents: Math.round(floorCharge * 100), // Floor charge in paise
        baseTotalCents: Math.round(checkoutData.total * 100),
        discountCents: appliedPromo ? Math.round(discount * 100) : null,
        finalTotalCents: Math.round(finalTotal * 100),
        promoCodeId: appliedPromo ? null : null, // You'd need to get this from the promo code
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'unverified',
        utrNumber: paymentMethod === 'upi' ? utrNumber.trim() : null,
        specialInstructions: specialInstructions || null,
      }

      // Store order in localStorage for now (you'd call API in production)
      const newOrderNumber = `PN${Date.now().toString().slice(-8)}`
      setOrderNumber(newOrderNumber)
      
      const orders = JSON.parse(localStorage.getItem('customer_orders') || '[]')
      orders.unshift({
        id: Date.now().toString(),
        order_number: newOrderNumber,
        items: checkoutData.cart,
        address: selectedAddress,
        total: checkoutData.total,
        discount: discount,
        finalTotal: finalTotal,
        promoCode: appliedPromo?.code || null,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'unverified',
        utr_number: paymentMethod === 'upi' ? utrNumber.trim() : null,
        special_instructions: specialInstructions,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      localStorage.setItem('customer_orders', JSON.stringify(orders))
      localStorage.removeItem('checkout_cart')
      
      setOrderPlaced(true)
      setIsPlacingOrder(false)
      
      // Redirect to orders page after 3 seconds
      setTimeout(() => {
        router.push('/customer/orders')
      }, 3000)
    } catch (error) {
      console.error('Error placing order:', error)
      setIsPlacingOrder(false)
    }
  }

  // Check if cart contains 20L products
  const has20LProduct = checkoutData?.cart.some(item => item.product.productType === '20L_jar') || false

  // Get floor charge settings
  const floorChargeEnabled = siteSettings?.floorChargeEnabled !== false // Default to true
  const chargePerFloor = siteSettings?.floorChargePerFloorCents ? (siteSettings.floorChargePerFloorCents / 100) : 5 // Default ₹5

  // Calculate floor charge (only if enabled and floor number > 0)
  const floorCharge = (has20LProduct && floorChargeEnabled && floorNumber > 0) 
    ? floorNumber * chargePerFloor 
    : 0

  const calculateFinalTotal = () => {
    if (!checkoutData) return 0
    const discount = appliedPromo ? appliedPromo.discountAmount : 0
    const totalWithFloorCharge = checkoutData.total + floorCharge
    return Math.max(0, totalWithFloorCharge - discount)
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
        setPincodeError(data.message || 'We do not deliver to this pincode. Please contact support or check back later.')
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
    
    setSelectedAddressId(addressToSave.id)
    if (checkoutData) {
      const updatedCheckout = { ...checkoutData, address: addressToSave }
      setCheckoutData(updatedCheckout)
      localStorage.setItem('checkout_cart', JSON.stringify(updatedCheckout))
    }

    setShowAddressDialog(false)
    setNewAddress({
      label: '',
      address_line: '',
      landmark: '',
      area: 'Laxmi Nagar',
      city: 'Delhi',
      pincode: '',
      floor: 0,
    })
    setPincodeError('')
    // Set floor number from saved address if it has one
    if (addressToSave.floor !== undefined) {
      setFloorNumber(addressToSave.floor)
    }
  }

  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId)
    const selectedAddress = addresses.find(a => a.id === addressId)
    if (selectedAddress && checkoutData) {
      const updatedCheckout = { ...checkoutData, address: selectedAddress }
      setCheckoutData(updatedCheckout)
      localStorage.setItem('checkout_cart', JSON.stringify(updatedCheckout))
      // Set floor number from selected address if it has one
      if (selectedAddress.floor !== undefined) {
        setFloorNumber(selectedAddress.floor)
      }
    }
  }

  if (loading || !checkoutData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader cartItemCount={0} onCartClick={() => {}} />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerHeader cartItemCount={0} onCartClick={() => {}} />
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-3">Order Placed Successfully!</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Your order #{orderNumber} has been confirmed
              </p>
              <div className="bg-white rounded-lg p-6 mb-6 border">
                <p className="text-sm text-muted-foreground mb-2">Expected Delivery</p>
                <p className="text-2xl font-bold text-foreground">30 minutes</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Redirecting to your orders...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerHeader cartItemCount={0} onCartClick={() => {}} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/customer">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Shop
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Delivery Address
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddressDialog(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Address
                  </Button>
                </div>
                {addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedAddressId === address.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200'
                        }`}
                        onClick={() => handleAddressChange(address.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-foreground mb-1">{address.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {address.address_line}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {address.landmark && `${address.landmark}, `}
                              {address.area}, {address.city} - {address.pincode}
                            </p>
                          </div>
                          {selectedAddressId === address.id && (
                            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-blue-50 border-2 border-blue-100 rounded-lg p-4">
                    <p className="font-semibold text-foreground mb-1">
                      {checkoutData.address?.label || 'Default Address'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {checkoutData.address?.address_line || 'No address selected'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {checkoutData.address?.landmark && `${checkoutData.address.landmark}, `}
                      {checkoutData.address?.area}, {checkoutData.address?.city} - {checkoutData.address?.pincode}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Payment Method</h3>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 border-2 rounded-lg p-4 hover:border-blue-200 transition-colors">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center gap-3 flex-1 cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                          <Banknote className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Cash on Delivery</p>
                          <p className="text-sm text-muted-foreground">Pay when you receive</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 border-2 rounded-lg p-4 hover:border-blue-200 transition-colors">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex items-center gap-3 flex-1 cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                          <QrCode className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">UPI Payment</p>
                          <p className="text-sm text-muted-foreground">
                            {upiId ? `Pay to: ${upiId}` : 'Pay via UPI'}
                          </p>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {/* UPI Payment Details */}
                {paymentMethod === 'upi' && (
                  <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-foreground mb-2">UPI ID to Pay:</p>
                      <div className="bg-white border-2 border-purple-300 rounded-lg p-3">
                        <p className="text-lg font-bold text-purple-700 text-center">
                          {upiId || 'Not configured'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Please make payment to this UPI ID and enter the UTR number below
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="utrNumber" className="text-sm font-semibold">
                        UTR Number *
                      </Label>
                      <Input
                        id="utrNumber"
                        placeholder="Enter UTR number from your payment"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                        className="mt-2"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter the UTR/Transaction ID from your UPI payment receipt
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Floor Number (for 20L products) */}
            {has20LProduct && (
              <Card className="border-2">
                <CardContent className="p-6">
                  <Label htmlFor="floorNumber" className="text-base font-bold mb-3 block">
                    Floor Number *
                  </Label>
                  <Input
                    id="floorNumber"
                    type="number"
                    min="0"
                    placeholder="Enter floor number (e.g., 0 for ground floor, 1, 2, 3...)"
                    value={floorNumber || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      setFloorNumber(Math.max(0, value))
                    }}
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {floorNumber > 0 && floorChargeEnabled ? (
                      <span className="text-blue-600 font-medium">
                        Floor charge: ₹{floorCharge.toFixed(2)} (₹{chargePerFloor.toFixed(2)} per floor × {floorNumber} floor{floorNumber !== 1 ? 's' : ''})
                      </span>
                    ) : floorChargeEnabled ? (
                      `Enter 0 for ground floor. Additional ₹${chargePerFloor.toFixed(2)} per floor will be charged.`
                    ) : (
                      'Floor charge is currently disabled. No extra charges will apply.'
                    )}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Special Instructions */}
            <Card className="border-2">
              <CardContent className="p-6">
                <Label htmlFor="instructions" className="text-base font-bold mb-3 block">
                  Special Instructions (Optional)
                </Label>
                <Textarea
                  id="instructions"
                  placeholder="e.g., Please call before delivery, Leave at door, etc."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-blue-100 sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  {checkoutData.cart.map((item) => {
                    const price = Number(item.product.priceCents) / 100
                    return (
                      <div key={item.product.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.product.title} x {item.quantity}
                        </span>
                        <span className="font-semibold">
                          ₹{(price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Promo Code Section */}
                <div className="mb-6 pb-6 border-b">
                  {!appliedPromo ? (
                    <div className="space-y-2">
                      <Label htmlFor="promoCode" className="text-sm font-medium">Promo Code</Label>
                      <div className="flex gap-2">
                        <Input
                          id="promoCode"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value.toUpperCase())
                            setPromoCodeError('')
                          }}
                          placeholder="Enter promo code"
                          className="flex-1"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleApplyPromoCode()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyPromoCode}
                          disabled={validatingPromo || !promoCode.trim()}
                          className="gap-2"
                        >
                          <Tag className="w-4 h-4" />
                          {validatingPromo ? 'Applying...' : 'Apply'}
                        </Button>
                      </div>
                      {promoCodeError && (
                        <p className="text-sm text-red-600">{promoCodeError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Promo Code Applied: {appliedPromo.code}
                          </p>
                          <p className="text-xs text-green-600">
                            You saved ₹{appliedPromo.discountAmount.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePromoCode}
                          className="text-green-600 hover:text-green-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-6 pb-6 border-b">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">
                      ₹{checkoutData.cart.reduce((sum, item) => sum + (Number(item.product.priceCents) / 100) * item.quantity, 0).toFixed(2)}
                    </span>
                  </div>
                  {checkoutData.cart.map((item) => {
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
                  {floorCharge > 0 && (
                    <div className="flex justify-between text-sm border-t pt-2 mt-2">
                      <span className="text-muted-foreground">Floor Charge ({floorNumber} floor{floorNumber !== 1 ? 's' : ''} @ ₹{chargePerFloor.toFixed(2)}/floor)</span>
                      <span className="font-semibold text-blue-600">₹{floorCharge.toFixed(2)}</span>
                    </div>
                  )}
                  {appliedPromo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount ({appliedPromo.code})</span>
                      <span className="font-semibold text-green-600">
                        -₹{appliedPromo.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                </div>

                <div className="flex justify-between text-xl font-bold mb-6">
                  <span>Total</span>
                  <span>₹{calculateFinalTotal().toFixed(2)}</span>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 py-6 text-lg"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || (paymentMethod === 'upi' && !utrNumber.trim()) || !selectedAddressId || (has20LProduct && (floorNumber === undefined || floorNumber === null))}
                >
                  {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Expected delivery in 30 minutes
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

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
                placeholder="e.g., Home, Work, Other"
                value={newAddress.label}
                onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address_line">Address Line</Label>
              <Input
                id="address_line"
                placeholder="Flat/House No., Building Name"
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
                {checkingPincode && (
                  <p className="text-xs text-blue-600 mt-1">Checking pincode...</p>
                )}
                {pincodeError && (
                  <p className="text-xs text-red-600 mt-1">{pincodeError}</p>
                )}
                {newAddress.pincode && newAddress.pincode.length === 6 && !pincodeError && !checkingPincode && (
                  <p className="text-xs text-green-600 mt-1">✓ Delivery available to this pincode</p>
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
            <div>
              <Label htmlFor="floor">Floor Number</Label>
              <Input
                id="floor"
                type="number"
                min="0"
                placeholder="0 for ground floor, 1, 2, 3..."
                value={newAddress.floor || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  setNewAddress({ ...newAddress, floor: Math.max(0, value) })
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter 0 for ground floor. This will be used for floor charge calculation.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                onClick={handleSaveAddress}
                disabled={!newAddress.label || !newAddress.address_line || !newAddress.pincode || checkingPincode || !!pincodeError}
              >
                {checkingPincode ? 'Checking...' : 'Save Address'}
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
    </div>
  )
}
