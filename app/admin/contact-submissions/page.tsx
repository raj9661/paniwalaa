'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Droplet, Mail, Phone, User, MessageSquare, Trash2, Eye, EyeOff, AlertTriangle, Search, CheckCircle2, XCircle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth-context'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import Link from 'next/link'

interface ContactSubmission {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  ipAddress: string | null
  userAgent: string | null
  isRead: boolean
  isSpam: boolean
  spamScore: number | null
  readAt: string | null
  readBy: string | null
  createdAt: string
}

export default function ContactSubmissionsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null)
  const [viewDialog, setViewDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  })
  const [filter, setFilter] = useState<'all' | 'unread' | 'spam'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchSubmissions()
    }
  }, [user, filter])

  const fetchSubmissions = async () => {
    try {
      setLoadingSubmissions(true)
      const params = new URLSearchParams()
      if (filter === 'unread') {
        params.append('unreadOnly', 'true')
      } else if (filter === 'spam') {
        params.append('spamOnly', 'true')
      }
      params.append('limit', '100')

      const response = await fetch(`/api/contact?${params.toString()}`)
      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (error) {
      console.error('Error fetching contact submissions:', error)
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    try {
      await fetch(`/api/contact/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isRead: !isRead,
          readBy: user?.id,
        }),
      })
      fetchSubmissions()
    } catch (error) {
      console.error('Error updating submission:', error)
      alert('Failed to update submission')
    }
  }

  const handleToggleSpam = async (id: string, isSpam: boolean) => {
    try {
      await fetch(`/api/contact/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isSpam: !isSpam,
        }),
      })
      fetchSubmissions()
    } catch (error) {
      console.error('Error updating submission:', error)
      alert('Failed to update submission')
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.id) return

    try {
      const response = await fetch(`/api/contact/${deleteDialog.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSubmissions(submissions.filter((s) => s.id !== deleteDialog.id))
        setDeleteDialog({ open: false, id: null })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete submission')
      }
    } catch (error) {
      console.error('Error deleting submission:', error)
      alert('Failed to delete submission')
    }
  }

  const openViewDialog = (submission: ContactSubmission) => {
    setSelectedSubmission(submission)
    setViewDialog(true)
    // Mark as read when viewing
    if (!submission.isRead) {
      handleMarkAsRead(submission.id, false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredSubmissions = submissions.filter((submission) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      submission.name.toLowerCase().includes(query) ||
      submission.email.toLowerCase().includes(query) ||
      submission.subject.toLowerCase().includes(query) ||
      submission.message.toLowerCase().includes(query)
    )
  })

  const unreadCount = submissions.filter((s) => !s.isRead).length
  const spamCount = submissions.filter((s) => s.isSpam).length

  if (loading || loadingSubmissions) {
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
                <h1 className="text-2xl font-bold text-foreground">Contact Submissions</h1>
                <p className="text-xs text-muted-foreground">Manage customer inquiries</p>
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
        <Breadcrumb items={[{ label: 'Contact Submissions' }]} className="mb-6" />
        {/* Stats and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({submissions.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
                className="relative"
              >
                Unread ({unreadCount})
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              <Button
                variant={filter === 'spam' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('spam')}
              >
                Spam ({spamCount})
              </Button>
            </div>

            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search submissions..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No contact submissions found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <Card
                key={submission.id}
                className={`border-2 transition-colors ${
                  submission.isRead
                    ? 'bg-white'
                    : 'bg-blue-50 border-blue-200'
                } ${submission.isSpam ? 'border-red-200 bg-red-50' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{submission.name}</h3>
                            {!submission.isRead && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                New
                              </Badge>
                            )}
                            {submission.isSpam && (
                              <Badge variant="secondary" className="bg-red-100 text-red-700">
                                Spam
                              </Badge>
                            )}
                            {submission.spamScore !== null && submission.spamScore > 0.3 && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                                Suspicious ({Math.round(submission.spamScore * 100)}%)
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <a href={`mailto:${submission.email}`} className="hover:text-foreground">
                                {submission.email}
                              </a>
                            </div>
                            {submission.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <a href={`tel:${submission.phone}`} className="hover:text-foreground">
                                  {submission.phone}
                                </a>
                              </div>
                            )}
                            <span>{formatDate(submission.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <h4 className="font-semibold text-foreground mb-1">{submission.subject}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {submission.message}
                        </p>
                      </div>
                      {submission.ipAddress && (
                        <p className="text-xs text-muted-foreground">
                          IP: {submission.ipAddress}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewDialog(submission)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(submission.id, submission.isRead)}
                      >
                        {submission.isRead ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Mark Unread
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Mark Read
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleSpam(submission.id, submission.isSpam)}
                        className={submission.isSpam ? 'text-green-600' : 'text-orange-600'}
                      >
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {submission.isSpam ? 'Not Spam' : 'Mark Spam'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => setDeleteDialog({ open: true, id: submission.id })}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSubmission?.subject}</DialogTitle>
            <DialogDescription>
              Submitted on {selectedSubmission && formatDate(selectedSubmission.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">From</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {selectedSubmission.name}</p>
                  <p><strong>Email:</strong> <a href={`mailto:${selectedSubmission.email}`} className="text-blue-600 hover:underline">{selectedSubmission.email}</a></p>
                  {selectedSubmission.phone && (
                    <p><strong>Phone:</strong> <a href={`tel:${selectedSubmission.phone}`} className="text-blue-600 hover:underline">{selectedSubmission.phone}</a></p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Message</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedSubmission.message}</p>
              </div>
              {selectedSubmission.ipAddress && (
                <div>
                  <h4 className="font-semibold mb-2">Technical Details</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p><strong>IP Address:</strong> {selectedSubmission.ipAddress}</p>
                    {selectedSubmission.userAgent && (
                      <p><strong>User Agent:</strong> {selectedSubmission.userAgent}</p>
                    )}
                    {selectedSubmission.spamScore !== null && (
                      <p><strong>Spam Score:</strong> {Math.round(selectedSubmission.spamScore * 100)}%</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, id: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contact submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

