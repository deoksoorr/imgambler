import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { categorySlug: string; boardSlug: string; postKey: string } }
) {
  try {
    const category = await prisma.category.findFirst({
      where: { 
        name: params.categorySlug.toUpperCase().replace(/-/g, ' ')
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const board = await prisma.board.findFirst({
      where: { 
        slug: params.boardSlug,
        categoryId: category.id
      }
    })

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    const post = await prisma.post.findUnique({
      where: { postKey: params.postKey },
      include: {
        user: true,
        board: true
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error in GET /api/board/[categorySlug]/[boardSlug]/[postKey]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { categorySlug: string; boardSlug: string; postKey: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const category = await prisma.category.findFirst({
      where: { 
        name: params.categorySlug.toUpperCase().replace(/-/g, ' ')
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const board = await prisma.board.findFirst({
      where: { 
        slug: params.boardSlug,
        categoryId: category.id
      }
    })

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    const post = await prisma.post.findUnique({
      where: { postKey: params.postKey },
      include: { user: true }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (post.user?.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, content, imageUrl } = body

    const updatedPost = await prisma.post.update({
      where: { id: post.id },
      data: {
        title,
        content,
        updatedAt: new Date(),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
      },
      include: {
        user: true,
        board: true
      }
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error in PATCH /api/board/[categorySlug]/[boardSlug]/[postKey]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { categorySlug: string; boardSlug: string; postKey: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const category = await prisma.category.findFirst({
      where: { 
        name: params.categorySlug.toUpperCase().replace(/-/g, ' ')
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const board = await prisma.board.findFirst({
      where: { 
        slug: params.boardSlug,
        categoryId: category.id
      }
    })

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    const post = await prisma.post.findUnique({
      where: { postKey: params.postKey },
      include: { user: true }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (
      post.user?.email !== session.user.email &&
      session.user.email !== 'a2381016@gmail.com' // 관리자 이메일 허용
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 게시글에 연결된 댓글 먼저 삭제
    await prisma.comment.deleteMany({
      where: { postId: post.id }
    });
    // 게시글에 연결된 투표(Vote)도 먼저 삭제
    await prisma.vote.deleteMany({
      where: { postId: post.id }
    });
    // 게시글 삭제
    await prisma.post.delete({
      where: { id: post.id }
    });

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/board/[categorySlug]/[boardSlug]/[postKey]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 