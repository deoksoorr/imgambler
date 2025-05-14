import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 관리자 이메일 목록. 추가하려면 아래 배열에 이메일을 넣으세요.
const ADMIN_EMAILS = ['a2381016@gmail.com']

// 글 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const id = parseInt(resolvedParams.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: true,
        board: true,
        _count: {
          select: {
            comments: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // 조회수 증가
    await prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } }
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

// 글 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = await params
  const id = parseInt(resolvedParams.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })
  }

  try {
    const body = await request.json()
    // isPinned만 토글하는 경우 (관리자만)
    if (typeof body.isPinned === 'boolean' && Object.keys(body).length === 1) {
      if (!ADMIN_EMAILS.includes(session.user.email)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const updatedPost = await prisma.post.update({
        where: { id },
        data: { isPinned: body.isPinned, updatedAt: new Date() },
        include: { user: true, _count: { select: { comments: true } } }
      })
      return NextResponse.json(updatedPost)
    }
    // 기존 글 수정 로직
    const { title, content } = body
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }
    // 글 작성자 확인
    const post = await prisma.post.findUnique({
      where: { id },
      include: { user: true }
    })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    if (post.user?.email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        updatedAt: new Date()
      },
      include: {
        user: true,
        _count: {
          select: {
            comments: true
          }
        }
      }
    })
    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

// 글 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = await params
  const id = parseInt(resolvedParams.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })
  }

  try {
    // 글 작성자 확인
    const post = await prisma.post.findUnique({
      where: { id },
      include: { user: true, board: true }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.user?.email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관련된 댓글과 투표도 함께 삭제
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { postId: id } }),
      prisma.vote.deleteMany({ where: { postId: id } }),
      prisma.post.delete({ where: { id } })
    ])

    return NextResponse.json({ message: 'Post deleted successfully', board: post.board })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
} 