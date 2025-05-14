import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ isAdmin: false }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    })
    return NextResponse.json({ isAdmin: !!user?.isAdmin })
  } catch (error) {
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
} 