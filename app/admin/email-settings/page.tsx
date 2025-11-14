'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Droplet, Save, Settings, Mail, Send, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import Link from 'next/link'

export default function EmailSettingsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [testEmail, setTestEmail] = useState('')
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [formData, setFormData] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpSecure: true,
    smtpEmail: '',
    smtpPassword: '',
    fromName: 'Paniwalaa',
    fromEmail: '',
    emailFooter: '',
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
      const response = await fetch('/api/email-settings')
      const data = await response.json()
      setFormData({
        smtpHost: data.smtpHost || 'smtp.gmail.com',
        smtpPort: data.smtpPort || 465,
        smtpSecure: data.smtpSecure !== false,
        smtpEmail: data.smtpEmail || '',
        smtpPassword: data.smtpPassword === '***' ? '' : (data.smtpPassword || ''),
        fromName: data.fromName || 'Paniwalaa',
        fromEmail: data.fromEmail || '',
        emailFooter: data.emailFooter || '',
      })
    } catch (error) {
      console.error('Error fetching email settings:', error)
    } finally {
      setLoadingSettings(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTestResult(null)

    try {
      // Prepare data - don't send password if it's empty (to keep existing password)
      const submitData: any = {
        smtpHost: formData.smtpHost,
        smtpPort: formData.smtpPort,
        smtpSecure: formData.smtpSecure,
        smtpEmail: formData.smtpEmail,
        fromName: formData.fromName,
        fromEmail: formData.fromEmail,
        emailFooter: formData.emailFooter,
        updatedBy: user?.id,
      }

      // Only include password if it's been changed (not empty)
      if (formData.smtpPassword && formData.smtpPassword.trim() !== '') {
        submitData.smtpPassword = formData.smtpPassword
      }

      const response = await fetch('/api/email-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Email settings saved successfully!')
        fetchSettings()
      } else {
        alert(data.error || 'Failed to save settings')
      }
    } catch (error: any) {
      console.error('Error saving email settings:', error)
      alert(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter a test email address')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      // First save settings
      await fetch('/api/email-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          updatedBy: user?.id,
        }),
      })

      // Then send test email
      const response = await fetch('/api/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({ success: true, message: data.message })
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to send test email' })
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      setTestResult({ success: false, message: 'Failed to send test email' })
    } finally {
      setTesting(false)
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
                <h1 className="text-2xl font-bold text-foreground">Email Settings</h1>
                <p className="text-xs text-muted-foreground">Configure SMTP and email templates</p>
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
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="smtp" className="space-y-6">
            <TabsList className="bg-white border-2">
              <TabsTrigger value="smtp" className="gap-2">
                <Settings className="w-4 h-4" />
                SMTP Configuration
              </TabsTrigger>
              <TabsTrigger value="template" className="gap-2">
                <Mail className="w-4 h-4" />
                Email Template
              </TabsTrigger>
            </TabsList>

            {/* SMTP Configuration Tab */}
            <TabsContent value="smtp">
              <Card>
                <CardHeader>
                  <CardTitle>Gmail SMTP Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-blue-900 mb-2">How to get Gmail App Password:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                      <li>Go to your Google Account settings</li>
                      <li>Enable 2-Step Verification</li>
                      <li>Go to App Passwords section</li>
                      <li>Generate a new app password for "Mail"</li>
                      <li>Copy the 16-character password and paste it below</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={formData.smtpHost}
                      onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={formData.smtpPort}
                        onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) || 465 })}
                        placeholder="465"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpSecure">Secure Connection</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          id="smtpSecure"
                          checked={formData.smtpSecure}
                          onChange={(e) => setFormData({ ...formData, smtpSecure: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <label htmlFor="smtpSecure" className="text-sm">Use SSL/TLS</label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpEmail">Gmail Address *</Label>
                    <Input
                      id="smtpEmail"
                      type="email"
                      value={formData.smtpEmail}
                      onChange={(e) => setFormData({ ...formData, smtpEmail: e.target.value })}
                      placeholder="your@gmail.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">Gmail App Password *</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={formData.smtpPassword}
                      onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                      placeholder="Enter 16-character app password"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to keep existing password
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromName">From Name</Label>
                      <Input
                        id="fromName"
                        value={formData.fromName}
                        onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                        placeholder="Paniwalaa"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fromEmail">From Email (Optional)</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={formData.fromEmail}
                        onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                        placeholder="noreply@paniwalaa.com"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty to use SMTP email
                      </p>
                    </div>
                  </div>

                  {/* Test Email Section */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold mb-3">Test Email Configuration</h4>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="Enter test email address"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleTestEmail}
                        disabled={testing || !testEmail}
                        className="gap-2"
                      >
                        <Send className="w-4 h-4" />
                        {testing ? 'Sending...' : 'Send Test Email'}
                      </Button>
                    </div>
                    {testResult && (
                      <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
                        testResult.success
                          ? 'bg-green-50 text-green-800 border border-green-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {testResult.success ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                        <span className="text-sm">{testResult.message}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Template Tab */}
            <TabsContent value="template">
              <Card>
                <CardHeader>
                  <CardTitle>Email Footer Template</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailFooter">Custom Email Footer (HTML)</Label>
                    <Textarea
                      id="emailFooter"
                      value={formData.emailFooter}
                      onChange={(e) => setFormData({ ...formData, emailFooter: e.target.value })}
                      rows={10}
                      placeholder={`<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; text-align: center;">
  <p>© ${new Date().getFullYear()} Paniwalaa. All rights reserved.</p>
  <p>This is an automated email. Please do not reply to this message.</p>
</div>`}
                    />
                    <p className="text-xs text-muted-foreground">
                      This footer will be added to all emails. Leave empty to use default footer.
                    </p>
                  </div>
                </CardContent>
              </Card>
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

