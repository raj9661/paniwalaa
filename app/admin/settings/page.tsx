'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Droplet, Save, Settings, Globe, Image as ImageIcon, FileText, CreditCard } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function SiteSettingsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [formData, setFormData] = useState({
    // Hero Section
    heroTitle: '',
    heroSubtitle: '',
    heroDescription: '',
    heroImageUrl: '',
    heroButtonText: '',
    heroButtonLink: '',
    // Meta Tags
    siteTitle: '',
    siteDescription: '',
    siteKeywords: '',
    faviconUrl: '',
    ogImageUrl: '',
    // Contact Info
    contactPhone: '',
    contactEmail: '',
    contactAddress: '',
    // Social Media
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    // Footer
    footerCopyright: '',
    // Payment
    upiId: '',
    // Floor Charge Settings
    floorChargeEnabled: true,
    floorChargePerFloorCents: 500,
    // Delivery Partner Commission Settings
    defaultDeliveryPartnerCommissionCents: 1000,
  })

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchSettings()
    }
  }, [user])

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true)
      const response = await fetch('/api/site-settings')
      const data = await response.json()
      setFormData({
        heroTitle: data.heroTitle || '',
        heroSubtitle: data.heroSubtitle || '',
        heroDescription: data.heroDescription || '',
        heroImageUrl: data.heroImageUrl || '',
        heroButtonText: data.heroButtonText || '',
        heroButtonLink: data.heroButtonLink || '',
        siteTitle: data.siteTitle || '',
        siteDescription: data.siteDescription || '',
        siteKeywords: data.siteKeywords || '',
        faviconUrl: data.faviconUrl || '',
        ogImageUrl: data.ogImageUrl || '',
        contactPhone: data.contactPhone || '',
        contactEmail: data.contactEmail || '',
        contactAddress: data.contactAddress || '',
        facebookUrl: data.facebookUrl || '',
        twitterUrl: data.twitterUrl || '',
        instagramUrl: data.instagramUrl || '',
        footerCopyright: data.footerCopyright || '',
        upiId: data.upiId || '',
        floorChargeEnabled: data.floorChargeEnabled !== undefined ? data.floorChargeEnabled : true,
        floorChargePerFloorCents: data.floorChargePerFloorCents || 500,
        defaultDeliveryPartnerCommissionCents: data.defaultDeliveryPartnerCommissionCents || 1000,
      })
    } catch (error) {
      console.error('Error fetching site settings:', error)
    } finally {
      setLoadingSettings(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          updatedBy: user?.id,
        }),
      })

      if (response.ok) {
        alert('Site settings saved successfully!')
        fetchSettings()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving site settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingSettings) {
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Site Settings</h1>
                <p className="text-xs text-muted-foreground">Manage homepage and site configuration</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut()}>Logout</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Site Settings' }]} className="mb-6" />
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="hero" className="space-y-6">
            <TabsList className="bg-white border-2">
              <TabsTrigger value="hero" className="gap-2">
                <ImageIcon className="w-4 h-4" />
                Hero Section
              </TabsTrigger>
              <TabsTrigger value="meta" className="gap-2">
                <Globe className="w-4 h-4" />
                Meta Tags & SEO
              </TabsTrigger>
              <TabsTrigger value="contact" className="gap-2">
                <Settings className="w-4 h-4" />
                Contact & Social
              </TabsTrigger>
              <TabsTrigger value="payment" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Payment
              </TabsTrigger>
            </TabsList>

            {/* Hero Section Tab */}
            <TabsContent value="hero">
              <Card>
                <CardHeader>
                  <CardTitle>Homepage Hero Section</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="heroTitle">Hero Title</Label>
                    <Input
                      id="heroTitle"
                      value={formData.heroTitle}
                      onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                      placeholder="Fresh Water Delivered in 30 Minutes"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="heroSubtitle">Hero Subtitle (Optional)</Label>
                    <Input
                      id="heroSubtitle"
                      value={formData.heroSubtitle}
                      onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                      placeholder="Premium Quality Water"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="heroDescription">Hero Description</Label>
                    <Textarea
                      id="heroDescription"
                      value={formData.heroDescription}
                      onChange={(e) => setFormData({ ...formData, heroDescription: e.target.value })}
                      rows={4}
                      placeholder="Order premium 20L drinking water and get it delivered to your doorstep faster than ever."
                    />
                  </div>

                  <ImageUpload
                    label="Hero Background Image"
                    value={formData.heroImageUrl}
                    onChange={(url) => setFormData({ ...formData, heroImageUrl: url })}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="heroButtonText">Button Text</Label>
                      <Input
                        id="heroButtonText"
                        value={formData.heroButtonText}
                        onChange={(e) => setFormData({ ...formData, heroButtonText: e.target.value })}
                        placeholder="Order Now"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="heroButtonLink">Button Link</Label>
                      <Input
                        id="heroButtonLink"
                        value={formData.heroButtonLink}
                        onChange={(e) => setFormData({ ...formData, heroButtonLink: e.target.value })}
                        placeholder="/signup"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Meta Tags Tab */}
            <TabsContent value="meta">
              <Card>
                <CardHeader>
                  <CardTitle>Meta Tags & SEO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteTitle">Site Title</Label>
                    <Input
                      id="siteTitle"
                      value={formData.siteTitle}
                      onChange={(e) => setFormData({ ...formData, siteTitle: e.target.value })}
                      placeholder="Paniwalaa - Fresh Water in 30 Minutes"
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.siteTitle.length}/60 characters (recommended for SEO)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Textarea
                      id="siteDescription"
                      value={formData.siteDescription}
                      onChange={(e) => setFormData({ ...formData, siteDescription: e.target.value })}
                      rows={3}
                      placeholder="20L premium drinking water delivered to your doorstep in 30 minutes."
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.siteDescription.length}/160 characters (recommended for SEO)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siteKeywords">Site Keywords (comma-separated)</Label>
                    <Input
                      id="siteKeywords"
                      value={formData.siteKeywords}
                      onChange={(e) => setFormData({ ...formData, siteKeywords: e.target.value })}
                      placeholder="water delivery, drinking water, 20L water jar"
                    />
                  </div>

                  <ImageUpload
                    label="Favicon (Icon shown in browser tab)"
                    value={formData.faviconUrl}
                    onChange={(url) => setFormData({ ...formData, faviconUrl: url })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended size: 32x32px or 64x64px (PNG or ICO format)
                  </p>

                  <ImageUpload
                    label="Open Graph Image (Social Media Preview)"
                    value={formData.ogImageUrl}
                    onChange={(url) => setFormData({ ...formData, ogImageUrl: url })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended size: 1200x630px (shown when sharing on social media)
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact & Social Tab */}
            <TabsContent value="contact">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone Number</Label>
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="info@paniwalaa.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactAddress">Address</Label>
                      <Textarea
                        id="contactAddress"
                        value={formData.contactAddress}
                        onChange={(e) => setFormData({ ...formData, contactAddress: e.target.value })}
                        rows={2}
                        placeholder="Laxmi Nagar, Delhi - 110092"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Social Media Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebookUrl">Facebook URL</Label>
                      <Input
                        id="facebookUrl"
                        type="url"
                        value={formData.facebookUrl}
                        onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                        placeholder="https://facebook.com/paniwalaa"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitterUrl">Twitter/X URL</Label>
                      <Input
                        id="twitterUrl"
                        type="url"
                        value={formData.twitterUrl}
                        onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                        placeholder="https://twitter.com/paniwalaa"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagramUrl">Instagram URL</Label>
                      <Input
                        id="instagramUrl"
                        type="url"
                        value={formData.instagramUrl}
                        onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                        placeholder="https://instagram.com/paniwalaa"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Footer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="footerCopyright">Copyright Text</Label>
                      <Input
                        id="footerCopyright"
                        value={formData.footerCopyright}
                        onChange={(e) => setFormData({ ...formData, footerCopyright: e.target.value })}
                        placeholder={`© ${new Date().getFullYear()} Paniwalaa. All rights reserved.`}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Payment Settings Tab */}
            <TabsContent value="payment">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input
                        id="upiId"
                        value={formData.upiId}
                        onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                        placeholder="paniwalaa01@paytm"
                      />
                      <p className="text-xs text-muted-foreground">
                        UPI ID where customers will make payments (e.g., paniwalaa01@paytm, paniwalaa01@ybl)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Floor Charge Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="floorChargeEnabled"
                          checked={formData.floorChargeEnabled}
                          onChange={(e) => setFormData({ ...formData, floorChargeEnabled: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="floorChargeEnabled" className="text-base font-semibold cursor-pointer">
                          Enable Floor Charge
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        When enabled, customers will be charged extra for deliveries above ground floor (for 20L products)
                      </p>
                    </div>

                    {formData.floorChargeEnabled && (
                      <div className="space-y-2">
                        <Label htmlFor="floorChargePerFloorCents">Charge Per Floor (₹)</Label>
                        <Input
                          id="floorChargePerFloorCents"
                          type="number"
                          min="0"
                          step="1"
                          value={(formData.floorChargePerFloorCents / 100).toFixed(2)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0
                            setFormData({ ...formData, floorChargePerFloorCents: Math.round(value * 100) })
                          }}
                          placeholder="5.00"
                        />
                        <p className="text-xs text-muted-foreground">
                          Amount charged per floor (e.g., ₹5.00 means ₹5 per floor). Ground floor (0) has no charge.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                          <p className="text-sm text-blue-800">
                            <strong>Example:</strong> If set to ₹5.00, a delivery to 4th floor will add ₹20.00 (₹5 × 4 floors) to the order total.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Delivery Partner Commission Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Partner Commission Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultDeliveryPartnerCommissionCents">Default Commission Per Product Unit (₹)</Label>
                      <Input
                        id="defaultDeliveryPartnerCommissionCents"
                        type="number"
                        min="0"
                        step="0.01"
                        value={(formData.defaultDeliveryPartnerCommissionCents / 100).toFixed(2)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          setFormData({ ...formData, defaultDeliveryPartnerCommissionCents: Math.round(value * 100) })
                        }}
                        placeholder="10.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Default commission paid to delivery partner per product unit delivered. This is used when a product doesn't have a specific commission set. You can set product-specific commissions in the Products management page.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                        <p className="text-sm text-blue-800">
                          <strong>Note:</strong> Each product can have its own commission rate. If a product doesn't have a specific commission set, this default value will be used. To set product-specific commissions, go to Products management and edit each product.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 gap-2"
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

