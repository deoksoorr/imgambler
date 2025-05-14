import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { image } = await request.json()
  if (!image) {
    return NextResponse.json({ error: 'Image is required' }, { status: 400 })
  }
  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { image },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    return NextResponse.json({ image: user?.image || null })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile image' }, { status: 500 })
  }
} 