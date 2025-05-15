import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const ADMIN_EMAILS = ['deoksoo.kim@gmail.com', 'a2381016@gmail.com']

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { id: 'asc' },
    include: { boards: true }
  })
  return NextResponse.json(categories)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { name, description } = await request.json()
    
    // 카테고리 이름을 대문자로 변환
    const category = await prisma.category.create({
      data: {
        name: name.toUpperCase(),
        description
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
} 