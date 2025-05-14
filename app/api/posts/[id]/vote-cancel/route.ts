import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const postId = Number(params.id)
  const email = session.user.email

  const result = await prisma.$transaction(async (tx) => {
    const existingVote = await tx.vote.findUnique({
      where: {
        userEmail_postId: {
          userEmail: email,
          postId,
        },
      },
    })
    if (!existingVote) {
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { likes: true, dislikes: true },
      })
      return { post, userVote: null, message: 'no vote to cancel' }
    }
    // 투표 삭제
    await tx.vote.delete({
      where: {
        userEmail_postId: {
          userEmail: email,
          postId,
        },
      },
    })
    // 점수 감소
    let post
    if (existingVote.voteType === 'like') {
      post = await tx.post.update({
        where: { id: postId },
        data: { likes: { decrement: 1 } },
        select: { likes: true, dislikes: true },
      })
    } else {
      post = await tx.post.update({
        where: { id: postId },
        data: { dislikes: { decrement: 1 } },
        select: { likes: true, dislikes: true },
      })
    }
    return { post, userVote: null, message: 'vote cancelled' }
  })

  if (!result.post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  return NextResponse.json({
    message: result.message,
    likes: result.post.likes,
    dislikes: result.post.dislikes,
    userVote: result.userVote,
  })
} 