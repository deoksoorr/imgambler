import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  const result = await prisma.vote.findMany()
  return NextResponse.json(result)
}

export async function POST() {
  const newVote = await prisma.vote.create({
    data: {
      userEmail: 'test@example.com',
      postId: 1,
      voteType: 'like',
    },
  })

  return NextResponse.json(newVote)
}