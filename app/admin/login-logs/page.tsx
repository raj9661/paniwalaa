'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Droplet, Shield, CheckCircle2, XCircle, AlertTriangle, Search, Filter, User } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import Link from 'next/link'

interface LoginLog {
  id: string
  userId: string
  email: string | null
  phone: string | null
  role: string
  ipAddress: string | null
  userAgent: string | null
  deviceFingerprint: string | null
  loginStatus: string
  failureReason: string | null
  location: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string | null
    phone: string | null
    role: string
  }
}

export default function LoginLogsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<LoginLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [filter, setFilter] = useState<{ role?: string; status?: string }>({})
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      fetchLogs()
    }
  }, [user, filter])

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true)
      const params = new URLSearchParams()
      if (filter.role) params.append('role', filter.role)
      if (filter.status) params.append('status', filter.status)
      params.append('limit', '100')

      const response = await fetch(`/api/auth/login-logs?${params.toString()}`)
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Error fetching login logs:', error)
    } finally {
      setLoadingLogs(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-700 border-green-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
      blocked: 'bg-orange-100 text-orange-700 border-orange-200',
    }
    return (
      <Badge variant="secondary" className={variants[status as keyof typeof variants] || ''}>
        {status === 'success' && <CheckCircle2 className="w-3 h-3 mr-1" />}
        {status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
        {status === 'blocked' && <AlertTriangle className="w-3 h-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      customer: 'bg-blue-100 text-blue-700',
      delivery_partner: 'bg-green-100 text-green-700',
      admin: 'bg-purple-100 text-purple-700',
      super_admin: 'bg-red-100 text-red-700',
    }
    return (
      <Badge variant="secondary" className={variants[role as keyof typeof variants] || ''}>
        {role === 'super_admin' ? 'Super Admin' : role === 'delivery_partner' ? 'Delivery Partner' : role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      log.email?.toLowerCase().includes(query) ||
      log.phone?.toLowerCase().includes(query) ||
      log.user.name?.toLowerCase().includes(query) ||
      log.ipAddress?.toLowerCase().includes(query) ||
      log.role.toLowerCase().includes(query)
    )
  })

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.loginStatus === 'success').length,
    failed: logs.filter(l => l.loginStatus === 'failed').length,
    blocked: logs.filter(l => l.loginStatus === 'blocked').length,
  }

  if (loading || loadingLogs) {
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
                <h1 className="text-2xl font-bold text-foreground">Login Logs</h1>
                <p className="text-xs text-muted-foreground">Security and authentication monitoring</p>
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
        <Breadcrumb items={[{ label: 'Login Logs' }]} className="mb-6" />
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Logins</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Successful</p>
              <p className="text-2xl font-bold text-green-600">{stats.success}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Blocked</p>
              <p className="text-2xl font-bold text-orange-600">{stats.blocked}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, phone, name, IP..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={filter.role || ''}
              onChange={(e) => setFilter({ ...filter, role: e.target.value || undefined })}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="delivery_partner">Delivery Partner</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <select
              value={filter.status || ''}
              onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No login logs found</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm">{log.user.name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{log.email || log.phone || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getRoleBadge(log.role)}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(log.loginStatus)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {log.ipAddress || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-muted-foreground max-w-xs truncate">
                            {log.userAgent || 'N/A'}
                          </div>
                          {log.deviceFingerprint && (
                            <div className="text-xs text-muted-foreground mt-1 font-mono">
                              {log.deviceFingerprint.substring(0, 16)}...
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {log.failureReason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

