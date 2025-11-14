'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Droplet, Save, ArrowLeft, TrendingUp } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Breadcrumb } from '@/components/admin/breadcrumb'
import { ImageUpload } from '@/components/image-upload'
import Link from 'next/link'

export default function EditBlogPostPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  const [saving, setSaving] = useState(false)
  const [loadingPost, setLoadingPost] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    authorName: '',
    status: 'draft',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    canonicalUrl: '',
    schemaMarkup: '',
    focusKeyword: '',
    seoScore: null as number | null,
  })

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if ((user?.role === 'admin' || user?.role === 'super_admin') && postId) {
      fetchPost()
    }
  }, [user, postId])

  const fetchPost = async () => {
    try {
      setLoadingPost(true)
      const response = await fetch(`/api/blogs/${postId}`)
      if (response.ok) {
        const post = await response.json()
        setFormData({
          title: post.title || '',
          slug: post.slug || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          featuredImage: post.featuredImage || '',
          authorName: post.authorName || user?.name || '',
          status: post.status || 'draft',
          metaTitle: post.metaTitle || '',
          metaDescription: post.metaDescription || '',
          metaKeywords: post.metaKeywords || '',
          ogTitle: post.ogTitle || '',
          ogDescription: post.ogDescription || '',
          ogImage: post.ogImage || '',
          canonicalUrl: post.canonicalUrl || '',
          schemaMarkup: post.schemaMarkup || '',
          focusKeyword: post.focusKeyword || '',
          seoScore: post.seoScore || null,
        })
      } else {
        alert('Failed to load blog post')
        router.push('/admin/blogs')
      }
    } catch (error) {
      console.error('Error fetching blog post:', error)
      alert('Failed to load blog post')
      router.push('/admin/blogs')
    } finally {
      setLoadingPost(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/blogs/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          authorId: user?.id,
          seoScore: formData.seoScore || null,
        }),
      })

      if (response.ok) {
        router.push('/admin/blogs')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update blog post')
      }
    } catch (error) {
      console.error('Error updating blog post:', error)
      alert('Failed to update blog post')
    } finally {
      setSaving(false)
    }
  }

  const calculateSeoScore = () => {
    let score = 0
    if (formData.title) score += 10
    if (formData.slug) score += 10
    if (formData.content && formData.content.length > 300) score += 15
    if (formData.excerpt) score += 10
    if (formData.metaTitle) score += 10
    if (formData.metaDescription && formData.metaDescription.length >= 120 && formData.metaDescription.length <= 160) score += 15
    if (formData.metaKeywords) score += 5
    if (formData.focusKeyword) score += 10
    if (formData.ogTitle) score += 5
    if (formData.ogDescription) score += 5
    if (formData.featuredImage) score += 5
    return score
  }

  useEffect(() => {
    const score = calculateSeoScore()
    setFormData((prev) => ({ ...prev, seoScore: score }))
  }, [formData.title, formData.slug, formData.content, formData.excerpt, formData.metaTitle, formData.metaDescription, formData.metaKeywords, formData.focusKeyword, formData.ogTitle, formData.ogDescription, formData.featuredImage])

  if (loading || loadingPost) {
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
      {/* Admin Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Edit Blog Post</h1>
                <p className="text-xs text-muted-foreground">Update & Optimize Content</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/blogs">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: 'Blogs & SEO', href: '/admin/blogs' }, { label: 'Edit Post' }]} className="mb-6" />
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter blog post title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="url-friendly-slug"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      URL: /blog/{formData.slug || 'your-slug'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Brief description of the post"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Write your blog post content here (HTML supported)"
                      rows={20}
                      required
                      className="font-mono text-sm"
                    />
                  </div>

                  <ImageUpload
                    label="Featured Image"
                    value={formData.featuredImage}
                    onChange={(url) => setFormData({ ...formData, featuredImage: url })}
                  />
                </CardContent>
              </Card>

              {/* SEO Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    SEO Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="focusKeyword">Focus Keyword</Label>
                    <Input
                      id="focusKeyword"
                      value={formData.focusKeyword}
                      onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                      placeholder="primary keyword"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      placeholder="SEO title (50-60 characters recommended)"
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.metaTitle.length}/60 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      placeholder="SEO description (120-160 characters recommended)"
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.metaDescription.length}/160 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metaKeywords">Meta Keywords</Label>
                    <Input
                      id="metaKeywords"
                      value={formData.metaKeywords}
                      onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="canonicalUrl">Canonical URL</Label>
                    <Input
                      id="canonicalUrl"
                      value={formData.canonicalUrl}
                      onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                      placeholder="https://example.com/blog/post"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schemaMarkup">Schema Markup (JSON-LD)</Label>
                    <Textarea
                      id="schemaMarkup"
                      value={formData.schemaMarkup}
                      onChange={(e) => setFormData({ ...formData, schemaMarkup: e.target.value })}
                      placeholder='{"@context": "https://schema.org", ...}'
                      rows={5}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Open Graph */}
              <Card>
                <CardHeader>
                  <CardTitle>Open Graph (Social Media)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ogTitle">OG Title</Label>
                    <Input
                      id="ogTitle"
                      value={formData.ogTitle}
                      onChange={(e) => setFormData({ ...formData, ogTitle: e.target.value })}
                      placeholder="Title for social media shares"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ogDescription">OG Description</Label>
                    <Textarea
                      id="ogDescription"
                      value={formData.ogDescription}
                      onChange={(e) => setFormData({ ...formData, ogDescription: e.target.value })}
                      placeholder="Description for social media shares"
                      rows={3}
                    />
                  </div>

                  <ImageUpload
                    label="OG Image (Social Media)"
                    value={formData.ogImage}
                    onChange={(url) => setFormData({ ...formData, ogImage: url })}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Publish</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="authorName">Author Name</Label>
                    <Input
                      id="authorName"
                      value={formData.authorName}
                      onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                      placeholder="Author name"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 gap-2"
                    disabled={saving}
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Update Post'}
                  </Button>
                </CardContent>
              </Card>

              {/* SEO Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    SEO Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                      {formData.seoScore || 0}
                      <span className="text-lg text-muted-foreground">/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className={`h-2 rounded-full ${
                          (formData.seoScore || 0) >= 80
                            ? 'bg-green-500'
                            : (formData.seoScore || 0) >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${formData.seoScore || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(formData.seoScore || 0) >= 80
                        ? 'Excellent!'
                        : (formData.seoScore || 0) >= 60
                        ? 'Good, but can be improved'
                        : 'Needs improvement'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

