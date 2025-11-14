'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer/customer-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Plus, Home, Briefcase, Edit, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Address = {
  id: string
  label: string
  address_line: string
  landmark: string
  area: string
  city: string
  pincode: string
  is_default: boolean
}

export default function AddressesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      label: 'Home',
      address_line: 'A-123, Sector 5',
      landmark: 'Near Metro Station',
      area: 'Laxmi Nagar',
      city: 'Delhi',
      pincode: '110092',
      is_default: true,
    },
  ])
  const [showDialog, setShowDialog] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState({
    label: '',
    address_line: '',
    landmark: '',
    area: 'Laxmi Nagar',
    city: 'Delhi',
    pincode: '',
  })
  const [pincodeError, setPincodeError] = useState('')
  const [checkingPincode, setCheckingPincode] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'customer')) {
      router.push('/login')
      return
    }

    // Load addresses from localStorage
    const storedAddresses = localStorage.getItem('customer_addresses')
    if (storedAddresses) {
      setAddresses(JSON.parse(storedAddresses))
    }
  }, [user, loading, router])

  const handleAddAddress = () => {
    setEditingAddress(null)
    setFormData({
      label: '',
      address_line: '',
      landmark: '',
      area: 'Laxmi Nagar',
      city: 'Delhi',
      pincode: '',
    })
    setShowDialog(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      label: address.label,
      address_line: address.address_line,
      landmark: address.landmark,
      area: address.area,
      city: address.city,
      pincode: address.pincode,
    })
    setShowDialog(true)
  }

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id)
    setAddresses(updated)
    localStorage.setItem('customer_addresses', JSON.stringify(updated))
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
    // Validate pincode before saving
    const isDeliverable = await checkPincode(formData.pincode)
    if (!isDeliverable) {
      return
    }

    if (editingAddress) {
      // Update existing address
      const updated = addresses.map((a) =>
        a.id === editingAddress.id ? { ...a, ...formData } : a
      )
      setAddresses(updated)
      localStorage.setItem('customer_addresses', JSON.stringify(updated))
    } else {
      // Add new address
      const newAddress: Address = {
        id: Date.now().toString(),
        ...formData,
        is_default: addresses.length === 0,
      }
      const updated = [...addresses, newAddress]
      setAddresses(updated)
      localStorage.setItem('customer_addresses', JSON.stringify(updated))
    }
    setPincodeError('')
    setShowDialog(false)
  }

  const handleSetDefault = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      is_default: a.id === id,
    }))
    setAddresses(updated)
    localStorage.setItem('customer_addresses', JSON.stringify(updated))
  }

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Delivery Addresses</h1>
            <p className="text-muted-foreground">Manage your saved delivery locations</p>
          </div>
          <Button
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 gap-2"
            onClick={handleAddAddress}
          >
            <Plus className="w-4 h-4" />
            Add Address
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((address) => (
            <Card key={address.id} className="border-2 relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                      {address.label === 'Home' ? (
                        <Home className="w-5 h-5 text-blue-600" />
                      ) : address.label === 'Work' ? (
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      ) : (
                        <MapPin className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{address.label}</h3>
                      {address.is_default && (
                        <span className="text-xs text-green-600 font-medium">Default</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditAddress(address)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-foreground mb-1">{address.address_line}</p>
                {address.landmark && (
                  <p className="text-sm text-muted-foreground mb-1">{address.landmark}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {address.area}, {address.city} - {address.pincode}
                </p>

                {!address.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => handleSetDefault(address.id)}
                  >
                    Set as Default
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add/Edit Address Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="label">Address Label</Label>
                <Input
                  id="label"
                  placeholder="e.g., Home, Work, Other"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address_line">Address Line</Label>
                <Input
                  id="address_line"
                  placeholder="Flat/House No., Building Name"
                  value={formData.address_line}
                  onChange={(e) =>
                    setFormData({ ...formData, address_line: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="landmark">Landmark (Optional)</Label>
                <Input
                  id="landmark"
                  placeholder="Nearby landmark"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="area">Area</Label>
                  <Input
                    id="area"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    placeholder="110092"
                    value={formData.pincode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setFormData({ ...formData, pincode: value })
                      setPincodeError('')
                    }}
                    onBlur={() => {
                      if (formData.pincode && formData.pincode.length === 6) {
                        checkPincode(formData.pincode)
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
                  {formData.pincode && formData.pincode.length === 6 && !pincodeError && !checkingPincode && (
                    <p className="text-xs text-green-600 mt-1">✓ Delivery available to this pincode</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  onClick={handleSaveAddress}
                  disabled={!formData.label || !formData.address_line || !formData.pincode || checkingPincode || !!pincodeError}
                >
                  {checkingPincode ? 'Checking...' : 'Save Address'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
