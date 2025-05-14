import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const ADMIN_EMAILS = ['a2381016@gmail.com']

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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { name, description } = await request.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const category = await prisma.category.create({ data: { name, description } })
  return NextResponse.json(category)
} 