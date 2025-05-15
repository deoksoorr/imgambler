import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAILS = ['deoksoo.kim@gmail.com', 'a2381016@gmail.com']

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const board = await prisma.board.findUnique({
      where: { slug: params.slug },
      include: {
        category: true,
        posts: {
          orderBy: [
            { isPinned: 'desc' },
            { isNotice: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      }
    })

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(board)
  } catch (error) {
    console.error('Failed to fetch board:', error)
    return NextResponse.json(
      { error: 'Failed to fetch board' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    await prisma.board.delete({
      where: { slug: params.slug }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete board:', error)
    return NextResponse.json(
      { error: 'Failed to delete board' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { name, description, categoryId } = await request.json()
    
    // 새로운 slug 생성
    const newSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    
    const board = await prisma.board.update({
      where: { slug: params.slug },
      data: {
        name,
        description,
        categoryId: parseInt(categoryId),
        slug: newSlug
      }
    })

    return NextResponse.json(board)
  } catch (error) {
    console.error('Failed to update board:', error)
    return NextResponse.json(
      { error: 'Failed to update board' },
      { status: 500 }
    )
  }
} 