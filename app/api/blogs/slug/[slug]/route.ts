import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/blogs/slug/[slug] - Get a blog post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const post = await prisma.blogPost.findUnique({
      where: { slug },
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Only return published posts for public access
    if (post.status !== 'published') {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        views: {
          increment: 1,
        },
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching blog post by slug:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    )
  }
}

