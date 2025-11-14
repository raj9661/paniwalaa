'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Droplet, ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/footer'

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
              <p className="text-foreground">
                We collect information that you provide directly to us, including name, email, phone number, delivery address, and payment information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>To process and deliver your orders</li>
                <li>To communicate with you about your orders</li>
                <li>To send you promotional offers and updates</li>
                <li>To improve our services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">3. Data Security</h2>
              <p className="text-foreground">
                We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">4. Contact Us</h2>
              <p className="text-foreground">
                For privacy concerns, contact us at info@paniwalaa.com
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

