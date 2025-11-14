'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Droplet, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  FileText,
  TrendingUp,
  Calendar,
  User
} from 'lucide-react'
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
import { useAuth } from '@/lib/auth-context'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import Link from 'next/link'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  status: string
  views: string
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  authorName: string | null
  metaTitle: string | null
  seoScore: number | null
}

export default function AdminBlogsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; postId: string | null }>({
    open: false,
    postId: null,
  })

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchPosts()
    }
  }, [user])

  useEffect(() => {
    filterPosts()
  }, [posts, searchQuery, statusFilter])

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true)
      const response = await fetch('/api/blogs?limit=100')
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Error fetching blog posts:', error)
    } finally {
      setLoadingPosts(false)
    }
  }

  const filterPosts = () => {
    let filtered = posts

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((post) => post.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.slug.toLowerCase().includes(query) ||
          (post.excerpt && post.excerpt.toLowerCase().includes(query))
      )
    }

    setFilteredPosts(filtered)
  }

  const handleDelete = async () => {
    if (!deleteDialog.postId) return

    try {
      const response = await fetch(`/api/blogs/${deleteDialog.postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== deleteDialog.postId))
        setDeleteDialog({ open: false, postId: null })
      } else {
        alert('Failed to delete blog post')
      }
    } catch (error) {
      console.error('Error deleting blog post:', error)
      alert('Failed to delete blog post')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { className: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Draft' },
      published: { className: 'bg-green-100 text-green-700 border-green-200', label: 'Published' },
      archived: { className: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Archived' },
    }
    const config = variants[status as keyof typeof variants] || variants.draft
    return <Badge variant="secondary" className={config.className}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading || loadingPosts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
    totalViews: posts.reduce((sum, p) => sum + parseInt(p.views || '0'), 0),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Admin Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Paniwalaa Admin</h1>
                <p className="text-xs text-muted-foreground">Blog & SEO Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Blogs & SEO' }]} className="mb-6" />
        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Posts</p>
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Published</p>
              <p className="text-3xl font-bold text-foreground">{stats.published}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Drafts</p>
              <p className="text-3xl font-bold text-foreground">{stats.draft}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Views</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalViews.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Blog Posts List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-2xl">Blog Posts</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search posts..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Link href="/admin/blogs/new">
                  <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 gap-2">
                    <Plus className="w-4 h-4" />
                    New Post
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="space-y-4">
              <TabsList className="bg-white border-2">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="published">Published ({stats.published})</TabsTrigger>
                <TabsTrigger value="draft">Drafts ({stats.draft})</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>

              <TabsContent value={statusFilter} className="space-y-4">
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No blog posts found</p>
                    <Link href="/admin/blogs/new">
                      <Button className="mt-4" variant="outline">
                        Create your first post
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPosts.map((post) => (
                      <Card key={post.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h3 className="font-bold text-foreground text-lg mb-1">
                                    {post.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    /{post.slug}
                                  </p>
                                  {post.excerpt && (
                                    <p className="text-sm text-foreground line-clamp-2 mb-3">
                                      {post.excerpt}
                                    </p>
                                  )}
                                </div>
                                {getStatusBadge(post.status)}
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(post.createdAt)}
                                </div>
                                {post.authorName && (
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {post.authorName}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {parseInt(post.views || '0').toLocaleString()} views
                                </div>
                                {post.seoScore !== null && (
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    SEO: {post.seoScore}/100
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Link href={`/admin/blogs/${post.id}`}>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 text-red-600 hover:text-red-700"
                                onClick={() =>
                                  setDeleteDialog({ open: true, postId: post.id })
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, postId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the blog post.
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

