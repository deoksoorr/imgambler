import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const postId = parseInt(params.id, 10)
  const commentId = parseInt(params.commentId, 10)
  if (isNaN(postId) || isNaN(commentId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  })

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }

  if (comment.userEmail !== session.user.email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { content } = await request.json()
  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: {
      content,
      updatedAt: new Date(),
    },
  })

  return NextResponse.json(updatedComment)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const postId = parseInt(params.id, 10)
  const commentId = parseInt(params.commentId, 10)
  if (isNaN(postId) || isNaN(commentId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  })

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }

  if (comment.userEmail !== session.user.email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: {
      content: 'This comment has been deleted.',
      deleted: true,
    },
  })

  return NextResponse.json({ success: true })
} 