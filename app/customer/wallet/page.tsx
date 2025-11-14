'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { CustomerHeader } from '@/components/customer/customer-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, TrendingUp, QrCode, Banknote, AlertCircle } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

type Transaction = {
  id: string
  type: string
  amount: number
  reference: string | null
  createdAt: string
}

export default function WalletPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingWallet, setLoadingWallet] = useState(true)
  const [addMoneyAmount, setAddMoneyAmount] = useState('')
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [utrNumber, setUtrNumber] = useState('')
  const [upiId, setUpiId] = useState('')
  const [addingMoney, setAddingMoney] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'customer')) {
      router.push('/login')
      return
    }

    if (user) {
      fetchWallet()
      fetchUpiId()
    }
  }, [user, loading, router])

  const fetchWallet = async () => {
    if (!user) return

    try {
      setLoadingWallet(true)
      const response = await fetch(`/api/wallet?userId=${user.id}`)
      const data = await response.json()

      if (response.ok) {
        setBalance(data.wallet.balance)
        setTransactions(data.wallet.transactions || [])
      } else {
        setError(data.error || 'Failed to load wallet')
      }
    } catch (err) {
      setError('Failed to load wallet')
    } finally {
      setLoadingWallet(false)
    }
  }

  const fetchUpiId = async () => {
    try {
      const response = await fetch('/api/site-settings')
      const data = await response.json()
      if (data.upiId || data.settings?.upiId) {
        setUpiId(data.upiId || data.settings.upiId)
      }
    } catch (err) {
      console.error('Error fetching UPI ID:', err)
    }
  }

  const handleAddMoney = async () => {
    if (!user) return

    const amount = parseFloat(addMoneyAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (paymentMethod === 'upi' && !utrNumber.trim()) {
      setError('Please enter UTR number for UPI payment')
      return
    }

    setAddingMoney(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount,
          paymentMethod,
          utrNumber: paymentMethod === 'upi' ? utrNumber.trim() : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to add money to wallet')
        return
      }

      setSuccess('Money added to wallet successfully!')
      setAddMoneyAmount('')
      setUtrNumber('')
      setShowAddMoney(false)
      
      // Refresh wallet data
      await fetchWallet()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to add money to wallet. Please try again.')
    } finally {
      setAddingMoney(false)
    }
  }

  if (loading || loadingWallet) {
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Wallet</h1>
          <p className="text-muted-foreground">Manage your Paniwalaa wallet balance</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-500 to-cyan-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">Current Balance</p>
                    <p className="text-3xl font-bold text-white">₹{balance.toFixed(2)}</p>
                  </div>
                </div>
                
                <Button
                  className="w-full bg-white text-blue-600 hover:bg-blue-50 gap-2"
                  onClick={() => setShowAddMoney(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add Money
                </Button>
              </CardContent>
            </Card>

          </div>

          {/* Transactions */}
          <div className="lg:col-span-2">
            <Card className="border-2">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-6">Transaction History</h3>
                
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-muted-foreground">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              transaction.type === 'credit'
                                ? 'bg-green-100'
                                : 'bg-red-100'
                            }`}
                          >
                            {transaction.type === 'credit' ? (
                              <ArrowDownRight className="w-5 h-5 text-green-600" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {transaction.reference || (transaction.type === 'credit' ? 'Money Added' : 'Money Used')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold ${
                              transaction.type === 'credit'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {transaction.type === 'credit' ? '+' : '-'}₹
                            {transaction.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Add Money Dialog */}
      <Dialog open={showAddMoney} onOpenChange={setShowAddMoney}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Money to Wallet</DialogTitle>
            <DialogDescription>
              Choose a payment method to add money to your wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={addMoneyAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '')
                  setAddMoneyAmount(value)
                  setError('')
                }}
                min="1"
                step="0.01"
              />
            </div>

            <div>
              <Label className="mb-3 block">Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 border-2 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <RadioGroupItem value="cod" id="cod-wallet" />
                    <Label htmlFor="cod-wallet" className="flex items-center gap-3 flex-1 cursor-pointer">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                        <Banknote className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Cash Deposit</p>
                        <p className="text-sm text-muted-foreground">Pay cash to delivery person</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 border-2 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <RadioGroupItem value="upi" id="upi-wallet" />
                    <Label htmlFor="upi-wallet" className="flex items-center gap-3 flex-1 cursor-pointer">
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
            </div>

            {paymentMethod === 'upi' && (
              <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
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
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                onClick={handleAddMoney}
                disabled={!addMoneyAmount || parseFloat(addMoneyAmount) <= 0 || addingMoney || (paymentMethod === 'upi' && !utrNumber.trim())}
              >
                {addingMoney ? 'Adding...' : 'Add Money'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddMoney(false)
                  setAddMoneyAmount('')
                  setUtrNumber('')
                  setPaymentMethod('cod')
                  setError('')
                }}
                disabled={addingMoney}
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
