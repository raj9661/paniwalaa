'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Droplet, ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex flex-col">
      {/* Header */}
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

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms and Conditions</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p className="text-foreground">
                By accessing and using Paniwalaa services, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">2. Service Description</h2>
              <p className="text-foreground">
                Paniwalaa provides premium drinking water delivery services in Laxmi Nagar, Delhi. We deliver 20L and 10L water jars and water dispensers to your doorstep within 30 minutes of order placement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">3. Orders and Payment</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>All orders are subject to product availability</li>
                <li>Payment must be made at the time of order placement</li>
                <li>We accept online payments and cash on delivery</li>
                <li>Prices are subject to change without prior notice</li>
                <li>Security deposits are required for water jars and dispensers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">4. Security Deposit</h2>
              <p className="text-foreground mb-2">
                A security deposit is required for water jars and dispensers:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Security deposit is refundable upon return of the jar/dispenser in good condition</li>
                <li>Deposit will be refunded within 7-10 business days after return</li>
                <li>Damaged or lost items will result in forfeiture of the security deposit</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">5. Delivery</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Delivery time is approximately 30 minutes from order confirmation</li>
                <li>Delivery is available only in Laxmi Nagar, Delhi</li>
                <li>Additional charges may apply for deliveries to higher floors</li>
                <li>We reserve the right to refuse delivery in case of incorrect address or unsafe conditions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">6. Cancellation and Refunds</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Orders can be cancelled within 5 minutes of placement</li>
                <li>Refunds will be processed within 7-10 business days</li>
                <li>No refunds for delivered products unless damaged or incorrect</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">7. User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Provide accurate delivery address and contact information</li>
                <li>Ensure someone is available to receive the delivery</li>
                <li>Handle products with care and return jars/dispensers in good condition</li>
                <li>Notify us immediately of any issues or damages</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
              <p className="text-foreground">
                Paniwalaa shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">9. Contact Information</h2>
              <p className="text-foreground">
                For any questions regarding these terms, please contact us at:
              </p>
              <ul className="list-none space-y-1 text-foreground">
                <li>Email: info@paniwalaa.com</li>
                <li>Phone: +91 98765 43210</li>
                <li>Address: Laxmi Nagar, Delhi - 110092</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

