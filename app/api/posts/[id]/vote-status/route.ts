import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request, context: { params: { id: string } }) {
  const params = await context.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ userVote: null })
  }
  const postId = Number(params.id)
  const email = session.user.email
  const vote = await prisma.vote.findUnique({
    where: {
      userEmail_postId: {
        userEmail: email,
        postId,
      },
    },
  })
  return NextResponse.json({ userVote: vote?.voteType || null })
} 