import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/blogs/[id] - Get a single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const post = await prisma.blogPost.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...post,
      id: post.id.toString(),
      authorId: post.authorId?.toString() || null,
      views: post.views.toString(),
      publishedAt: post.publishedAt?.toISOString() || null,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    )
  }
}

// PUT /api/blogs/[id] - Update a blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)
    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      authorId,
      authorName,
      status,
      metaTitle,
      metaDescription,
      metaKeywords,
      ogTitle,
      ogDescription,
      ogImage,
      canonicalUrl,
      schemaMarkup,
      focusKeyword,
      seoScore,
    } = body

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Check if slug is being changed and if it already exists
    if (slug && slug !== existingPost.slug) {
      const slugExists = await prisma.blogPost.findUnique({
        where: { slug },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'A blog post with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Determine publishedAt based on status change
    let publishedAt = existingPost.publishedAt
    if (status === 'published' && existingPost.status !== 'published') {
      publishedAt = new Date()
    } else if (status !== 'published' && existingPost.status === 'published') {
      publishedAt = null
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(excerpt !== undefined && { excerpt }),
        ...(content && { content }),
        ...(featuredImage !== undefined && { featuredImage }),
        ...(authorId !== undefined && { authorId: authorId ? BigInt(authorId) : null }),
        ...(authorName !== undefined && { authorName }),
        ...(status && { status }),
        ...(publishedAt !== undefined && { publishedAt }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(metaKeywords !== undefined && { metaKeywords }),
        ...(ogTitle !== undefined && { ogTitle }),
        ...(ogDescription !== undefined && { ogDescription }),
        ...(ogImage !== undefined && { ogImage }),
        ...(canonicalUrl !== undefined && { canonicalUrl }),
        ...(schemaMarkup !== undefined && { schemaMarkup }),
        ...(focusKeyword !== undefined && { focusKeyword }),
        ...(seoScore !== undefined && { seoScore }),
      },
    })

    return NextResponse.json({
      ...post,
      id: post.id.toString(),
      authorId: post.authorId?.toString() || null,
      views: post.views.toString(),
      publishedAt: post.publishedAt?.toISOString() || null,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Error updating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

// DELETE /api/blogs/[id] - Delete a blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = BigInt(idParam)

    const post = await prisma.blogPost.findUnique({
      where: { id },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    await prisma.blogPost.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Blog post deleted successfully' })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}

