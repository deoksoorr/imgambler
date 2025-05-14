import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

type PostResult = {
  post: {
    likes: number
    dislikes: number
  }
  userVote: 'like' | 'dislike' | null
  message: string
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 })

  const resolvedParams = await params
  const postId = Number(resolvedParams.id)
  const email = session.user.email

  // 트랜잭션으로 묶어서 처리
  const result = await prisma.$transaction(async (tx) => {
    const existingVote = await tx.vote.findUnique({
      where: {
        userEmail_postId: {
          userEmail: email,
          postId,
        },
      },
    })

    // 이미 싫어요를 눌렀으면 무시
    if (existingVote?.voteType === 'dislike') {
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { likes: true, dislikes: true },
      })
      if (!post) throw new Error('Post not found')
      return { post, userVote: null, message: 'already disliked' } as PostResult
    }

    // 좋아요 → 싫어요로 전환
    if (existingVote?.voteType === 'like') {
      await tx.vote.update({
        where: {
          userEmail_postId: {
            userEmail: email,
            postId,
          },
        },
        data: { voteType: 'dislike' },
      })

      const post = await tx.post.update({
        where: { id: postId },
        data: {
          likes: { decrement: 1 },
          dislikes: { increment: 1 },
        },
        select: { likes: true, dislikes: true },
      })

      return { post, userVote: 'dislike', message: 'changed to dislike' } as PostResult
    }

    // 첫 투표
    await tx.vote.create({
      data: {
        userEmail: email,
        postId,
        voteType: 'dislike',
      },
    })
    
    const post = await tx.post.update({
      where: { id: postId },
      data: {
        dislikes: { increment: 1 },
      },
      select: { likes: true, dislikes: true },
    })

    return { post, userVote: 'dislike', message: 'disliked' } as PostResult
  })

  const response = NextResponse.json({ 
    message: result.message,
    likes: result.post.likes,
    dislikes: result.post.dislikes,
    userVote: result.userVote
  })

  // 캐시 헤더 추가
  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('Pragma', 'no-cache')

  return response
}