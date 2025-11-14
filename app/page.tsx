'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Droplet, Clock, MapPin, Wallet, ShoppingCart, Star, CheckCircle } from 'lucide-react'
import { Footer } from '@/components/footer'
import { DynamicMeta } from '@/components/dynamic-meta'
import Link from 'next/link'

export default function HomePage() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/site-settings')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching site settings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <DynamicMeta settings={settings} />
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Paniwalaa</h1>
                <p className="text-xs text-muted-foreground">Pure water, delivered fast</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/blog">
                <Button variant="ghost" size="sm">
                  Blog
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" size="sm">
                  Contact
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="container mx-auto px-4 py-12 sm:py-20"
        style={settings?.heroImageUrl ? {
          backgroundImage: `url(${settings.heroImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        } : {}}
      >
        <div className={`grid lg:grid-cols-2 gap-12 items-center ${settings?.heroImageUrl ? 'bg-white/90 backdrop-blur-sm p-8 rounded-lg' : ''}`}>
          <div>
            {settings?.heroSubtitle && (
              <p className="text-lg text-blue-600 font-semibold mb-2">{settings.heroSubtitle}</p>
            )}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
              {settings?.heroTitle || 'Fresh Water Delivered in 30 Minutes'}
            </h2>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              {settings?.heroDescription || 'Order premium 20L drinking water and get it delivered to your doorstep faster than ever. Serving Laxmi Nagar, Delhi.'}
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 border-2 border-blue-100">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-foreground">30-min delivery</span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 border-2 border-cyan-100">
                <MapPin className="w-5 h-5 text-cyan-600" />
                <span className="font-medium text-foreground">Laxmi Nagar</span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 border-2 border-green-100">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-medium text-foreground">4.8 rating</span>
              </div>
            </div>
            <Link href={settings?.heroButtonLink || '/signup'}>
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-lg px-8 py-6 gap-2">
                <ShoppingCart className="w-5 h-5" />
                {settings?.heroButtonText || 'Order Now'}
              </Button>
            </Link>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-200 to-cyan-200 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-400/20" />
              <img 
                src="/20l-water-jar-bottle-on-modern-delivery.jpg"
                alt="Water Delivery"
                className="relative z-10 w-full h-auto rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 sm:py-20 border-y">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12 text-foreground">Why Choose Paniwalaa?</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-2 border-blue-50 hover:border-blue-200 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-bold text-lg text-foreground mb-2">Lightning Fast</h4>
                <p className="text-sm text-muted-foreground">Guaranteed delivery within 30 minutes or your money back</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-cyan-50 hover:border-cyan-200 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Droplet className="w-8 h-8 text-cyan-600" />
                </div>
                <h4 className="font-bold text-lg text-foreground mb-2">100% Pure</h4>
                <p className="text-sm text-muted-foreground">Premium purified water from trusted brands</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-50 hover:border-green-200 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-bold text-lg text-foreground mb-2">Easy Payments</h4>
                <p className="text-sm text-muted-foreground">Wallet, UPI, or Cash on Delivery available</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-50 hover:border-purple-200 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="font-bold text-lg text-foreground mb-2">Quality Assured</h4>
                <p className="text-sm text-muted-foreground">Sealed containers with quality guarantee</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 sm:py-20">
        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 border-0">
          <CardContent className="p-8 sm:p-12 text-center">
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 text-balance">
              Ready to Experience Fast Water Delivery?
            </h3>
            <p className="text-lg text-blue-50 mb-8 max-w-2xl mx-auto text-pretty">
              Join thousands of satisfied customers in Laxmi Nagar who trust Paniwalaa for their daily water needs.
            </p>
            <Link href="/customer">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6 gap-2 bg-white hover:bg-gray-50">
                <ShoppingCart className="w-5 h-5" />
                Start Ordering
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  )
}
