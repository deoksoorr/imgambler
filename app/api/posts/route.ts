import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { nanoid } from 'nanoid'
import { v4 as uuidv4 } from 'uuid'

const prismaClient = new PrismaClient()

// 관리자 이메일 목록. 추가하려면 아래 배열에 이메일을 넣으세요.
const ADMIN_EMAILS = ['a2381016@gmail.com']

// 랜덤 익명 닉네임 생성 함수
function generateAnonymousName() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `USER${suffix}`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy: [
          { isPinned: 'desc' },
          { isNotice: 'desc' },
          { createdAt: 'desc' }
        ],
        select: {
          id: true,
          title: true,
          content: true,
          postKey: true,
          isNotice: true,
          isPinned: true,
          createdAt: true,
          boardId: true,
          likes: true,
          dislikes: true,
          imageUrl: true,
          user: { select: { name: true, image: true, email: true } },
          board: true,
          _count: {
            select: {
              comments: true
            }
          }
        }
      }),
      prisma.post.count()
    ])

    // imageUrl이 항상 포함되도록 postsWithImage로 가공
    const postsWithImage = posts.map(post => ({
      ...post,
      imageUrl: post.imageUrl || null,
    }))

    return NextResponse.json({
      posts: postsWithImage,
      total,
      page,
      limit
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59'
      }
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { title, content, boardId, imageUrl, isNotice } = body

    if (!title || !content || !boardId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      )
    }

    const board = await prisma.board.findUnique({
      where: { id: parseInt(boardId) },
      include: { category: true }
    })

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    const post = await prisma.post.create({
      data: {
        postKey: uuidv4(),
        title,
        content,
        userCode: user.email,
        boardId: parseInt(boardId),
        imageUrl,
        isNotice: !!isNotice,
      },
      include: {
        user: true,
        board: {
          include: {
            category: true
          }
        }
      }
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error in POST /api/posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}