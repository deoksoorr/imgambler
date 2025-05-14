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

export async function POST(req: Request, context: { params: { id?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 })

  const params = await context.params
  const idParam = params?.id
  if (!idParam) return new NextResponse('Post ID missing', { status: 400 })

  const postId = Number(idParam)
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

    // 이미 좋아요 눌렀으면 무시
    if (existingVote?.voteType === 'like') {
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { likes: true, dislikes: true },
      })
      if (!post) throw new Error('Post not found')
      return { post, userVote: null, message: 'already liked' } as PostResult
    }

    // 싫어요 → 좋아요 전환
    if (existingVote?.voteType === 'dislike') {
      await tx.vote.update({
        where: {
          userEmail_postId: { userEmail: email, postId },
        },
        data: { voteType: 'like' },
      })

      const post = await tx.post.update({
        where: { id: postId },
        data: {
          likes: { increment: 1 },
          dislikes: { decrement: 1 },
        },
        select: { likes: true, dislikes: true },
      })

      return { post, userVote: 'like', message: 'changed to like' } as PostResult
    }

    // 첫 좋아요
    await tx.vote.create({
      data: {
        userEmail: email,
        postId,
        voteType: 'like',
      },
    })

    const post = await tx.post.update({
      where: { id: postId },
      data: {
        likes: { increment: 1 },
      },
      select: { likes: true, dislikes: true },
    })

    return { post, userVote: 'like', message: 'liked' } as PostResult
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