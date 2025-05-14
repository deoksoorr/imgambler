import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email || !['a2381016@gmail.com'].includes(session.user.email)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { isAdmin } = await request.json()

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isAdmin },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to update user:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 