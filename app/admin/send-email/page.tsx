'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Droplet, Send, Mail, ArrowLeft, Users, Truck, UserPlus, FileText, CheckSquare, Square, Search } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import Link from 'next/link'

type User = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: string
}

type Lead = {
  id: string
  name: string
  email: string
  phone: string | null
}

export default function SendEmailPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  
  // Recipient data
  const [customers, setCustomers] = useState<User[]>([])
  const [deliveryPartners, setDeliveryPartners] = useState<User[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  
  // Selected recipients
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set())
  const [selectedDeliveryPartners, setSelectedDeliveryPartners] = useState<Set<string>>(new Set())
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  
  // Search filters
  const [customerSearch, setCustomerSearch] = useState('')
  const [deliveryPartnerSearch, setDeliveryPartnerSearch] = useState('')
  const [leadSearch, setLeadSearch] = useState('')
  
  // Form data
  const [formData, setFormData] = useState({
    recipients: '',
    subject: '',
    message: '',
    customFooter: '',
  })

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchRecipients()
    }
  }, [user])

  const fetchRecipients = async () => {
    setLoadingRecipients(true)
    try {
      // Fetch customers
      const customersRes = await fetch('/api/users?role=customer&limit=1000')
      const customersData = await customersRes.json()
      setCustomers(customersData.users || [])

      // Fetch delivery partners
      const partnersRes = await fetch('/api/users?role=delivery_partner&limit=1000')
      const partnersData = await partnersRes.json()
      setDeliveryPartners(partnersData.users || [])

      // Fetch leads (contact submissions)
      const leadsRes = await fetch('/api/contact?limit=1000')
      const leadsData = await leadsRes.json()
      setLeads(leadsData.submissions || [])
    } catch (error) {
      console.error('Error fetching recipients:', error)
    } finally {
      setLoadingRecipients(false)
    }
  }

  // Filter functions
  const filteredCustomers = customers.filter(c => {
    if (!customerSearch) return true
    const search = customerSearch.toLowerCase()
    return (
      (c.name?.toLowerCase().includes(search)) ||
      (c.email?.toLowerCase().includes(search)) ||
      (c.phone?.includes(search))
    )
  })

  const filteredDeliveryPartners = deliveryPartners.filter(d => {
    if (!deliveryPartnerSearch) return true
    const search = deliveryPartnerSearch.toLowerCase()
    return (
      (d.name?.toLowerCase().includes(search)) ||
      (d.email?.toLowerCase().includes(search)) ||
      (d.phone?.includes(search))
    )
  })

  const filteredLeads = leads.filter(l => {
    if (!leadSearch) return true
    const search = leadSearch.toLowerCase()
    return (
      l.name.toLowerCase().includes(search) ||
      l.email.toLowerCase().includes(search) ||
      (l.phone?.toLowerCase().includes(search))
    )
  })

  // Select all functions
  const selectAllCustomers = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set())
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.email || '').filter(Boolean)))
    }
  }

  const selectAllDeliveryPartners = () => {
    if (selectedDeliveryPartners.size === filteredDeliveryPartners.length) {
      setSelectedDeliveryPartners(new Set())
    } else {
      setSelectedDeliveryPartners(new Set(filteredDeliveryPartners.map(d => d.email || '').filter(Boolean)))
    }
  }

  const selectAllLeads = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.email).filter(Boolean)))
    }
  }

  // Toggle selection
  const toggleCustomer = (email: string) => {
    const newSet = new Set(selectedCustomers)
    if (newSet.has(email)) {
      newSet.delete(email)
    } else {
      newSet.add(email)
    }
    setSelectedCustomers(newSet)
  }

  const toggleDeliveryPartner = (email: string) => {
    const newSet = new Set(selectedDeliveryPartners)
    if (newSet.has(email)) {
      newSet.delete(email)
    } else {
      newSet.add(email)
    }
    setSelectedDeliveryPartners(newSet)
  }

  const toggleLead = (email: string) => {
    const newSet = new Set(selectedLeads)
    if (newSet.has(email)) {
      newSet.delete(email)
    } else {
      newSet.add(email)
    }
    setSelectedLeads(newSet)
  }

  // Get all selected emails
  const getAllSelectedEmails = (): string[] => {
    const emails = new Set<string>()
    
    // Add selected customers
    selectedCustomers.forEach(email => {
      if (email) emails.add(email)
    })
    
    // Add selected delivery partners
    selectedDeliveryPartners.forEach(email => {
      if (email) emails.add(email)
    })
    
    // Add selected leads
    selectedLeads.forEach(email => {
      if (email) emails.add(email)
    })
    
    // Add manual entries
    const manualEmails = formData.recipients
      .split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0 && email.includes('@'))
    
    manualEmails.forEach(email => emails.add(email))
    
    return Array.from(emails)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    try {
      const recipients = getAllSelectedEmails()

      if (recipients.length === 0) {
        alert('Please select at least one recipient or enter an email address')
        setSending(false)
        return
      }

      if (recipients.length > 100) {
        alert('Maximum 100 recipients per request. Please reduce the number of recipients.')
        setSending(false)
        return
      }

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          subject: formData.subject,
          message: formData.message,
          customFooter: formData.customFooter || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || `Email sent successfully to ${recipients.length} recipient(s)!`)
        setFormData({
          recipients: '',
          subject: '',
          message: '',
          customFooter: '',
        })
        setSelectedCustomers(new Set())
        setSelectedDeliveryPartners(new Set())
        setSelectedLeads(new Set())
      } else {
        alert(data.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  if (loading || loadingRecipients) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const totalSelected = getAllSelectedEmails().length

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
                <h1 className="text-2xl font-bold text-foreground">Send Email</h1>
                <p className="text-xs text-muted-foreground">Send custom emails to users</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut()}>Logout</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Send Email' }]} className="mb-6" />
        
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Recipient Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Select Recipients</CardTitle>
                <div className="text-sm font-medium text-muted-foreground">
                  {totalSelected} recipient{totalSelected !== 1 ? 's' : ''} selected
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="customers" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="customers" className="gap-2">
                    <Users className="w-4 h-4" />
                    Customers ({customers.length})
                  </TabsTrigger>
                  <TabsTrigger value="delivery" className="gap-2">
                    <Truck className="w-4 h-4" />
                    Delivery Partners ({deliveryPartners.length})
                  </TabsTrigger>
                  <TabsTrigger value="leads" className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Leads ({leads.length})
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Manual Entry
                  </TabsTrigger>
                </TabsList>

                {/* Customers Tab */}
                <TabsContent value="customers" className="space-y-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search customers by name, email, or phone..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={selectAllCustomers}
                      className="gap-2"
                    >
                      {selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0 ? (
                        <>
                          <Square className="w-4 h-4" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-4 h-4" />
                          Select All ({filteredCustomers.length})
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        {customerSearch ? 'No customers found matching your search' : 'No customers available'}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredCustomers.map((customer) => {
                          const email = customer.email || ''
                          if (!email) return null
                          return (
                            <div
                              key={customer.id}
                              className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                              onClick={() => toggleCustomer(email)}
                            >
                              <Checkbox
                                checked={selectedCustomers.has(email)}
                                onCheckedChange={() => toggleCustomer(email)}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{customer.name || 'No Name'}</div>
                                <div className="text-sm text-muted-foreground">{email}</div>
                                {customer.phone && (
                                  <div className="text-xs text-muted-foreground">{customer.phone}</div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Delivery Partners Tab */}
                <TabsContent value="delivery" className="space-y-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search delivery partners by name, email, or phone..."
                        value={deliveryPartnerSearch}
                        onChange={(e) => setDeliveryPartnerSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={selectAllDeliveryPartners}
                      className="gap-2"
                    >
                      {selectedDeliveryPartners.size === filteredDeliveryPartners.length && filteredDeliveryPartners.length > 0 ? (
                        <>
                          <Square className="w-4 h-4" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-4 h-4" />
                          Select All ({filteredDeliveryPartners.length})
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    {filteredDeliveryPartners.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        {deliveryPartnerSearch ? 'No delivery partners found matching your search' : 'No delivery partners available'}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredDeliveryPartners.map((partner) => {
                          const email = partner.email || ''
                          if (!email) return null
                          return (
                            <div
                              key={partner.id}
                              className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                              onClick={() => toggleDeliveryPartner(email)}
                            >
                              <Checkbox
                                checked={selectedDeliveryPartners.has(email)}
                                onCheckedChange={() => toggleDeliveryPartner(email)}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{partner.name || 'No Name'}</div>
                                <div className="text-sm text-muted-foreground">{email}</div>
                                {partner.phone && (
                                  <div className="text-xs text-muted-foreground">{partner.phone}</div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Leads Tab */}
                <TabsContent value="leads" className="space-y-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search leads by name, email, or phone..."
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={selectAllLeads}
                      className="gap-2"
                    >
                      {selectedLeads.size === filteredLeads.length && filteredLeads.length > 0 ? (
                        <>
                          <Square className="w-4 h-4" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-4 h-4" />
                          Select All ({filteredLeads.length})
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    {filteredLeads.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        {leadSearch ? 'No leads found matching your search' : 'No leads available'}
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleLead(lead.email)}
                          >
                            <Checkbox
                              checked={selectedLeads.has(lead.email)}
                              onCheckedChange={() => toggleLead(lead.email)}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{lead.name}</div>
                              <div className="text-sm text-muted-foreground">{lead.email}</div>
                              {lead.phone && (
                                <div className="text-xs text-muted-foreground">{lead.phone}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Manual Entry Tab */}
                <TabsContent value="manual" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipients">Email Addresses (comma or newline separated)</Label>
                    <Textarea
                      id="recipients"
                      value={formData.recipients}
                      onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                      placeholder="user1@example.com, user2@example.com"
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter email addresses separated by commas or new lines. These will be combined with selected recipients above.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Email Composition */}
          <Card>
            <CardHeader>
              <CardTitle>Compose Email</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Email subject"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={10}
                    placeholder="Enter your message here..."
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Plain text or HTML. Line breaks will be preserved.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customFooter">Custom Footer (Optional)</Label>
                  <Textarea
                    id="customFooter"
                    value={formData.customFooter}
                    onChange={(e) => setFormData({ ...formData, customFooter: e.target.value })}
                    rows={4}
                    placeholder="Custom HTML footer (optional)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use default footer from email settings.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Link href="/admin">
                    <Button type="button" variant="outline">Cancel</Button>
                  </Link>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 gap-2"
                    disabled={sending || totalSelected === 0}
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending...' : `Send Email (${totalSelected})`}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
