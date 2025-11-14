'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Droplet, ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/footer'

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex flex-col">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Paniwalaa</h1>
                <p className="text-xs text-muted-foreground">Pure water, delivered fast</p>
              </div>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Refund Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">1. Refund Eligibility</h2>
              <p className="text-foreground mb-2">
                Refunds are available in the following cases:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Order cancelled within 5 minutes of placement</li>
                <li>Damaged or incorrect products delivered</li>
                <li>Failed delivery due to our error</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">2. Refund Process</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Refund requests must be made within 24 hours of delivery</li>
                <li>Refunds will be processed within 7-10 business days</li>
                <li>Refunds will be issued to the original payment method</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">3. Security Deposit Refunds</h2>
              <p className="text-foreground">
                Security deposits for jars and dispensers will be refunded within 7-10 business days after the items are returned in good condition.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">4. Contact Us</h2>
              <p className="text-foreground">
                For refund requests, contact us at info@paniwalaa.com or call +91 98765 43210
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

