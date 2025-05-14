import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../../../lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { categorySlug: string, boardSlug: string, postKey: string } }) {
  try {
    // 조회수 증가
    const post = await prisma.post.update({
      where: { postKey: params.postKey },
      data: { views: { increment: 1 } }
    })
    
    return NextResponse.json({ views: post.views }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error incrementing view count:', error)
    return NextResponse.json({ error: '조회수 증가 실패' }, { status: 500 })
  }
} 